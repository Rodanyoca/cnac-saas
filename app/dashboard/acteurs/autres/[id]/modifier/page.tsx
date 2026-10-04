import { CnacSourceError } from "@/components/dashboard/cnac-source-error"
import { cnacError } from "@/lib/cnac/errors"
import { notFound, redirect } from "next/navigation"
import { canAccess } from "@/lib/auth"
import { loadOtherActor } from "@/lib/acteurs/autres-data"
import type { OtherActorFormValue } from "@/components/dashboard/other-actor-form"
import { OtherActorEditor } from "../../other-actor-editor"

export const dynamic = "force-dynamic"

async function EditOtherActorPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await canAccess("AUT-SPT", "WRITE"))) redirect("/dashboard/acteurs/autres")
  const { id } = await params
  const { actor, references } = await loadOtherActor(decodeURIComponent(id))
  if (!actor) notFound()
  const initialValue: OtherActorFormValue = {
    id_entite: actor.id_entite, id_autre_acteur_entite: actor.id_autre_acteur_entite,
     nom_complet: actor.nom_complet, id_sexe: actor.id_sexe,
    date_de_naissance: actor.date_de_naissance, lieu_de_naissance: actor.lieu_de_naissance, nationalite: actor.nationalite,
    type_autre_acteur: actor.type_autre_acteur, telephone: actor.telephone, email: actor.email, adresse: actor.adresse,
    numero_passeport: actor.numero_passeport, date_de_delivrance_passeport: actor.date_de_delivrance_passeport,
    date_expiration_passeport: actor.date_expiration_passeport, statut: actor.statut, observations: actor.observations,
  }
  return <OtherActorEditor actorId={actor.id_autre_acteur_coc} initialValue={initialValue} references={references} />
}

export default async function ConnectedPage(props: Parameters<typeof EditOtherActorPage>[0]) {
  try { return await EditOtherActorPage(props) } catch(error) {
    if(error && typeof error === "object" && "digest" in error && String(error.digest).startsWith("NEXT_")) throw error
    return <CnacSourceError message={cnacError(error).message} />
  }
}
