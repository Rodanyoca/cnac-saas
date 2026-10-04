import { cnacMediaUrl } from "@/lib/cnac/media-url"
import { activeAffiliationLabel } from "@/lib/cnac/affiliation-model"
import { loadAffiliationReferences } from "@/lib/cnac/affiliation-data"
import { CnacSourceError } from "@/components/dashboard/cnac-source-error"
import { cnacError } from "@/lib/cnac/errors"
import { getSheetRows } from "@/lib/cnac/sheets"
import { getActeursSpreadsheetId } from "@/lib/acteurs/config"
import { ACTOR_SHEETS } from "@/lib/acteurs/sheets"
import { getFederationOptions } from "@/lib/cnac/federation-options"
import { AthletesClient, type AthleteListItem, type FederationOption } from "./athletes-client"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "force-no-store"

async function AthletesPage() {
  const [rows, federationRows, affiliationRefs] = await Promise.all([
    getSheetRows({
      sheetName: ACTOR_SHEETS.ATHLETE,
      spreadsheetId: getActeursSpreadsheetId(),
      bypassCache: true,
    }),
    getFederationOptions({ fresh: true }),
    loadAffiliationReferences(),
  ])
  const federationById = new Map(federationRows.map((item) => [item.id, item.sigle || item.nom || item.id]))

  const athletes: AthleteListItem[] = rows
    .filter((row) => Boolean(row.id_athlete_coc))
    .map((row) => ({
      id: row.id_athlete_coc,
      affiliationActive: activeAffiliationLabel({id_federation:row.id_federation,id_club_cnac:row.id_club_cnac || "",id_equipe_cnac:row.id_equipe_cnac || ""},affiliationRefs),
      idNational: row.id_national || "",
      idFederal: row.id_athlete_federation || "",
      nomComplet: row.nom_complet || "",
      sexe: row.nom_sexe || row.id_sexe || "",
      dateNaissance: row.date_de_naissance || "",
      federation: federationById.get(row.id_federation) || (row.id_federation ? `Référence inconnue (${row.id_federation})` : ""),
      federationId: row.id_federation || "",
      statut: row.statut || "",
      avatar: cnacMediaUrl("avatar", row.id_athlete_cnac || row.id_athlete_coc, row.avatar_drive_id || "") || null,
    }))

  const federations: FederationOption[] = federationRows.map(({ id, sigle, nom }) => ({
    id,
    sigle,
    nom,
  }))

  return <AthletesClient athletes={athletes} federations={federations} affiliationRefs={affiliationRefs} />
}

export default async function ConnectedPage() {
  try { return await AthletesPage() } catch(error) {
    if(error && typeof error === "object" && "digest" in error && String(error.digest).startsWith("NEXT_")) throw error
    return <CnacSourceError message={cnacError(error).message} />
  }
}
