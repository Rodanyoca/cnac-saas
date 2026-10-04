import { canAccess } from "@/lib/auth"
import { getPublicationStatuses, getSliders } from "@/lib/site-web/sliders"
import SlidersClient from "./sliders-client"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function SlidersPage() {
  const canEdit = await canAccess("AUT-COM", "WRITE")
  const result = await Promise.all([getSliders(), getPublicationStatuses()]).then(([sliders, statuses]) => ({ sliders, statuses, failed: false })).catch((error) => { console.error("Sliders page error", error); return { sliders: [], statuses: [], failed: true } })
  return <SlidersClient initialSliders={result.sliders} statuses={result.statuses} canEdit={canEdit} initialError={result.failed} />
}
