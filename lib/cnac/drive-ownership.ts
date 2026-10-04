import "server-only"
import { drive,auth as googleAuth } from "googleapis/build/src/apis/drive"
import { deleteDriveFile } from "@/lib/google/drive"
import { runGoogleRequest } from "@/lib/google/request"
import { CnacDataError } from "./model"

// Un lien copié peut désigner un fichier COC. Ne supprimer que dans le dossier CNAC configuré.
export async function deleteCnacOwnedFile(fileId:string,folderId:string) {
  const clientId=process.env.GOOGLE_OAUTH_CLIENT_ID,clientSecret=process.env.GOOGLE_OAUTH_CLIENT_SECRET,refreshToken=process.env.GOOGLE_DRIVE_REFRESH_TOKEN
  if(!clientId||!clientSecret||!refreshToken||!folderId)throw new CnacDataError("MEDIA_CONFIGURATION", "Le stockage des images CNAC est indisponible.", 503)
  if(await cnacOwnedFileMetadata(fileId,folderId))await deleteDriveFile(fileId)
}

export async function cnacOwnedFileMetadata(fileId: string, folderId: string) {
  const auth = new googleAuth.OAuth2(process.env.GOOGLE_OAUTH_CLIENT_ID, process.env.GOOGLE_OAUTH_CLIENT_SECRET)
  auth.setCredentials({ refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN })
  const api = drive({ version: "v3", auth })
  try {
    const result = await runGoogleRequest(() => api.files.get({ fileId, fields: "parents,mimeType,size,trashed" }))
    if (result.data.trashed || !result.data.parents?.includes(folderId)) return undefined
    return { mimeType: result.data.mimeType || "", size: Number(result.data.size || 0) }
  } catch (error) {
    if ((error as { response?: { status?: number } }).response?.status === 404) return undefined
    if ((error as { response?: { status?: number } }).response?.status === 401) throw new CnacDataError("MEDIA_AUTHORIZATION", "La connexion Google Drive du serveur doit être réautorisée. Les données de la fiche sont conservées.", 503)
    throw error
  }
}
