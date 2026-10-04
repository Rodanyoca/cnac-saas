import { CnacDataError } from "./model.ts"

export function cnacError(error: unknown): CnacDataError {
  if (error instanceof CnacDataError) return error
  const candidate = error as { code?: unknown; response?: {status?:number}; status?:number }
  const status = Number(candidate?.response?.status || candidate?.status || candidate?.code)
  if (status === 401 || status === 403) return new CnacDataError("GOOGLE_PERMISSION", "Accès Google refusé. Vérifier le compte de service et le partage du classeur CNAC.",502)
  if (status === 429) return new CnacDataError("GOOGLE_QUOTA", "Quota Google temporairement dépassé. Réessayer plus tard.",429)
  if (status === 404) return new CnacDataError("GOOGLE_NOT_FOUND", "Classeur ou feuille Google CNAC introuvable.",502)
  return new CnacDataError("GOOGLE_UNAVAILABLE", "Chargement Google CNAC impossible. Réessayer après vérification de la connexion.",502)
}
