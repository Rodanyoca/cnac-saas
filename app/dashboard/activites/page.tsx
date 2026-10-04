import { getActivities, getActivityReferences } from "@/lib/activites/data"
import ActivitesClient from "./activites-client"
export const runtime = "nodejs"; export const dynamic = "force-dynamic"; export const revalidate = 0; export const fetchCache = "force-no-store"
export default async function ActivitesPage() {
  let props: React.ComponentProps<typeof ActivitesClient>
  try {
    const [activities, references] = await Promise.all([getActivities(), getActivityReferences()])
    props = { initialRows: activities, references }
  } catch (error) {
    props = {
      initialRows: [],
      references: { entites: [], types: [], entityRoles: [], actorTypes: [] },
      loadError: error instanceof Error ? error.message : String(error),
    }
  }
  return <ActivitesClient {...props} />
}
