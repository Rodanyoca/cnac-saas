import { CnacSourceError } from "@/components/dashboard/cnac-source-error"
import { cnacError } from "@/lib/cnac/errors"
import { notFound } from "next/navigation"
import { getActeursSpreadsheetId } from "@/lib/acteurs/config"
import { getFederationOptions } from "@/lib/cnac/federation-options"
import { getSheetRows } from "@/lib/cnac/sheets"
import { EntraineurDetailClient, type CoachDetail, type FederationOption } from "./entraineur-detail-client"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "force-no-store"

// Les données Coach proviennent exclusivement de la feuille COACHS de 02_ACTEURS.

async function EntraineurDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [rows, federationRows] = await Promise.all([
    getSheetRows({ sheetName: "COACHS", spreadsheetId: getActeursSpreadsheetId() }),
    getFederationOptions(),
  ])
  const r = rows.find((row) => row.id_coach_coc === id)
  if (!r) notFound()
  const linkedFederation = federationRows.find((federation) => federation.id === r.id_federation)
  const coach: CoachDetail = { id: r.id_coach_coc, idFederation: r.id_federation || "", idNational: r.id_national || "", idFederal: r.id_coach_federation || "", idInternational: r.id_international || "", nomComplet: r.nom_complet || "", idSexe: r.id_sexe, sexe: r.nom_sexe || r.id_sexe || "", dateNaissance: r.date_de_naissance || "", lieuNaissance: r.lieu_de_naissance || "", nationalite: r.nationalite || "", federation: linkedFederation?.sigle || linkedFederation?.nom || (r.id_federation ? `Référence inconnue (${r.id_federation})` : ""), telephone: r.telephone || "", email: r.email || "", adresse: r.adresse || "", statut: r.statut?.toLowerCase() || "", avatarUrl: r.avatar_drive_url || null, urlPasseport: r.passeport_drive_url || null, numeroPasseport: r.numero_passeport || "", dateDelivrancePasseport: r.date_de_delivrance_passeport || "", dateExpirationPasseport: r.date_expiration_passeport || "" }
  const federations: FederationOption[] = federationRows.map(({ id, sigle, nom }) => ({ id, sigle, nom }))
  return <EntraineurDetailClient coach={coach} federations={federations} />
}

export default async function ConnectedPage(props: Parameters<typeof EntraineurDetailPage>[0]) {
  try { return await EntraineurDetailPage(props) } catch(error) {
    if(error && typeof error === "object" && "digest" in error && String(error.digest).startsWith("NEXT_")) throw error
    return <CnacSourceError message={cnacError(error).message} />
  }
}
