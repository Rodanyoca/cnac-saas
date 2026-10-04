import { hasValidFederationLogoSignature, validateFederationLogo, type FederationLogoResult, type FederationLogoUploadInput } from "./logo.ts"

type HandlerDependencies = {
  canWrite: () => Promise<boolean>
  replace: (input: Omit<FederationLogoUploadInput, "folderId">) => Promise<FederationLogoResult>
}

export async function handleFederationLogoUpload(request: Request, federationId: string, dependencies: HandlerDependencies): Promise<Response> {
  if (!await dependencies.canWrite()) return Response.json({ error: "Vous n’êtes pas autorisé à modifier ce logo." }, { status: 403 })
  try {
    const formData = await request.formData()
    const file = formData.get("file")
    if (!(file instanceof File)) return Response.json({ error: "Aucun fichier fourni." }, { status: 400 })
    const validation = validateFederationLogo(file)
    if (!validation.ok) return Response.json({ error: validation.error }, { status: 400 })
    const buffer = Buffer.from(await file.arrayBuffer())
    if (!hasValidFederationLogoSignature(buffer, file.type)) return Response.json({ error: "Le contenu du fichier ne correspond pas à une image autorisée." }, { status: 400 })
    const result = await dependencies.replace({
      federationId,
      fileName: file.name,
      mimeType: file.type,
      buffer,
    })
    return Response.json(result, { headers: { "Cache-Control": "no-store, max-age=0" } })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Le logo n’a pas pu être enregistré."
    if (message === "Fédération introuvable.") return Response.json({ error: message }, { status: 404 })
    const normalized = message.toLowerCase()
    if (normalized.includes("quota exceeded") || normalized.includes("rate limit")) {
      return Response.json({ error: "Google est temporairement saturé. Réessayez dans une minute." }, { status: 429 })
    }
    if (message.includes("GOOGLE_DRIVE_FEDERATION_LOGOS_FOLDER_ID")) {
      return Response.json({ error: "Le stockage des logos de fédérations n’est pas configuré sur le serveur." }, { status: 503 })
    }
    if (normalized.includes("variables oauth2 drive manquantes") || normalized.includes("invalid_grant") || normalized.includes("connexion google drive expirée")) {
      return Response.json({ error: "La connexion du serveur à Google Drive doit être rétablie." }, { status: 503 })
    }
    if (normalized.includes("insufficient permission") || normalized.includes("insufficientpermissions") || normalized.includes("permission") || normalized.includes("forbidden")) {
      return Response.json({ error: "Le dossier Google Drive des logos n’autorise pas cette opération." }, { status: 503 })
    }
    return Response.json({ error: "Le logo n’a pas pu être enregistré." }, { status: 500 })
  }
}
