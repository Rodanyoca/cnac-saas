import { sportingFields, validateTeamAttachment } from "./affiliation-model.ts"
import { trainingPatch } from "./team-training.ts"
import { CNAC_HEADERS,CNAC_KEYS } from "./schema.ts"
import { civilDate,CnacDataError,physicalColumn,type SheetRecord } from "./model.ts"
import { TERRITORIAL_RESOURCE_BINDINGS } from "./territorial-resources.ts"

export const TERRITORIAL_SHEETS={hierarchie:"HIERARCHIE",zones:"ZONES",ligues:"LIGUES",ententes:"ENTENTES",cercles:"CERCLES",clubs:"CLUBS",equipes:"EQUIPES"} as const
export type TerritorialKind=keyof typeof TERRITORIAL_SHEETS
const singular={zones:"zone",ligues:"ligue",ententes:"entente",cercles:"cercle",clubs:"club",equipes:"equipe"} as const
// Conserver les champs du contrat et leurs alias historiques dans les éditeurs territoriaux.
export function territorialEditorRow(kind: string, row: SheetRecord): SheetRecord {
  if (kind === "equipes") return { ...row, statut: row.statut?.trim() || "ACTIF" }
  if (kind !== "zones" && kind !== "ententes") return row
  const columns: readonly string[] = CNAC_HEADERS[TERRITORIAL_SHEETS[kind]]
  return Object.fromEntries(Object.entries(row).filter(([key]) => columns.includes(physicalColumn(key)) || ["directParentId", "parent_label", "relation_issue", "id_structure_parent_coc", "id_structure_parent_cnac"].includes(key)))
}
// Les anciennes affectations ne font plus partie du contrat des Zones et Ententes.
export function withoutTerritorialDivision(kind: string, row: SheetRecord): SheetRecord {
  if (kind !== "zones" && kind !== "ententes") return row
  return Object.fromEntries(Object.entries(row).filter(([key]) => key !== "id_division" && key !== "idDivision"))
}
export function parentKind(kind:TerritorialKind,federationId:string,territorial:Record<string,SheetRecord[]>,refs:Record<string,SheetRecord[]>) {
  if(kind==="hierarchie")return undefined
  const binding=TERRITORIAL_RESOURCE_BINDINGS.find(item=>item.key===kind)
  if(!binding)return undefined
  const levels=territorial.HIERARCHIE.filter(row=>row.id_federation===federationId).sort((a,b)=>Number(a.niveau_hierarchique)-Number(b.niveau_hierarchique))
  const index=levels.findIndex(row=>row.id_type_structure===binding.typeId)
  if(index<=0)return undefined
  const parentTypeId=levels[index-1].id_type_structure
  if(parentTypeId==="TYPSTR001")return undefined
  const parent=TERRITORIAL_RESOURCE_BINDINGS.find(item=>item.typeId===parentTypeId)
  if(!parent){const name=refs.TYPES_STRUCTURE.find(type=>type.id_type_structure===parentTypeId)?.nom_type_structure||parentTypeId;throw new CnacDataError("UNSUPPORTED_PARENT",`Le niveau parent « ${name} » ne possède pas de stockage territorial CNAC configuré.`)}
  return parent.key as Exclude<TerritorialKind,"hierarchie">
}

