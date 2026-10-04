import type { ParticipatingUnit } from "./types"

export function participatingUnitMedalLabel(unit:ParticipatingUnit|undefined,fallback=""){
 if(!unit)return fallback||"Unité non renseignée"
 return unit.type_unite==="EQUIPE"?(unit.nom_unite||fallback||"Équipe non renseignée"):(unit.composition?.[0]||fallback||"Athlète non renseigné")
}
