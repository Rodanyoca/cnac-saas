import { notFound } from "next/navigation"
import { getActivity, getActivityEntities, getActivityReferences, getActors, getParticipants } from "@/lib/activites/data"
import { ACTOR_TYPES } from "@/lib/activites/types"
import { getDocumentsForEntity } from "@/lib/documents/data"
import { canAccess } from "@/lib/auth"
import Detail from "./activite-detail-client"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "force-no-store"

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [activity, references, participants, entities, actorGroups, documents] = await Promise.all([
    getActivity(id), getActivityReferences(),
    getParticipants(id).then((rows) => ({ rows, error: false })).catch(() => ({ rows: [], error: true })),
    getActivityEntities(id).then((rows) => ({ rows, error: false })).catch(() => ({ rows: [], error: true })),
    Promise.all(ACTOR_TYPES.map((type) => getActors(type).catch(() => []))),
    canAccess("AUT-ADM", "READ").then((allowed) => allowed ? getDocumentsForEntity("ACTIVITE", id).catch(() => []) : undefined),
  ])
  if (!activity) notFound()
  const canEdit = await canAccess("AUT-ADM", "WRITE")
  return <Detail activity={activity} references={references} initialParticipants={participants.rows} participantsError={participants.error} initialEntities={entities.rows} entitiesError={entities.error} actorNames={Object.fromEntries(actorGroups.flat().map((item) => [item.id, item.label]))} activityDocuments={documents} canEdit={canEdit} />
}
