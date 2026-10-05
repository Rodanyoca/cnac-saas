import { cnacUploadAvailability } from "@/lib/cnac/media-config"
import type { ReactNode } from "react"
import { getSheetRows } from "@/lib/cnac/sheets"
import { getReferentialSpreadsheetId } from "@/lib/federations/config"
import { CnacActorReferencesProvider } from "@/components/dashboard/cnac-actor-references"
export default async function ActorsLayout({children}:{children:ReactNode}) {
  let sexes:{id:string;label:string}[]=[]
  try{sexes=(await getSheetRows({sheetName:"SEXES",spreadsheetId:getReferentialSpreadsheetId()})).filter(row=>["01","02"].includes(row.id_sexe)).map(row=>({id:row.id_sexe,label:row.nom_sexe}))}catch{/* Les pages présentent leur erreur de connexion explicite. */}
  const uploads=cnacUploadAvailability()
  return <CnacActorReferencesProvider value={{scoped:true,sexes,uploads}}>{children}</CnacActorReferencesProvider>
}
