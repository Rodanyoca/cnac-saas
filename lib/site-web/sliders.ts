import "server-only"
import { appendSheetRow, getSheetHeaders, getSheetRows, updateSheetCells } from "@/lib/google/sheets"
import { uploadFileToDrive } from "@/lib/google/drive"
import { getReferentialSpreadsheetId } from "@/lib/federations/config"
import { getSiteWebSlidersFolderId, SITE_WEB_SPREADSHEET_ID, SLIDER_HEADERS, SLIDERS_SHEET } from "./config"

export type Slider = Record<(typeof SLIDER_HEADERS)[number], string>
export type PublicationStatus = { id: string; label: string }
export class SliderInputError extends Error { constructor(message: string, public field?: string) { super(message) } }
const clean = (value: unknown) => String(value ?? "").trim()

function normalized(input: Record<string, unknown>): Omit<Slider, "id_slide" | "image_url"> & { image_url?: string } {
  return {
    titre: clean(input.titre), description: clean(input.description), image_url: clean(input.image_url),
    libelle_bouton: clean(input.libelle_bouton), lien_bouton: clean(input.lien_bouton), ordre_affichage: clean(input.ordre_affichage),
    id_statut_publication: clean(input.id_statut_publication), date_debut_publication: clean(input.date_debut_publication), date_fin_publication: clean(input.date_fin_publication),
  }
}

export async function getPublicationStatuses(): Promise<PublicationStatus[]> {
  const rows = await getSheetRows({ sheetName: "STATUTS_PUBLICATION", spreadsheetId: getReferentialSpreadsheetId() })
  return rows.filter((row) => row.id_statut_publication).map((row) => ({ id: clean(row.id_statut_publication), label: clean(row.nom_statut_publication || row.libelle_statut_publication || row.libelle || row.id_statut_publication) }))
}

async function assertHeaders() {
  const headers = await getSheetHeaders({ sheetName: SLIDERS_SHEET, spreadsheetId: SITE_WEB_SPREADSHEET_ID })
  const missing = SLIDER_HEADERS.filter((header) => !headers.includes(header))
  if (missing.length) throw new Error(`Colonnes Sliders manquantes : ${missing.join(", ")}`)
}

export async function getSliders(options: { fresh?: boolean } = {}): Promise<Slider[]> {
  await assertHeaders()
  const rows = await getSheetRows({ sheetName: SLIDERS_SHEET, spreadsheetId: SITE_WEB_SPREADSHEET_ID, bypassCache: options.fresh })
  return rows.filter((row) => clean(row.id_slide)).map((row) => Object.fromEntries(SLIDER_HEADERS.map((key) => [key, clean(row[key])])) as Slider).sort((a, b) => Number(a.ordre_affichage || Number.MAX_SAFE_INTEGER) - Number(b.ordre_affichage || Number.MAX_SAFE_INTEGER) || a.id_slide.localeCompare(b.id_slide, "fr"))
}

export async function validateSliderInput(input: Record<string, unknown>) {
  const row = normalized(input)
  if (!row.titre) throw new SliderInputError("Le titre est obligatoire.", "titre")
  if (!row.description) throw new SliderInputError("La description est obligatoire.", "description")
  if (!/^\d+$/.test(row.ordre_affichage) || Number(row.ordre_affichage) < 1) throw new SliderInputError("L’ordre doit être un entier positif.", "ordre_affichage")
  const statuses = await getPublicationStatuses()
  if (!row.id_statut_publication || !statuses.some((status) => status.id === row.id_statut_publication)) throw new SliderInputError("Sélectionnez un statut de publication valide.", "id_statut_publication")
  if (row.date_debut_publication && row.date_fin_publication && row.date_fin_publication < row.date_debut_publication) throw new SliderInputError("La date de fin ne peut pas précéder la date de début.", "date_fin_publication")
  if (Boolean(row.libelle_bouton) !== Boolean(row.lien_bouton)) throw new SliderInputError("Le libellé et le lien du bouton doivent être renseignés ensemble.", row.libelle_bouton ? "lien_bouton" : "libelle_bouton")
  if (row.lien_bouton && !(row.lien_bouton.startsWith("/") && !row.lien_bouton.startsWith("//")) && !/^https?:\/\/[^\s]+$/i.test(row.lien_bouton)) throw new SliderInputError("Le lien doit être une route locale ou une URL HTTP/HTTPS valide.", "lien_bouton")
  return row
}

async function imageUrl(file?: File) {
  if (!file?.size) return ""
  if (!file.type.startsWith("image/")) throw new SliderInputError("Le fichier doit être une image.", "image")
  if (file.size > 5 * 1024 * 1024) throw new SliderInputError("L’image ne doit pas dépasser 5 Mo.", "image")
  return (await uploadFileToDrive({ fileName: `slider-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`, mimeType: file.type, buffer: Buffer.from(await file.arrayBuffer()), folderId: getSiteWebSlidersFolderId() })).url
}

const nextId = (rows: Slider[]) => `SLD${String(rows.reduce((max, row) => Math.max(max, Number(row.id_slide.match(/^SLD(\d+)$/i)?.[1] || 0)), 0) + 1).padStart(4, "0")}`
export async function createSlider(input: Record<string, unknown>, file?: File) {
  const row = await validateSliderInput(input), rows = await getSliders({ fresh: true }), id = nextId(rows)
  const created = { ...row, image_url: await imageUrl(file), id_slide: id } as Slider
  await appendSheetRow({ sheetName: SLIDERS_SHEET, spreadsheetId: SITE_WEB_SPREADSHEET_ID, row: created })
  const confirmed = (await getSliders({ fresh: true })).find((item) => item.id_slide === id)
  if (!confirmed) throw new Error("L’écriture du slider n’a pas pu être confirmée.")
  return confirmed
}

export async function updateSlider(id: string, input: Record<string, unknown>, file?: File) {
  const rows = await getSliders({ fresh: true }), current = rows.find((item) => item.id_slide === id)
  if (!current) throw new SliderInputError("Slider introuvable.")
  const row = await validateSliderInput(input), uploaded = await imageUrl(file), updated = { ...current, ...row, image_url: uploaded || current.image_url, id_slide: id } as Slider
  await updateSheetCells({ sheetName: SLIDERS_SHEET, spreadsheetId: SITE_WEB_SPREADSHEET_ID, idColumn: "id_slide", idValue: id, updates: SLIDER_HEADERS.filter((key) => key !== "id_slide").map((column) => ({ column, value: updated[column] })) })
  const confirmed = (await getSliders({ fresh: true })).find((item) => item.id_slide === id)
  if (!confirmed) throw new Error("La modification du slider n’a pas pu être confirmée.")
  return confirmed
}
