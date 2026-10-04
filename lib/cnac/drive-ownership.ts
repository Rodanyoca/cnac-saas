import "server-only"
import { drive,auth as googleAuth } from "googleapis/build/src/apis/drive"
import { deleteDriveFile } from "@/lib/google/drive"
import { runGoogleRequest } from "@/lib/google/request"

// Un lien copié peut désigner un fichier COC. Ne supprimer que dans le dossier CNAC configuré.
export async function deleteCnacOwnedFile(fileId:string,folderId:string) {
  const clientId=process.env.GOOGLE_OAUTH_CLIENT_ID,clientSecret=process.env.GOOGLE_OAUTH_CLIENT_SECRET,refreshToken=process.env.GOOGLE_DRIVE_REFRESH_TOKEN
  if(!clientId||!clientSecret||!refreshToken||!folderId)return
  const auth=new googleAuth.OAuth2(clientId,clientSecret);auth.setCredentials({refresh_token:refreshToken})
  const api=drive({version:"v3",auth})
  const metadata=await runGoogleRequest(()=>api.files.get({fileId,fields:"parents"}))
  if(metadata.data.parents?.includes(folderId))await deleteDriveFile(fileId)
}
