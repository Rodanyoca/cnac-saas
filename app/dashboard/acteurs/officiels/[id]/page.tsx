import { CnacSourceError } from "@/components/dashboard/cnac-source-error"
import { cnacError } from "@/lib/cnac/errors"
import { notFound } from "next/navigation"

import { getActeursSpreadsheetId } from "@/lib/acteurs/config"
import { getReferentialSpreadsheetId } from "@/lib/federations/config"
import { getSheetRows } from "@/lib/cnac/sheets"
import {
  OfficielDetailClient,
  type OfficielDetail,
  type OfficialFunctionOption,
  type OrganisationOption,
} from "./officiel-detail-client"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "force-no-store"

async function OfficielDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [rows, entityRows, functionRows] = await Promise.all([
    getSheetRows({
      sheetName: "OFFICIELS",
      spreadsheetId: getActeursSpreadsheetId(),
    }),
    getSheetRows({
      sheetName: "ENTITES",
      spreadsheetId: getReferentialSpreadsheetId(),
      bypassCache: true,
    }),
    getSheetRows({
      sheetName: "FONCTIONS_OFFICIEL",
      spreadsheetId: getReferentialSpreadsheetId(),
    }),
  ])
  const row = rows.find((item) => item.id_officiel_coc === id)
  if (!row) notFound()

  const linkedEntity = entityRows.find((item) => item.id_entite === row.id_entite)
  const officiel: OfficielDetail = {
    id: row.id_officiel_coc,
    idNational: row.id_national || "",
    idFederal: row.id_officiel_entite || "",
    idInternational: row.id_international || "",
    nomComplet: row.nom_complet || "",
    idSexe: row.id_sexe, sexe: row.nom_sexe || row.id_sexe || "",
    dateNaissance: row.date_de_naissance || "",
    lieuNaissance: row.lieu_de_naissance || "",
    nationalite: row.nationalite || "",
    organisationId: row.id_entite || "",
    organisation: linkedEntity?.nom_officiel || linkedEntity?.nom_entite || (row.id_entite ? `Référence inconnue (${row.id_entite})` : ""),
    telephone: row.telephone || "",
    email: row.email || "",
    adresse: row.adresse || "",
    statut: row.statut?.toLowerCase() || "",
    avatarUrl: row.avatar_drive_url || null,
    urlPasseport: row.passeport_drive_url || null,
    numeroPasseport: row.numero_passeport || "",
    dateDelivrancePasseport: row.date_de_delivrance_passeport || "",
    dateExpirationPasseport: row["date_expiration passeport"] || "",
  }

  const organisations: OrganisationOption[] = entityRows
    .filter((item) => item.id_entite)
    .map((item) => ({
      id: item.id_entite,
      sigle: item.sigle || item.sigle_entite || "",
      nom: item.nom_officiel || item.nom_entite || "",
    }))
    .sort((a, b) => a.nom.localeCompare(b.nom, "fr"))

  const functions: OfficialFunctionOption[] = functionRows
    .filter((item) => item.id_fonction_acteur && item.nom_fonction)
    .map((item) => ({ id: item.id_fonction_acteur, nom: item.nom_fonction }))
    .sort((a, b) => a.nom.localeCompare(b.nom, "fr"))

  return <OfficielDetailClient officiel={officiel} organisations={organisations} functions={functions} affiliations={[]} affiliationsLoadError={false} />
}

export default async function ConnectedPage(props: Parameters<typeof OfficielDetailPage>[0]) {
  try { return await OfficielDetailPage(props) } catch(error) {
    if(error && typeof error === "object" && "digest" in error && String(error.digest).startsWith("NEXT_")) throw error
    return <CnacSourceError message={cnacError(error).message} />
  }
}
