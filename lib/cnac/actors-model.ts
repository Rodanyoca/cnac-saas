import { validateAthleteAffiliation } from "./affiliation-model.ts"
import { CNAC_HEADERS, CNAC_KEYS, type CnacSheet } from "./schema.ts"
import { civilDate, CnacDataError, physicalColumn, type SheetRecord } from "./model.ts"

export const ACTOR_CONFIGS = {
  athletes:{sheet:"ATHLETES",relation:"id_federation",prefix:"ATH"},
  entraineurs:{sheet:"COACHS",relation:"id_federation",prefix:"COA"},
  arbitres:{sheet:"ARBITRES",relation:"id_federation",prefix:"ARB"},
  officiels:{sheet:"OFFICIELS",relation:"id_entite",prefix:"OFF"},
  medecins:{sheet:"MEDECINS",relation:"id_entite",prefix:"MED"},
  autres:{sheet:"AUTRES",relation:"id_entite",prefix:"AUT"},
} as const
export type ActorKind = keyof typeof ACTOR_CONFIGS
export type ActorReferences = Record<string,SheetRecord[]>
const missing = (message:string) => { throw new CnacDataError("VALIDATION",message) }
export function actorPatch(kind:ActorKind,input:Record<string,unknown>,current:SheetRecord|undefined,refs:ActorReferences,existing:SheetRecord[]):SheetRecord {
  const config=ACTOR_CONFIGS[kind],sheet=config.sheet as CnacSheet,idColumn=CNAC_KEYS[sheet],columns=CNAC_HEADERS[sheet] as readonly string[]
  const changes:SheetRecord={}
  for(const [key,value] of Object.entries(input)){
    let column=physicalColumn(key)
    if(kind==="medecins" && column==="id_specialite")column="id_specialite_sante"
    if(column===idColumn){if(!current || String(value).trim()!==current[idColumn])missing("L’identifiant interne est immuable.");continue}
    if(column.endsWith("_drive_id")||column.endsWith("_drive_url"))continue
    // Les champs absents du schéma ne sont jamais inventés ni enregistrés ailleurs.
    if(!columns.includes(column)){if(value!=="" && value!==null && value!==undefined)missing(`Le champ ${key} n’existe pas dans ${sheet}.`);continue}
    changes[column]=String(value??"").trim()
  }
  const row={...current,...changes}
  if(!row.nom_complet)missing("Le nom complet est obligatoire.")
  if(!row[config.relation])missing(config.relation==="id_federation"?"La fédération est obligatoire.":"L’entité de rattachement est obligatoire.")
  const relationSheet=config.relation==="id_federation"?"FEDERATIONS":"ENTITES"
  if((!current || config.relation in changes) && !refs[relationSheet]?.some(ref=>ref[config.relation]===row[config.relation]))missing("La référence de rattachement est introuvable.")
  if(!row.id_sexe)missing("Le sexe est obligatoire.")
  if(!current || "id_sexe" in changes){if(!["01","02"].includes(row.id_sexe) || !refs.SEXES?.some(ref=>ref.id_sexe===row.id_sexe))missing("Sexe inconnu ou non autorisé pour une personne.")}
  if(kind==="medecins" && row.id_specialite_sante && (!current || "id_specialite_sante" in changes) && !refs.SPECIALITES_MEDECIN?.some(ref=>ref.id_specialite_sante===row.id_specialite_sante))missing("Spécialité de santé introuvable.")
  if(changes.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(changes.email))missing("L’adresse électronique n’est pas valide.")
  if(changes.telephone && !/^[+\d][\d\s().-]{5,24}$/.test(changes.telephone))missing("Le numéro de téléphone n’est pas valide.")
  for(const column of Object.keys(changes).filter(key=>key.startsWith("date_")))changes[column]=civilDate(changes[column])
  if(changes.date_de_naissance && changes.date_de_naissance>new Date().toISOString().slice(0,10))missing("La naissance ne peut pas être dans le futur.")
  if(kind !== "athletes" && ("date_expiration_passeport" in changes||"date_de_delivrance_passeport" in changes)&&row.date_expiration_passeport&&row.date_de_delivrance_passeport&&civilDate(row.date_expiration_passeport)<civilDate(row.date_de_delivrance_passeport))missing("L’expiration du passeport précède sa délivrance.")
  if("statut" in changes && !["ACTIF","INACTIF"].includes(changes.statut))missing("Le statut doit être ACTIF ou INACTIF.")
  if(changes.id_national && existing.some(actor=>actor[idColumn]!==current?.[idColumn] && actor.id_national===changes.id_national))throw new CnacDataError("DUPLICATE_NATIONAL_ID","Cet identifiant national existe déjà.",409)
  if(kind==="autres" && existing.some(actor=>actor[idColumn]!==current?.[idColumn] && actor.nom_complet?.toLocaleLowerCase("fr")===row.nom_complet.toLocaleLowerCase("fr") && actor.id_entite===row.id_entite && actor.type_autre_acteur===row.type_autre_acteur))throw new CnacDataError("DUPLICATE_ACTOR","Cette personne est déjà enregistrée avec ce rattachement et cette fonction.",409)
  if(kind === "athletes" && (!current || ["id_club_cnac", "id_equipe_cnac", "id_federation"].some(field => field in changes))) validateAthleteAffiliation(row, refs)
  return changes
}
