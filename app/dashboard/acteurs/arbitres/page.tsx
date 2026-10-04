import { CnacSourceError } from "@/components/dashboard/cnac-source-error"
import { cnacError } from "@/lib/cnac/errors"
import { getActeursSpreadsheetId } from "@/lib/acteurs/config"
import { getReferentialSpreadsheetId } from "@/lib/federations/config"
import { getFederationOptions } from "@/lib/cnac/federation-options"
import { getSheetRows } from "@/lib/cnac/sheets"
import ArbitresClient, { type ArbitreListItem, type GradeOption } from "./arbitres-client"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "force-no-store"

async function ArbitresPage() {
  const [rows, federations, gradeRows] = await Promise.all([
    getSheetRows({ sheetName: "ARBITRES", spreadsheetId: getActeursSpreadsheetId(), bypassCache: true }),
    getFederationOptions(),
    getSheetRows({ sheetName: "GRADES_ARBITRE", spreadsheetId: getReferentialSpreadsheetId(), bypassCache: true }),
  ])
  const federationById = new Map(federations.map((federation) => [federation.id, federation]))
  const gradeById = new Map(gradeRows.map((grade) => [grade.id_grade_arbitre, grade]))
  const arbitres: ArbitreListItem[] = rows.filter((r) => r.id_arbitre_coc).map((r) => ({ id: r.id_arbitre_coc, idNational: r.id_national || "", idFederal: r.id_arbitre_federation || "", nomComplet: r.nom_complet || "", sexe: r.id_sexe || r.nom_sexe || "", federation: federationById.get(r.id_federation || "")?.sigle || federationById.get(r.id_federation || "")?.nom || (r.id_federation ? `Référence inconnue (${r.id_federation})` : ""), federationId: r.id_federation || "", grade: gradeById.get(r.id_grade_arbitre || r.id_grade || "")?.nom_grade || r.nom_grade || "", statut: r.statut || "", avatar: r.avatar_drive_url || null }))
  const grades: GradeOption[] = gradeRows.filter((r) => r.id_grade_arbitre).map((r) => ({ id: r.id_grade_arbitre, nom: r.nom_grade || r.id_grade_arbitre, idSport: r.id_sport || "", idDiscipline: r.id_discipline || "" })).sort((a, b) => a.nom.localeCompare(b.nom, "fr"))
  return <ArbitresClient arbitres={arbitres} federations={federations} grades={grades} />
}

export default async function ConnectedPage() {
  try { return await ArbitresPage() } catch(error) {
    if(error && typeof error === "object" && "digest" in error && String(error.digest).startsWith("NEXT_")) throw error
    return <CnacSourceError message={cnacError(error).message} />
  }
}
