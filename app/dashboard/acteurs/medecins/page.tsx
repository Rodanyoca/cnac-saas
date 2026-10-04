import { CnacSourceError } from "@/components/dashboard/cnac-source-error"
import { cnacError } from "@/lib/cnac/errors"
import { getActeursSpreadsheetId } from "@/lib/acteurs/config"
import { getReferentialSpreadsheetId } from "@/lib/federations/config"
import { getSheetRows } from "@/lib/cnac/sheets"
import MedecinsClient, { type EntityOption, type MedecinListItem, type SpecialtyOption } from "./medecins-client"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "force-no-store"

async function MedecinsPage() {
  const [rows, entityRows, specialtyRows] = await Promise.all([
    getSheetRows({ sheetName: "MEDECINS", spreadsheetId: getActeursSpreadsheetId(), bypassCache: true }),
    getSheetRows({ sheetName: "ENTITES", spreadsheetId: getReferentialSpreadsheetId(), bypassCache: true }),
    getSheetRows({ sheetName: "SPECIALITES_MEDECIN", spreadsheetId: getReferentialSpreadsheetId(), bypassCache: true }),
  ])
  const entityById = new Map(entityRows.map((row) => [row.id_entite, row]))
  const specialtyById = new Map(specialtyRows.map((row) => [row.id_specialite_sante, row]))
  const medecins: MedecinListItem[] = rows.filter((r) => r.id_medecin_coc).map((r) => ({
    id: r.id_medecin_coc.trim(),
    idNational: r.id_national || "",
    idFederal: r.id_medecin_entite || r.id_medecin_federation || "",
    nomComplet: r.nom_complet || "",
    sexe: r.nom_sexe || r.id_sexe || "",
    dateNaissance: r.date_de_naissance || "",
    organisationId: r.id_entite || "",
    federation: (() => {
      const entity = entityById.get(r.id_entite || "")
      return entity?.sigle || entity?.sigle_entite || r.sigle_entite || r.sigle_federation || entity?.nom_officiel || entity?.nom_entite || r.nom_entite || (r.id_entite ? `Référence inconnue (${r.id_entite})` : "")
    })(),
    specialite: specialtyById.get(r.id_specialite_sante || r.id_specialite || "")?.nom_specialite_sante || r.nom_specialite || r.id_specialite_sante || "",
    statut: r.statut || "",
    avatar: r.avatar_drive_url || null,
  }))
  const organisations: EntityOption[] = entityRows.filter((r) => r.id_entite).map((r) => ({ id: r.id_entite, sigle: r.sigle || r.sigle_entite || "", nom: r.nom_officiel || r.nom_entite || r.id_entite })).sort((a, b) => a.nom.localeCompare(b.nom, "fr"))
  const specialites: SpecialtyOption[] = specialtyRows.filter((r) => r.id_specialite_sante).map((r) => ({ id: r.id_specialite_sante, nom: r.nom_specialite_sante || r.id_specialite_sante })).sort((a, b) => a.nom.localeCompare(b.nom, "fr"))
  return <MedecinsClient medecins={medecins} organisations={organisations} specialites={specialites} />
}

export default async function ConnectedPage() {
  try { return await MedecinsPage() } catch(error) {
    if(error && typeof error === "object" && "digest" in error && String(error.digest).startsWith("NEXT_")) throw error
    return <CnacSourceError message={cnacError(error).message} />
  }
}
