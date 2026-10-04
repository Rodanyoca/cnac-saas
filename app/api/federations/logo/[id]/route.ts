import { writeAccess } from "@/lib/cnac/actor-handler"
import { revalidatePath } from "next/cache"
import { canAccess } from "@/lib/auth"
import { handleFederationLogoUpload } from "@/lib/federations/logo-handler"
import { replaceFederationLogoInGoogle } from "@/lib/federations/logo-data"

export const runtime = "nodejs"

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const accessDenial=await writeAccess();if(accessDenial)return accessDenial
  const { id } = await context.params
  const response = await handleFederationLogoUpload(request, id, {
    canWrite: () => canAccess("AUT-SPT", "WRITE"),
    replace: replaceFederationLogoInGoogle,
  })
  if (response.ok) {
    revalidatePath("/dashboard/federations")
    revalidatePath(`/dashboard/federations/${id}`)
  }
  return response
}
