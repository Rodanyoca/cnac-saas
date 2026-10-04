import { CnacSourceError } from "@/components/dashboard/cnac-source-error"
import { cnacError } from "@/lib/cnac/errors"
import { redirect } from "next/navigation"
import { canAccess } from "@/lib/auth"
import { loadOtherActors } from "@/lib/acteurs/autres-data"
import AutresClient from "./autres-client"

export const dynamic = "force-dynamic"
export const revalidate = 0

async function AutresPage() {
  if (!(await canAccess("AUT-SPT", "READ"))) redirect("/dashboard")
  const canWrite = await canAccess("AUT-SPT", "WRITE")
  const data = await loadOtherActors()
  return <AutresClient {...data} canWrite={canWrite} />
}

export default async function ConnectedPage() {
  try { return await AutresPage() } catch(error) {
    if(error && typeof error === "object" && "digest" in error && String(error.digest).startsWith("NEXT_")) throw error
    return <CnacSourceError message={cnacError(error).message} />
  }
}
