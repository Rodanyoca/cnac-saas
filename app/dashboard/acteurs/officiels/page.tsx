import { CnacSourceError } from "@/components/dashboard/cnac-source-error"
import { cnacError } from "@/lib/cnac/errors"
import { getActeursSpreadsheetId } from "@/lib/acteurs/config"
import { getReferentialSpreadsheetId } from "@/lib/federations/config"
import { getSheetRows } from "@/lib/cnac/sheets"
import { OfficielsClient, type OfficielListItem, type OrganisationOption } from "./officiels-client"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "force-no-store"

async function OfficielsPage() {
  const [rows, entityRows] = await Promise.all([
    getSheetRows({
      sheetName: "OFFICIELS",
      spreadsheetId: getActeursSpreadsheetId(),
      bypassCache: true,
    }),
    getSheetRows({
      sheetName: "ENTITES",
      spreadsheetId: getReferentialSpreadsheetId(),
      bypassCache: true,
    }),
  ])

  const entityById = new Map(entityRows.map((row) => [row.id_entite, row]))
  const officiels: OfficielListItem[] = rows
    .filter((row) => Boolean(row.id_officiel_coc))
    .map((row) => {
      const organisationId = row.id_entite || ""
      const entity = entityById.get(organisationId)
      return {
      id: row.id_officiel_coc,
      idNational: row.id_national || "",
      idFederal: row.id_officiel_entite || "",
      nomComplet: row.nom_complet || "",
      sexe: row.nom_sexe || row.id_sexe || "",
      dateNaissance: row.date_de_naissance || "",
      organisationId,
      organisation: entity?.sigle || entity?.nom_officiel || (organisationId ? `Référence inconnue (${organisationId})` : ""),
      statut: row.statut || "",
      avatar: row.avatar_drive_url || null,
      }
    })

  const organisations: OrganisationOption[] = entityRows
    .filter((row) => Boolean(row.id_entite))
    .map((row) => ({ id: row.id_entite, sigle: row.sigle || row.sigle_entite || "", nom: row.nom_officiel || row.nom_entite || row.id_entite }))
    .sort((a, b) => a.nom.localeCompare(b.nom, "fr", { sensitivity: "base" }))

  return <OfficielsClient officiels={officiels} organisations={organisations} />
}

export default async function ConnectedPage() {
  try { return await OfficielsPage() } catch(error) {
    if(error && typeof error === "object" && "digest" in error && String(error.digest).startsWith("NEXT_")) throw error
    return <CnacSourceError message={cnacError(error).message} />
  }
}
