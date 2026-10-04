import { CnacSourceError } from "@/components/dashboard/cnac-source-error"
import { cnacError } from "@/lib/cnac/errors"
import { getActeursSpreadsheetId } from "@/lib/acteurs/config"
import { getFederationOptions } from "@/lib/cnac/federation-options"
import { getSheetRows } from "@/lib/cnac/sheets"
import EntraineursClient, { type CoachListItem, type FederationOption } from "./entraineurs-client"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "force-no-store"

async function EntraineursPage() {
  const [rows, federationRows] = await Promise.all([
    getSheetRows({ sheetName: "COACHS", spreadsheetId: getActeursSpreadsheetId(), bypassCache: true }),
    getFederationOptions(),
  ])
  const federationById = new Map(federationRows.map((federation) => [federation.id, federation]))
  const coachs: CoachListItem[] = rows.filter((r) => r.id_coach_coc).map((r) => ({
    id: r.id_coach_coc,
    idNational: r.id_national || "",
    idFederal: r.id_coach_federation || "",
    nomComplet: r.nom_complet || "",
    sexe: r.nom_sexe || r.id_sexe || "",
    dateNaissance: r.date_de_naissance || "",
    federation: federationById.get(r.id_federation || "")?.sigle || federationById.get(r.id_federation || "")?.nom || (r.id_federation ? `Référence inconnue (${r.id_federation})` : ""),
    federationId: r.id_federation || "",
    statut: r.statut || "",
    avatar: r.avatar_drive_url || null,
  }))
  const federations: FederationOption[] = federationRows.map(({ id, sigle, nom }) => ({ id, sigle, nom }))
  return <EntraineursClient coachs={coachs} federations={federations} />
}

export default async function ConnectedPage() {
  try { return await EntraineursPage() } catch(error) {
    if(error && typeof error === "object" && "digest" in error && String(error.digest).startsWith("NEXT_")) throw error
    return <CnacSourceError message={cnacError(error).message} />
  }
}
