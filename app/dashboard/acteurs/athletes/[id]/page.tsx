import { cnacMediaUrl } from "@/lib/cnac/media-url"
import { loadAffiliationReferences } from "@/lib/cnac/affiliation-data"
import { CnacSourceError } from "@/components/dashboard/cnac-source-error"
import { cnacError } from "@/lib/cnac/errors"
import { notFound } from "next/navigation"

import { getActeursSpreadsheetId } from "@/lib/acteurs/config"
import { ACTOR_SHEETS } from "@/lib/acteurs/sheets"
import { getFederationOptions } from "@/lib/cnac/federation-options"
import { getSheetRows } from "@/lib/cnac/sheets"
import { AthleteDetailClient, type AthleteDetail } from "./athlete-detail-client"
import type { FederationOption } from "../athletes-client"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "force-no-store"

async function AthleteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [rows, federationRows, affiliationRefs] = await Promise.all([
    getSheetRows({
      sheetName: ACTOR_SHEETS.ATHLETE,
      spreadsheetId: getActeursSpreadsheetId(),
    }),
    getFederationOptions({ fresh: true }),
    loadAffiliationReferences(),
  ])
  const federationById = new Map(federationRows.map((item) => [item.id, item.sigle || item.nom || item.id]))
  const row = rows.find((item) => item.id_athlete_coc === id)

  if (!row) notFound()

  const athlete: AthleteDetail = {
    id: row.id_athlete_coc,
    observations: row.observations || "",
    idClub: row.id_club_cnac || "",
    idEquipe: row.id_equipe_cnac || "",
    idFederation: row.id_federation || "",
    idNational: row.id_national || "",
    idFederal: row.id_athlete_federation || "",
    idInternational: row.id_federation_internationale || "",
    nomComplet: row.nom_complet || "",
    idSexe: row.id_sexe, sexe: row.nom_sexe || row.id_sexe || "",
    dateNaissance: row.date_de_naissance || "",
    lieuNaissance: row.lieu_de_naissance || "",
    federation: federationById.get(row.id_federation) || (row.id_federation ? `Référence inconnue (${row.id_federation})` : ""),
    telephone: row.telephone || "",
    email: row.email || "",
    adresse: row.adresse || "",
    statut: row.statut?.toLowerCase() || undefined,
    avatarUrl: cnacMediaUrl("avatar", row.id_athlete_cnac || row.id_athlete_coc, row.avatar_drive_id || "") || null,
    urlPasseport: row.passeport_drive_url || null,
    numeroPasseport: row.numero_passeport || "",
    dateDelivrancePasseport: row.date_de_delivrance_passeport || "",
    dateExpirationPasseport: row["date_expiration passeport"] || "",
  }

  const federations: FederationOption[] = federationRows.map(({ id, sigle, nom }) => ({
    id,
    sigle,
    nom,
  }))

  return <AthleteDetailClient key={JSON.stringify(athlete)} athlete={athlete} federations={federations} affiliationRefs={affiliationRefs} />
}

export default async function ConnectedPage(props: Parameters<typeof AthleteDetailPage>[0]) {
  try { return await AthleteDetailPage(props) } catch(error) {
    if(error && typeof error === "object" && "digest" in error && String(error.digest).startsWith("NEXT_")) throw error
    return <CnacSourceError message={cnacError(error).message} />
  }
}
