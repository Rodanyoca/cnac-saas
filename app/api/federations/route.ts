import { CnacDataError } from "@/lib/cnac/model"
import { errorResponse, writeAccess } from "@/lib/cnac/actor-handler"
import { revalidatePath } from "next/cache"
import { NextResponse } from "next/server"
import { canAccess } from "@/lib/auth"
import { buildFederationCreationRows } from "@/lib/federations/creation"
import { prepareOrSave, readSaveBody } from "@/lib/cnac/media-save"
import { loadFederations } from "@/lib/federations/data"
import { withCnacCreationQueue } from "@/lib/cnac/identifiers"
import { FederationCreationError } from "@/lib/federations/creation-model"

export const runtime = "nodejs"
export async function POST(request: Request) {
  return withCnacCreationQueue("media:FEDERATIONS", () => save(request))
}
async function save(request: Request) {
  const accessDenial=await writeAccess();if(accessDenial)return accessDenial
  if (!(await canAccess("AUT-SPT", "WRITE"))) return NextResponse.json({ error: "Accès refusé." }, { status: 403 })
  try {
    const { body, file } = await readSaveBody(request, "logo")
    // Le formulaire historique envoie les champs directement dans data.
    const raw = (body.row || body) as Record<string, unknown>
    const normalizedBody = { row: raw, ticket: body.ticket }
    // Exclure le ticket des données métier et de leur empreinte.
    delete raw.ticket
    const result = await prepareOrSave({ scope: "federation:POST", body: normalizedBody, file, kind: "logo", buildRows: () => buildFederationCreationRows(raw) })
    if (result instanceof Response) return result
    revalidatePath("/dashboard/federations")
    const id = result.plan.rows.find(row => row.sheet === "FEDERATIONS")!.id
    const federation = (await loadFederations()).find(row => row.id_federation === id)
    return NextResponse.json({ ok: true, federation }, { status: 201 })
  } catch (error) {
    if (error instanceof CnacDataError) return errorResponse(error)
    const known = error instanceof FederationCreationError
    return NextResponse.json({ error: known ? error.message : "La fédération n’a pas pu être enregistrée.", field: known ? error.field : undefined }, { status: known ? 400 : 500 })
  }
}