export function resolveTerritorialRows(territorial:Record<string,SheetRecord[]>) {
  const structures=Object.entries(TERRITORIAL_SHEETS).filter(([kind])=>kind!=="hierarchie").flatMap(([kind,sheet])=>(territorial[sheet]||[]).map(row=>({kind:kind as Exclude<TerritorialKind,"hierarchie">,sheet,row})))
  const byId=new Map(structures.map(item=>[item.row[CNAC_KEYS[item.sheet]],item]))
  const counts=new Map<string,number>();structures.forEach(item=>{const id=item.row[CNAC_KEYS[item.sheet]];counts.set(id,(counts.get(id)||0)+1)})
  const result:Record<string,SheetRecord[]>={...territorial}
  for(const [kind,sheet] of Object.entries(TERRITORIAL_SHEETS)){
    if(kind==="hierarchie")continue
    result[sheet]=(territorial[sheet]||[]).map(original=>{
      const binding=TERRITORIAL_RESOURCE_BINDINGS.find(item=>item.key===kind)
      const row={...withoutTerritorialDivision(kind,original)},parentId=binding?.parentColumn?row[binding.parentColumn]:""
      const ancestors=new Map<string,SheetRecord>(),visited=new Set([row[CNAC_KEYS[sheet]]]);let next=parentId,issue=""
      while(next){
        if(visited.has(next)){issue="Cycle de parents territoriaux";break}visited.add(next)
        if((counts.get(next)||0)>1){issue=`Parent ambigu : identifiant dupliqué (${next})`;break}
        const parent=byId.get(next)
        if(!parent){issue=`Parent introuvable (${next})`;break}
        if(parent.row.id_federation!==row.id_federation){issue=`Parent d’une autre fédération (${next})`;break}
        ancestors.set(parent.kind,parent.row)
        const parentBinding=TERRITORIAL_RESOURCE_BINDINGS.find(item=>item.key===parent.kind)
        next=parentBinding?.parentColumn?parent.row[parentBinding.parentColumn]:""
      }
      for(const level of ["zones","ligues","ententes","cercles"] as const){if(level===kind)continue;const name=singular[level],ancestor=ancestors.get(level);row[`id_${name}_coc`]=ancestor?.[CNAC_KEYS[TERRITORIAL_SHEETS[level]]]||"";row[`nom_${name}`]=ancestor?.[`nom_${name}`]||"";row[`pseudo_${name}`]=ancestor?.[`sigle_${name}`]||""}
      const direct=parentId?byId.get(parentId):undefined
      row.parent_label=direct?.row.id_federation===row.id_federation?direct.row[`nom_${singular[direct.kind as keyof typeof singular]}`]||parentId:parentId?`Parent introuvable (${parentId})`:""
      row.relation_issue=issue
      return row
    })
  }
  return result
}

