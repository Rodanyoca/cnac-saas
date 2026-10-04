import "server-only"

import { appendSheetRow, getSheetHeaders, getSheetRows, getSheetsRows, updateSheetCells } from "@/lib/google/sheets"
import { getReferentialSpreadsheetId } from "@/lib/federations/config"
import { getFederationOptions } from "@/lib/federations/options"
import { getActors } from "@/lib/activites/data"
import { getNationalTeamsSpreadsheetId } from "./config"
import { NATIONAL_TEAM_HEADERS, NATIONAL_TEAM_ROLES, type ActorType, type AthleteSelection, type NationalTeam, type NationalTeamCampaign, type NationalTeamMember, type NationalTeamReferences, type StaffAssignment } from "./types"
import { selectionCampaignDateError, validateCampaignInput, validateMemberInput, validateSelectionInput, validateTeamInput } from "./validation"
import { uniqueReferenceOptions } from "./reference-options"

const TEAM_SHEET = "EQUIPES_NATIONALES"
const CAMPAIGN_SHEET = "CAMPAGNES_EQUIPES_NATIONALES"
const ATHLETE_SELECTION_SHEET = "SELECTIONS_ATHLETES"
const STAFF_ASSIGNMENT_SHEET = "AFFECTATIONS_STAFF"
// CompatibilitÃ© temporaire des mutations; les lectures utilisent le modÃ¨le campagne/sÃ©lections.
const MEMBER_SHEET = "EQUIPES_NATIONALES_MEMBRES"
const TEAM_SHEET_HEADERS = ["id_equipe_nationale", "id_federation", "id_sport", "id_discipline", "nom_equipe_nationale", "id_categorie_age", "id_saison", "statut", "observation"] as const
const clean = (value: unknown) => String(value ?? "").trim()
const normalized = (value: string) => clean(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr")
const nextId = (values: string[], prefix: string, padding = 3) => `${prefix}${String(values.reduce((max, value) => { const match = value.match(new RegExp(`^${prefix}(\\d+)$`, "i")); return match ? Math.max(max, Number(match[1])) : max }, 0) + 1).padStart(padding, "0")}`

async function assertHeaders(sheetName: string, expected: readonly string[]) {
  const headers = await getSheetHeaders({ sheetName, spreadsheetId: getNationalTeamsSpreadsheetId() })
  const missing = expected.filter((header) => !headers.includes(header))
  if (missing.length) throw new Error(`Mapping ${sheetName} incomplet : ${missing.join(", ")}`)
}

const mapTeam = (row: Record<string, string>,seasons:Map<string,Record<string,string>>) => {const season=seasons.get(row.id_saison);return ({ ...Object.fromEntries(NATIONAL_TEAM_HEADERS.map((key) => [key, clean(row[key])])), observations: clean(row.observation),saison_label:clean(season?.nom_saison),saison_debut:clean(season?.date_debut),saison_fin:clean(season?.date_fin),date_debut:clean(season?.date_debut),date_fin:clean(season?.date_fin) }) as NationalTeam}

export async function getNationalTeams(options: { fresh?: boolean } = {}) {
  await assertHeaders(TEAM_SHEET, TEAM_SHEET_HEADERS)
  const [rows,seasons]=await Promise.all([getSheetRows({ sheetName: TEAM_SHEET, spreadsheetId: getNationalTeamsSpreadsheetId(), bypassCache: options.fresh }),getSheetRows({sheetName:"SAISONS",spreadsheetId:getReferentialSpreadsheetId(),bypassCache:options.fresh})])
  const seasonMap=new Map(seasons.map(row=>[row.id_saison,row]))
  return rows.map(row=>mapTeam(row,seasonMap)).filter((team) => team.id_equipe_nationale)
}

export async function getNationalTeam(id: string, options: { fresh?: boolean } = {}) {
  return (await getNationalTeams(options)).find((team) => team.id_equipe_nationale === clean(id))
}

export async function getNationalTeamCampaigns(teamId?: string, options: { fresh?: boolean } = {}): Promise<NationalTeamCampaign[]> {
  const rows = await getSheetRows({ sheetName: CAMPAIGN_SHEET, spreadsheetId: getNationalTeamsSpreadsheetId(), bypassCache: options.fresh })
  return rows.map((row) => ({ id_campagne: clean(row.id_campagne), id_equipe_nationale: clean(row.id_equipe_nationale), nom_campagne: clean(row.nom_campagne), date_debut: clean(row.date_debut), date_fin: clean(row.date_fin), objectif: clean(row.objectif), id_statut_campagne: clean(row.id_statut_campagne || row.statut), observation: clean(row.observation) })).filter((row) => row.id_campagne && (!teamId || row.id_equipe_nationale === teamId))
}

export async function getCampaignReferences() { const rows=await getSheetRows({sheetName:"STATUTS_CAMPAGNE",spreadsheetId:getReferentialSpreadsheetId()}); return { statuses:rows.filter((x)=>x.id_statut_campagne).map((x)=>({id:x.id_statut_campagne,label:x.nom_statut_campagne||x.id_statut_campagne})) } }

function assertCampaignPeriodWithinTeam(row: ReturnType<typeof validateCampaignInput>, team: NationalTeam) {
  if (team.saison_debut && row.date_debut < team.saison_debut) throw new Error("La campagne commence avant la saison de l’équipe nationale.")
  if (team.saison_fin && row.date_fin > team.saison_fin) throw new Error("La campagne se termine après la saison de l’équipe nationale.")
}

async function getCampaignMutationContext(teamId:string){
  const [teamTables,referenceTables]=await Promise.all([
    getSheetsRows({sheetNames:[TEAM_SHEET,CAMPAIGN_SHEET],spreadsheetId:getNationalTeamsSpreadsheetId()}),
    getSheetsRows({sheetNames:["SAISONS","STATUTS_CAMPAGNE"],spreadsheetId:getReferentialSpreadsheetId()}),
  ])
  const seasonMap=new Map(referenceTables.SAISONS.map(row=>[row.id_saison,row]))
  const teamRow=teamTables[TEAM_SHEET].find(row=>row.id_equipe_nationale===teamId)
  const team=teamRow?mapTeam(teamRow,seasonMap):undefined
  const allCampaigns=teamTables[CAMPAIGN_SHEET].map((row)=>({id_campagne:clean(row.id_campagne),id_equipe_nationale:clean(row.id_equipe_nationale),nom_campagne:clean(row.nom_campagne),date_debut:clean(row.date_debut),date_fin:clean(row.date_fin),objectif:clean(row.objectif),id_statut_campagne:clean(row.id_statut_campagne||row.statut),observation:clean(row.observation)})).filter(row=>row.id_campagne)
  const campaigns=allCampaigns.filter(row=>row.id_equipe_nationale===teamId)
  const statuses=new Set(referenceTables.STATUTS_CAMPAGNE.filter(row=>row.id_statut_campagne).map(row=>row.id_statut_campagne))
  return{team,campaigns,allCampaigns,statuses}
}

export async function createNationalTeamCampaign(teamId: string, input: Record<string, unknown>) {
  const context=await getCampaignMutationContext(teamId),team=context.team;if(!team)throw new Error("Équipe nationale introuvable.")
  const row=validateCampaignInput(input),existing=context.allCampaigns
  assertCampaignPeriodWithinTeam(row,team);if(!context.statuses.has(row.id_statut_campagne))throw new Error("Statut de campagne absent du référentiel.")
  if (existing.some((item) => item.id_equipe_nationale === teamId && normalized(item.nom_campagne) === normalized(row.nom_campagne) && item.date_debut === row.date_debut && item.date_fin === row.date_fin)) throw new Error("Cette campagne existe déjà.")
  const created = { id_campagne: nextId(existing.map((item) => item.id_campagne), "CAM", 4), id_equipe_nationale: teamId, ...row }
  await appendSheetRow({ sheetName: CAMPAIGN_SHEET, spreadsheetId: getNationalTeamsSpreadsheetId(), row: created })
  return created
}

export async function updateNationalTeamCampaign(teamId: string, id: string, input: Record<string, unknown>) {
  const context=await getCampaignMutationContext(teamId),team=context.team;if(!team)throw new Error("Équipe nationale introuvable.")
  const existing=context.campaigns,current=existing.find((item)=>item.id_campagne===id)
  if (!current) throw new Error("Campagne introuvable.")
  const row = validateCampaignInput(input)
  assertCampaignPeriodWithinTeam(row,team);if(!context.statuses.has(row.id_statut_campagne))throw new Error("Statut de campagne absent du référentiel.")
  if (existing.some((item) => item.id_campagne !== id && normalized(item.nom_campagne) === normalized(row.nom_campagne) && item.date_debut === row.date_debut && item.date_fin === row.date_fin)) throw new Error("Cette campagne existe déjà.")
  await updateSheetCells({ sheetName: CAMPAIGN_SHEET, spreadsheetId: getNationalTeamsSpreadsheetId(), idColumn: "id_campagne", idValue: id, updates: Object.entries(row).map(([column, value]) => ({ column, value })) })
  return { ...current, ...row }
}

export async function getCampaignSelections(teamId?: string, options: { fresh?: boolean } = {}): Promise<AthleteSelection[]> {
  const [campaigns, selections, athletes] = await Promise.all([getNationalTeamCampaigns(teamId, options), getSheetRows({sheetName:ATHLETE_SELECTION_SHEET,spreadsheetId:getNationalTeamsSpreadsheetId(),bypassCache:options.fresh}), getActorOptions("ATHLETE")])
  const campaignMap=new Map(campaigns.map((row)=>[row.id_campagne,row])), athleteMap=new Map(athletes.map((row)=>[row.id,row.label]))
  return selections.filter((row)=>campaignMap.has(row.id_campagne)).map((row)=>({id_selection:clean(row.id_selection),id_campagne:clean(row.id_campagne),id_athlete:clean(row.id_athlete),id_poste:clean(row.id_poste),id_categorie_poids:clean(row.id_categorie_poids),id_grade_sportif:clean(row.id_grade_sportif),date_selection:clean(row.date_selection),id_statut_selection:clean(row.id_statut_selection),observation:clean(row.observation),athlete_label:athleteMap.get(row.id_athlete)||row.id_athlete,campaign_label:campaignMap.get(row.id_campagne)?.nom_campagne||row.id_campagne})).filter((row)=>row.id_selection)
}

export async function getCampaignStaff(teamId?: string):Promise<StaffAssignment[]> {
  const campaigns=await getNationalTeamCampaigns(teamId), campaignIds=new Set(campaigns.map((row)=>row.id_campagne)), rows=await getSheetRows({sheetName:STAFF_ASSIGNMENT_SHEET,spreadsheetId:getNationalTeamsSpreadsheetId()})
  return rows.filter((row)=>campaignIds.has(row.id_campagne)).map((row)=>({id_affectation_staff:clean(row.id_affectation_staff),id_campagne:clean(row.id_campagne),id_acteur_coc:clean(row.id_acteur_coc),id_type_acteur:clean(row.id_type_acteur),id_role_staff:clean(row.id_role_staff),date_debut:clean(row.date_debut),date_fin:clean(row.date_fin),observation:clean(row.observation)}))
}

export async function getSelectionReferences(){const [statuses,athletes]=await Promise.all([getSheetRows({sheetName:"STATUTS_SELECTION",spreadsheetId:getReferentialSpreadsheetId()}),getActorOptions("ATHLETE")]);return{statuses:statuses.filter((row)=>row.id_statut_selection).map((row)=>({id:row.id_statut_selection,label:row.nom_statut_selection||row.id_statut_selection})),athletes}}

export async function createCampaignSelection(teamId:string,input:Record<string,unknown>){
  const row=validateSelectionInput(input),campaigns=await getNationalTeamCampaigns(teamId,{fresh:true}),campaign=campaigns.find((item)=>item.id_campagne===row.id_campagne);if(!campaign)throw new Error("Campagne étrangère à l’équipe.")
  const dateError=selectionCampaignDateError(row.date_selection,campaign.date_debut,campaign.date_fin);if(dateError)throw new Error(dateError)
  const refs=await getSelectionReferences();if(!refs.statuses.some((item)=>item.id===row.id_statut_selection))throw new Error("Statut de sélection absent du référentiel.");if(!refs.athletes.some((item)=>item.id===row.id_athlete))throw new Error("Athlète introuvable.")
  const existing=await getCampaignSelections(undefined,{fresh:true});if(existing.some((item)=>item.id_campagne===row.id_campagne&&item.id_athlete===row.id_athlete&&item.id_statut_selection!=="RETIRE"))throw new Error("Cet athlète possède déjà une sélection active dans la campagne.")
  const created={id_selection:nextId(existing.map((item)=>item.id_selection),"SEL",4),...row};await appendSheetRow({sheetName:ATHLETE_SELECTION_SHEET,spreadsheetId:getNationalTeamsSpreadsheetId(),row:created});return{...created,athlete_label:refs.athletes.find((item)=>item.id===row.id_athlete)?.label,campaign_label:campaign.nom_campagne}
}

export async function updateCampaignSelection(teamId:string,id:string,input:Record<string,unknown>){
  const current=(await getCampaignSelections(teamId,{fresh:true})).find((item)=>item.id_selection===id);if(!current)throw new Error("Sélection introuvable.")
  const row=validateSelectionInput({...input,id_campagne:current.id_campagne,id_athlete:current.id_athlete}),campaign=(await getNationalTeamCampaigns(teamId)).find((item)=>item.id_campagne===current.id_campagne);if(!campaign)throw new Error("Campagne introuvable.")
  const dateError=selectionCampaignDateError(row.date_selection,campaign.date_debut,campaign.date_fin);if(dateError)throw new Error(dateError)
  const refs=await getSelectionReferences();if(!refs.statuses.some((item)=>item.id===row.id_statut_selection))throw new Error("Statut de sélection absent du référentiel.")
  await updateSheetCells({sheetName:ATHLETE_SELECTION_SHEET,spreadsheetId:getNationalTeamsSpreadsheetId(),idColumn:"id_selection",idValue:id,updates:Object.entries(row).filter(([key])=>!['id_campagne','id_athlete'].includes(key)).map(([column,value])=>({column,value}))});return{...current,...row}
}

export async function getNationalTeamMembers(teamId?: string, actorId?: string, actorType?: string, options: { fresh?: boolean } = {}) {
  const spreadsheetId = getNationalTeamsSpreadsheetId()
  const sheetNames = [CAMPAIGN_SHEET, ATHLETE_SELECTION_SHEET, STAFF_ASSIGNMENT_SHEET]
  const rows: Record<string, Record<string, string>[]> = options.fresh
    ? Object.fromEntries(await Promise.all(sheetNames.map(async (sheetName) => [sheetName, await getSheetRows({ sheetName, spreadsheetId, bypassCache: true })])))
    : await getSheetsRows({ sheetNames, spreadsheetId })
  const campaigns = new Map(rows[CAMPAIGN_SHEET].map((row) => [row.id_campagne, row]))
  const athletes = rows[ATHLETE_SELECTION_SHEET].map((row) => { const campaign=campaigns.get(row.id_campagne); return { id_membre_equipe_nationale:`ATH:${row.id_selection}`, id_equipe_nationale:clean(campaign?.id_equipe_nationale), id_acteur_coc:clean(row.id_athlete), id_type_acteur:"ATHLETE", role_equipe:"ATHLETE", date_debut:clean(row.date_selection || campaign?.date_debut), date_fin:clean(campaign?.date_fin), statut:clean(row.id_statut_selection || campaign?.statut), observations:clean(row.observation) } as NationalTeamMember })
  const staff = rows[STAFF_ASSIGNMENT_SHEET].map((row) => { const campaign=campaigns.get(row.id_campagne); return { id_membre_equipe_nationale:`STAFF:${row.id_affectation_staff}`, id_equipe_nationale:clean(campaign?.id_equipe_nationale), id_acteur_coc:clean(row.id_acteur_coc), id_type_acteur:clean(row.id_type_acteur), role_equipe:clean(row.id_role_staff), date_debut:clean(row.date_debut), date_fin:clean(row.date_fin), statut:row.date_fin && row.date_fin < new Date().toISOString().slice(0,10) ? "INACTIF" : "ACTIF", observations:clean(row.observation) } as NationalTeamMember })
  return [...athletes,...staff].filter((member) => member.id_equipe_nationale && (!teamId || member.id_equipe_nationale === teamId) && (!actorId || member.id_acteur_coc === actorId) && (!actorType || member.id_type_acteur === actorType))
}

export async function getNationalTeamReferences(options: { fresh?: boolean } = {}): Promise<NationalTeamReferences> {
  const spreadsheetId = getReferentialSpreadsheetId()
  const [federations, refs] = await Promise.all([getFederationOptions({ fresh: options.fresh }), getSheetsRows({ sheetNames: ["SPORTS", "DISCIPLINES", "EPREUVES", "CATEGORIES_AGE", "SAISONS"], spreadsheetId, bypassCache: options.fresh })])
  let roles: { id: string; label: string }[] = NATIONAL_TEAM_ROLES.map((id) => ({ id, label: ({ ATHLETE: "Athlète", COACH_PRINCIPAL: "Coach principal", ASSISTANT_COACH: "Assistant coach", MEDECIN: "Médecin", PREPARATEUR: "Préparateur", SPARRING_PARTNER: "Sparring-partner", OFFICIEL: "Officiel", AUTRE: "Autre" } as Record<string, string>)[id] }))
  let rolesReferentialAvailable = false
  try { const found = (await getSheetRows({ sheetName: "ROLES_STAFF_EQUIPE_NATIONALE", spreadsheetId })).filter((row) => row.id_role_staff).map((row) => ({ id: row.id_role_staff, label: row.nom_role_staff || row.id_role_staff, parentId: row.id_type_acteur })); if (found.length) { roles = found; rolesReferentialAvailable = true } } catch {}
  const ageCategories = uniqueReferenceOptions(refs.CATEGORIES_AGE.filter((row) => row.id_categorie_age).map((row) => ({ id: row.id_categorie_age, label: row.nom_categorie_age || row.id_categorie_age, parentId: row.id_discipline || row.id_sport })))
  return {
    federations: uniqueReferenceOptions(federations.map((item) => ({ id: item.id, label: item.sigle || item.nom, secondary: item.nom, parentId: item.idSport }))),
    sports: uniqueReferenceOptions(refs.SPORTS.filter((row) => row.id_sport).map((row) => ({ id: row.id_sport, label: row.nom_sport }))),
    disciplines: uniqueReferenceOptions(refs.DISCIPLINES.filter((row) => row.id_discipline).map((row) => ({ id: row.id_discipline, label: row.nom_discipline, parentId: row.id_sport }))),
    events: uniqueReferenceOptions(refs.EPREUVES.filter((row) => row.id_epreuve).map((row) => ({ id: row.id_epreuve, label: row.nom_epreuve || row.id_epreuve, disciplineId: row.id_discipline }))),
    ageCategories,
    seasons:refs.SAISONS.filter(row=>row.id_saison).map(row=>({id:row.id_saison,label:row.nom_saison||row.id_saison,dateStart:row.date_debut,dateEnd:row.date_fin})),
    roles: uniqueReferenceOptions(roles),
    ageCategoriesAvailable: ageCategories.length > 0,
    rolesReferentialAvailable,
  }
}

function assertTeamReferences(row: ReturnType<typeof validateTeamInput>, refs: NationalTeamReferences) {
  const federation = refs.federations.find((item) => item.id === row.id_federation)
  if (!federation) throw new Error("Fédération inconnue.")
  if (!refs.sports.some((item) => item.id === row.id_sport)) throw new Error("Sport inconnu.")
  if (federation.parentId && federation.parentId !== row.id_sport) throw new Error("Le sport ne correspond pas à la fédération.")
  if (row.id_discipline && !refs.disciplines.some((item) => item.id === row.id_discipline && item.parentId === row.id_sport)) throw new Error("Discipline incohérente avec le sport.")
  if (row.id_categorie_age) { const expectedParent = row.id_discipline || row.id_sport; if (!refs.ageCategories.some((item) => item.id === row.id_categorie_age && item.parentId === expectedParent)) throw new Error("Catégorie d’âge incohérente avec le sport ou la discipline.") }
  if (!refs.seasons?.some((item) => item.id === row.id_saison)) throw new Error("Saison inconnue.")
}

const sameTeamIdentity = (left: NationalTeam, right: ReturnType<typeof validateTeamInput>) => left.id_federation === right.id_federation && left.id_sport === right.id_sport && left.id_discipline === right.id_discipline && left.id_categorie_age === right.id_categorie_age && left.id_saison===right.id_saison && normalized(left.nom_equipe_nationale) === normalized(right.nom_equipe_nationale)

export async function createNationalTeam(input: Record<string, unknown>) {
  const row = validateTeamInput(input)
  const refs = await getNationalTeamReferences(); assertTeamReferences(row, refs)
  const existing = await getNationalTeams({ fresh: true })
  if (existing.some((team) => sameTeamIdentity(team, row))) throw new Error("Une équipe nationale identique existe déjà.")
  const id = nextId(existing.map((team) => team.id_equipe_nationale), "EQN")
  if ((await getNationalTeams({ fresh: true })).some((team) => team.id_equipe_nationale === id)) throw new Error("Collision d’identifiant détectée. Réessayez.")
  const created = { id_equipe_nationale: id, ...row } as NationalTeam
  await appendSheetRow({ sheetName: TEAM_SHEET, spreadsheetId: getNationalTeamsSpreadsheetId(), row: { ...created, observation: created.observations } })
  return created
}

export async function updateNationalTeam(id: string, input: Record<string, unknown>) {
  const current = await getNationalTeam(id, { fresh: true }); if (!current) throw new Error("Équipe nationale introuvable.")
  const row = validateTeamInput({ ...input, id_federation: current.id_federation, id_sport: current.id_sport, id_saison:current.id_saison })
  const refs = await getNationalTeamReferences(); assertTeamReferences(row, refs)
  const existing = await getNationalTeams({ fresh: true }); if (existing.some((team) => team.id_equipe_nationale !== id && sameTeamIdentity(team, row))) throw new Error("Une équipe nationale identique existe déjà.")
  await updateSheetCells({ sheetName: TEAM_SHEET, spreadsheetId: getNationalTeamsSpreadsheetId(), idColumn: "id_equipe_nationale", idValue: id, updates: Object.entries(row).filter(([column])=>column!=="observations").map(([column, value]) => ({ column, value })).concat([{column:"observation",value:row.observations}]) })
  return { ...current, ...row }
}

export async function getActorOptions(type: ActorType, options: { fresh?: boolean } = {}) { return getActors(type, options) }

export async function getMemberActorLabels(members: NationalTeamMember[]) {
  const types = [...new Set(members.map((member) => member.id_type_acteur))] as ActorType[]
  const groups = await Promise.all(types.map(async (type) => [type, await getActorOptions(type)] as const))
  return Object.fromEntries(groups.flatMap(([type, actors]) => actors.map((actor) => [`${type}:${actor.id}`, actor.label])))
}

async function currentCampaign(teamId: string) {
  const rows = await getSheetRows({ sheetName: CAMPAIGN_SHEET, spreadsheetId: getNationalTeamsSpreadsheetId(), bypassCache: true })
  const matches = rows.filter((row) => row.id_equipe_nationale === teamId)
  return matches.find((row) => row.id_statut_campagne === "ACTIVE") || matches[0]
}

async function createCampaignMember(teamId: string, row: ReturnType<typeof validateMemberInput>): Promise<NationalTeamMember> {
  const campaign = await currentCampaign(teamId)
  if (!campaign) throw new Error("Créez d'abord une campagne pour cette équipe nationale.")
  const spreadsheetId = getNationalTeamsSpreadsheetId()
  const athlete = row.id_type_acteur === "ATHLETE"
  const sheetName = athlete ? ATHLETE_SELECTION_SHEET : STAFF_ASSIGNMENT_SHEET
  const idColumn = athlete ? "id_selection" : "id_affectation_staff"
  const prefix = athlete ? "SEL" : "AFF"
  const raw = await getSheetRows({ sheetName, spreadsheetId, bypassCache: true })
  const rawId = nextId(raw.map((item) => item[idColumn]), prefix)
  const id = `${athlete ? "ATH" : "STAFF"}:${rawId}`
  const physical: Record<string, string> = athlete
    ? { id_selection: rawId, id_campagne: campaign.id_campagne, id_athlete: row.id_acteur_coc, date_selection: row.date_debut, id_statut_selection: row.statut, observation: row.observations }
    : { id_affectation_staff: rawId, id_campagne: campaign.id_campagne, id_acteur_coc: row.id_acteur_coc, id_type_acteur: row.id_type_acteur, id_role_staff: row.role_equipe, date_debut: row.date_debut, date_fin: row.date_fin, observation: row.observations }
  await appendSheetRow({ sheetName, spreadsheetId, row: physical })
  return { id_membre_equipe_nationale: id, id_equipe_nationale: teamId, ...row }
}

async function updateCampaignMember(id: string, row: ReturnType<typeof validateMemberInput>) {
  const athlete = id.startsWith("ATH:")
  const rawId = id.slice(id.indexOf(":") + 1)
  await updateSheetCells({
    sheetName: athlete ? ATHLETE_SELECTION_SHEET : STAFF_ASSIGNMENT_SHEET,
    spreadsheetId: getNationalTeamsSpreadsheetId(),
    idColumn: athlete ? "id_selection" : "id_affectation_staff",
    idValue: rawId,
    updates: athlete
      ? [{ column: "date_selection", value: row.date_debut }, { column: "id_statut_selection", value: row.statut }, { column: "observation", value: row.observations }]
      : [{ column: "id_role_staff", value: row.role_equipe }, { column: "date_debut", value: row.date_debut }, { column: "date_fin", value: row.date_fin }, { column: "observation", value: row.observations }],
  })
}

export async function createNationalTeamMember(teamId: string, input: Record<string, unknown>) {
  if (!(await getNationalTeam(teamId, { fresh: true }))) throw new Error("Équipe nationale introuvable.")
  const row = validateMemberInput(input)
  const refs = await getNationalTeamReferences(); if (!refs.roles.some((role) => role.id === row.role_equipe)) throw new Error("Rôle d’équipe nationale invalide.")
  if (!(await getActorOptions(row.id_type_acteur as ActorType)).some((actor) => actor.id === row.id_acteur_coc)) throw new Error("Acteur introuvable ou type incohérent.")
  return createCampaignMember(teamId,row)
  const existing = await getNationalTeamMembers(undefined, undefined, undefined, { fresh: true })
  if (existing.some((member) => member.id_equipe_nationale === teamId && member.id_acteur_coc === row.id_acteur_coc && member.role_equipe === row.role_equipe && member.date_debut === row.date_debut)) throw new Error("Cette appartenance existe déjà pour la même période.")
  const id = nextId(existing.map((member) => member.id_membre_equipe_nationale), "MEN")
  if ((await getNationalTeamMembers(undefined, undefined, undefined, { fresh: true })).some((member) => member.id_membre_equipe_nationale === id)) throw new Error("Collision d’identifiant détectée. Réessayez.")
  const created = { id_membre_equipe_nationale: id, id_equipe_nationale: teamId, ...row } as NationalTeamMember
  await appendSheetRow({ sheetName: MEMBER_SHEET, spreadsheetId: getNationalTeamsSpreadsheetId(), row: created })
  return created
}

export async function updateNationalTeamMember(teamId: string, id: string, input: Record<string, unknown>) {
  const current = (await getNationalTeamMembers(teamId, undefined, undefined, { fresh: true })).find((member) => member.id_membre_equipe_nationale === id); if (!current) throw new Error("Membre introuvable.")
  const row = validateMemberInput({ ...input, id_acteur_coc: current.id_acteur_coc, id_type_acteur: current.id_type_acteur })
  const refs = await getNationalTeamReferences(); if (!refs.roles.some((role) => role.id === row.role_equipe)) throw new Error("Rôle d’équipe nationale invalide.")
  await updateCampaignMember(id,row)
  return { ...current, ...row, id_acteur_coc: current.id_acteur_coc, id_type_acteur: current.id_type_acteur }
}
