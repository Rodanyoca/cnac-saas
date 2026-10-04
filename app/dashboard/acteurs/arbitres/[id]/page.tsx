import { CnacSourceError } from "@/components/dashboard/cnac-source-error"
import { cnacError } from "@/lib/cnac/errors"
import { notFound } from "next/navigation"
import { getActeursSpreadsheetId } from "@/lib/acteurs/config"
import { getReferentialSpreadsheetId } from "@/lib/federations/config"
import { getFederationOptions } from "@/lib/cnac/federation-options"
import { getSheetRows } from "@/lib/cnac/sheets"
import { ArbitreDetailClient, type ArbitreDetail } from "./arbitre-detail-client"
import type { GradeOption } from "../arbitres-client"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

async function ArbitreDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [rows, federations, gradeRows] = await Promise.all([
    getSheetRows({ sheetName: "ARBITRES", spreadsheetId: getActeursSpreadsheetId() }),
    getFederationOptions(),
    getSheetRows({ sheetName: "GRADES_ARBITRE", spreadsheetId: getReferentialSpreadsheetId(), bypassCache: true }),
  ])
  const r = rows.find((row) => row.id_arbitre_coc === id)
  if (!r) notFound()
  const linkedFederation = federations.find((federation) => federation.id === r.id_federation)
  const linkedGrade = gradeRows.find((grade) => grade.id_grade_arbitre === (r.id_grade_arbitre || r.id_grade))
  const arbitre: ArbitreDetail = { id: r.id_arbitre_coc, idFederation: r.id_federation || "", idFederal: r.id_arbitre_federation || "", idNational: r.id_national || "", idInternational: r.id_international || "", nomComplet: r.nom_complet || "", sexe: r.id_sexe || r.nom_sexe || "", dateNaissance: r.date_de_naissance || "", lieuNaissance: r.lieu_de_naissance || "", nationalite: r.nationalite || "", federation: linkedFederation?.sigle || linkedFederation?.nom || (r.id_federation ? `Référence inconnue (${r.id_federation})` : ""), idGrade: r.id_grade_arbitre || r.id_grade || "", grade: linkedGrade?.nom_grade || r.nom_grade || "", dateAffiliation: r.date_affiliation || "", telephone: r.telephone || "", email: r.email || "", adresse: r.adresse || "", numeroPasseport: r.numero_passeport || "", dateDelivrancePasseport: r.date_de_delivrance_passeport || "", dateExpirationPasseport: r.date_expiration_passeport || "", statut: r.statut?.toLowerCase() || "", avatarUrl: r.avatar_drive_url || null, urlPasseport: r.passeport_drive_url || null }
  const grades: GradeOption[] = gradeRows.filter((row) => row.id_grade_arbitre).map((row) => ({ id: row.id_grade_arbitre, nom: row.nom_grade || row.id_grade_arbitre, idSport: row.id_sport || "", idDiscipline: row.id_discipline || "" })).sort((a, b) => a.nom.localeCompare(b.nom, "fr"))
  return <ArbitreDetailClient arbitre={arbitre} federations={federations} grades={grades} />
}

export default async function ConnectedPage(props: Parameters<typeof ArbitreDetailPage>[0]) {
  try { return await ArbitreDetailPage(props) } catch(error) {
    if(error && typeof error === "object" && "digest" in error && String(error.digest).startsWith("NEXT_")) throw error
    return <CnacSourceError message={cnacError(error).message} />
  }
}
