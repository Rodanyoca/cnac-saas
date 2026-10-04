import { cnacUploadAvailability } from "@/lib/cnac/media-config"
import { CnacSourceError } from "@/components/dashboard/cnac-source-error"
import { cnacError } from "@/lib/cnac/errors"
import { notFound, redirect } from "next/navigation"
import { canAccess } from "@/lib/auth"
import { loadFederationData } from "@/lib/federations/data"
import { buildFederationStructure } from "@/lib/federations/structure-model"
import ParametresClient from "./parametres-client"

export const dynamic = "force-dynamic"
export const revalidate = 0

async function ParametresPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ action?: string; typeId?: string; entityId?: string }> }) {
  if (!(await canAccess("AUT-SPT", "WRITE"))) redirect("/dashboard/federations")
  const id = decodeURIComponent((await params).id)
  const data = await loadFederationData({ connected: true })
  if (!data.federations.some((item) => item.id_federation === id)) notFound()
  const query = await searchParams
  const section = buildFederationStructure(data, id).sections.find((item) => item.typeId === query.typeId && item.supported)
  const selected = query.action === "edit" ? section?.items.find((item) => item.id === query.entityId) : undefined
  const initialEditor: { resource: string; id?: string; row: Record<string, string> } | undefined = section && query.action === "create"
    ? { resource: section.key, row: { id_federation: id, statut: "ACTIF" } }
    : section && selected
      ? { resource: section.key, id: selected.id, row: { ...selected.record, id_structure_parent_coc: selected.parentId, id_federation: id } }
      : undefined
  return <ParametresClient logoAvailable={cnacUploadAvailability().logo} data={data} federationId={id} initialEditor={initialEditor} />
}

export default async function ConnectedPage(props: Parameters<typeof ParametresPage>[0]) {
  try { return await ParametresPage(props) } catch(error) {
    if(error && typeof error === "object" && "digest" in error && String(error.digest).startsWith("NEXT_")) throw error
    return <CnacSourceError message={cnacError(error).message} />
  }
}