export function territorialPatch(kind:TerritorialKind,input:Record<string,unknown>,current:SheetRecord|undefined,territorial:Record<string,SheetRecord[]>,refs:Record<string,SheetRecord[]>):SheetRecord {
  const sheet=TERRITORIAL_SHEETS[kind],idColumn=CNAC_KEYS[sheet],columns=CNAC_HEADERS[sheet] as readonly string[],patch:SheetRecord={}
  const aliases:Record<string,string>={niveau:"niveau_hierarchique",id_ligue_federal:"id_ligue_federation",pseudo_ligue:"sigle_ligue",telephone_ligue:"telephone",email_ligue:"email",pseudo_entente:"sigle_entente",telephone_entente:"telephone",email_entente:"email",pseudo_cercle:"sigle_cercle",telephone_cercle:"telephone",email_cercle:"email",pseudo_club:"sigle_club",telephone_club:"telephone",email_club:"email",id_categorie:"id_categorie_club"}
  for(const [key,value] of Object.entries(input)){
    if (key === "id_division" || key === "idDivision" || key === "id_categorie" || key === "id_categorie_club") continue
    const column=aliases[key]||physicalColumn(key)
    if(column===idColumn){if(!current||String(value).trim()!==current[idColumn])throw new CnacDataError("IMMUTABLE_ID","L’identifiant interne est immuable.");continue}
    if(columns.includes(column))patch[column]=String(value??"").trim()
  }
  let row={...current,...patch}
  if(!row.id_federation || !refs.FEDERATIONS.some(ref=>ref.id_federation===row.id_federation))throw new CnacDataError("FEDERATION_INVALID","Fédération introuvable.")
  if(current && "id_federation" in patch && patch.id_federation!==current.id_federation)throw new CnacDataError("FEDERATION_IMMUTABLE","Le changement de fédération déplacerait les relations existantes; opération refusée.")
  if(kind==="hierarchie"){
    if(!refs.TYPES_STRUCTURE.some(type=>type.id_type_structure===row.id_type_structure))throw new CnacDataError("TYPE_INVALID","Type de structure introuvable.")
    const level=Number(row.niveau_hierarchique)
    if(!Number.isInteger(level)||level<1)throw new CnacDataError("LEVEL_INVALID","Le niveau doit être un entier positif.")
    if(territorial.HIERARCHIE.some(item=>item.id_federation===row.id_federation && item.id_hierarchie!==current?.id_hierarchie && (item.id_type_structure===row.id_type_structure || Number(item.niveau_hierarchique)===level)))throw new CnacDataError("DUPLICATE_LEVEL","Type ou niveau hiérarchique déjà configuré.",409)
  }else{
    if(!row[`nom_${singular[kind]}`])throw new CnacDataError("NAME_REQUIRED","Le nom de la structure est obligatoire.")
    const expected=kind==="equipes"?"clubs":parentKind(kind,row.id_federation,territorial,refs)
    const parentColumn=kind==="equipes"?"id_club_cnac":"id_structure_parent_cnac"
    if(expected){const inputParent=input[`id_${singular[expected]}_coc`]??input[`id_${singular[expected]}_cnac`];if(inputParent!==undefined && !("id_structure_parent_coc" in input) && !("id_structure_parent_cnac" in input))patch[parentColumn]=String(inputParent).trim()}
    row={...current,...patch}
    const parentId=row[parentColumn]
    if(expected && !parentId)throw new CnacDataError("PARENT_REQUIRED","Le parent direct configuré est obligatoire.")
    if(parentId){const parentSheets=expected?[TERRITORIAL_SHEETS[expected]]:Object.values(TERRITORIAL_SHEETS).filter(sheetName=>sheetName!=="HIERARCHIE"&&sheetName!==sheet);const parent=parentSheets.flatMap(sheetName=>territorial[sheetName]||[]).find(item=>parentSheets.some(sheetName=>item[CNAC_KEYS[sheetName]]===parentId));if(!parent||parent.id_federation!==row.id_federation)throw new CnacDataError("PARENT_INVALID","Parent introuvable ou d’une autre fédération.");if(current && parentId===current[idColumn])throw new CnacDataError("PARENT_CYCLE","Une structure ne peut pas être son propre parent.")}
    const other=territorial[sheet].filter(item=>item[idColumn]!==current?.[idColumn])
    const federalColumn=`id_${singular[kind]}_federation`
    if(row[federalColumn] && other.some(item=>item.id_federation===row.id_federation&&item[federalColumn]===row[federalColumn]))throw new CnacDataError("DUPLICATE_FEDERAL_ID","Identifiant fédéral déjà utilisé dans cette fédération.",409)
  }
  if(kind === "equipes" && (!current || sportingFields.some(field => field in patch) || "id_club_cnac" in patch)) validateTeamAttachment(row, {...refs,...territorial})
  if(kind === "equipes") trainingPatch(patch, current)
  for(const [field,refSheet,key] of [["id_province","PROVINCES","id_province"],["id_ville","VILLES","id_ville"],["id_sport","SPORTS","id_sport"],["id_discipline","DISCIPLINES","id_discipline"],["id_categorie_age","CATEGORIES_AGE","id_categorie_age"],["id_sexe","SEXES","id_sexe"]]){
    if(!row[field])continue
    if(!current || field in patch){const reference=refs[refSheet]?.find(ref=>ref[key]===row[field]);if(!reference)throw new CnacDataError("REFERENCE_INVALID",`Référence ${field} introuvable.`);if(reference.id_federation&&reference.id_federation!==row.id_federation)throw new CnacDataError("REFERENCE_OWNER",`La référence ${field} appartient à une autre fédération.`)}
  }
  if(row.id_ville&&row.id_province){const city=refs.VILLES.find(item=>item.id_ville===row.id_ville);if(city&&city.id_province!==row.id_province)throw new CnacDataError("CITY_PROVINCE","Ville et province incohérentes.")}
  if(row.id_sport&&refs.FEDERATIONS.find(item=>item.id_federation===row.id_federation)?.id_sport!==row.id_sport)throw new CnacDataError("SPORT_OWNER","Le sport ne correspond pas à la fédération.")
  if(row.id_discipline&&row.id_sport&&refs.DISCIPLINES.find(item=>item.id_discipline===row.id_discipline)?.id_sport!==row.id_sport)throw new CnacDataError("DISCIPLINE_OWNER","Discipline et sport incohérents.")
  for(const key of Object.keys(patch).filter(key=>key.startsWith("date_")))patch[key]=civilDate(patch[key])
  if(patch.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patch.email))throw new CnacDataError("EMAIL_INVALID","L’adresse électronique n’est pas valide.")
  if("statut" in patch&&!['ACTIF','INACTIF'].includes(patch.statut))throw new CnacDataError("STATUS_INVALID","Statut invalide.")
  return patch
}
