import "server-only"

export const SITE_WEB_SPREADSHEET_NAME = "10_SITE_WEB_CONTENUS"
export const SITE_WEB_SPREADSHEET_ID = "1Amc-shqO9U-coS3Oyz0j_EXLZqK5lJHpI0tvF3w51Ew"
export const SLIDERS_SHEET = "SLIDERS_SITE"
export const SLIDER_HEADERS = ["id_slide", "titre", "description", "image_url", "libelle_bouton", "lien_bouton", "ordre_affichage", "id_statut_publication", "date_debut_publication", "date_fin_publication"] as const

export function getSiteWebSlidersFolderId() {
  const id = process.env.GOOGLE_DRIVE_SITE_WEB_SLIDERS_FOLDER_ID
  if (!id) throw new Error("Configuration manquante : GOOGLE_DRIVE_SITE_WEB_SLIDERS_FOLDER_ID doit désigner le dossier Drive réservé aux images des sliders.")
  return id
}
