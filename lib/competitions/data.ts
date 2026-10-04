import "server-only"

import { appendSheetRow, appendSheetRows, deleteSheetRow, getSheetHeaders, getSheetRows, getSheetsRows, updateSheetCells } from "@/lib/google/sheets"
import { getReferentialSpreadsheetId } from "@/lib/federations/config"
import { getNationalTeamReferences, getNationalTeams as getCentralNationalTeams } from "@/lib/equipes-nationales/data"
import { getCampaignSelections } from "@/lib/equipes-nationales/data"
import { getActors } from "@/lib/activites/data"
import { getFederationOptions } from "@/lib/federations/options"
import { getNationalTeamsSpreadsheetId } from "@/lib/equipes-nationales/config"
import { getCompetitionsSpreadsheetId } from "./config"
import { normalizeCompetitionStatus } from "./format"
import { COMPETITION_HEADERS, PROGRAM_HEADERS, type AthleteParticipation, type CampaignEngagement, type Competition, type CompetitionMedal, type CompetitionParticipant, type CompetitionProgram, type CompetitionReferences, type CompetitionResult, type NationalTeamOption, type ParticipatingUnit, type TeamParticipation } from "./types"
import { MEDAL_DISTINCTIONS, validateAthleteParticipationInput, validateCompetitionInput, validateCompetitionMedalInput, validateCompetitionResultInput, validateEngagementInput, validateProgramInput, validateProgramSchedule } from "./validation"
import { ENGAGEMENT_STATUSES } from "./v1-model"
import { participatingUnitMedalLabel } from "./medals"
import { normalizeResultForType } from "./result-policy"

const clean = (value: unknown) => String(value ?? "").trim()
const COMPETITIONS_SHEET = "COMPETITIONS"
const TEAMS_SHEET = "ENGAGEMENTS_CAMPAGNES_PROGRAMMES"
const PROGRAMS_SHEET = "PROGRAMMES_COMPETITION"
const COMPETITION_SHEET_HEADERS = ["id_competition", "nom_competition", "id_type_competition", "id_niveau_competition", "edition", "est_multisport", "date_debut", "date_fin", "pays", "ville", "lieu", "id_statut_competition", "observation"] as const
const TEAM_SHEET_HEADERS = ["id_engagement_campagne", "id_programme_competition", "id_campagne", "id_statut_engagement", "date_engagement", "observation"] as const
const PROGRAM_SHEET_HEADERS = ["id_programme_competition", "id_competition", "id_epreuve", "id_categorie_age", "id_sexe", "date_debut", "date_fin", "observation"] as const
const RESULT_HEADERS = ["id_resultat","id_resultat_logique","numero_version","id_resultat_precedent","est_version_courante","id_engagement_campagne","id_programme_competition","id_unite_participante","date_resultat","phase","type_adversaire","nom_adversaire","pays_adversaire","id_resultat_synthetique","valeur_coc","valeur_adversaire","id_unite_mesure","id_decision_resultat","id_statut_resultat","motif_correction","observation"] as const

async function assertHeaders(sheetName: string, expected: readonly string[]) {
  const headers = await getSheetHeaders({ sheetName, spreadsheetId: getCompetitionsSpreadsheetId() })
  const missing = expected.filter((header) => !headers.includes(header))
  if (missing.length) throw new Error(`Mapping ${sheetName} incomplet : ${missing.join(", ")}`)
}

function mapCompetition(row: Record<string, string>): Competition {
  const mapped = Object.fromEntries(COMPETITION_HEADERS.map((header) => [header, clean(row[header])])) as Record<(typeof COMPETITION_HEADERS)[number], string>
  mapped.niveau_competition = clean(row.id_niveau_competition)
  mapped.est_multisport = clean(row.est_multisport)
  mapped.statut = clean(row.id_statut_competition)
  mapped.observations = clean(row.observation)
  return { ...mapped, statut_normalise: normalizeCompetitionStatus(mapped.statut) }
}

function nextId(values: string[], prefix: string) {
  const max = values.reduce((current, value) => {
    const match = value.match(new RegExp(`^${prefix}(\\d+)$`, "i"))
    return match ? Math.max(current, Number(match[1])) : current
  }, 0)
  return `${prefix}${String(max + 1).padStart(4, "0")}`
}
const competitionSheetRow = (row: Record<string, string>) => ({ ...row, id_niveau_competition: row.niveau_competition, id_statut_competition: row.statut, observation: row.observations })

export async function getCompetitions(options?: { bypassCache?: boolean }) {
  await assertHeaders(COMPETITIONS_SHEET, COMPETITION_SHEET_HEADERS)
  return (await getSheetRows({
    sheetName: COMPETITIONS_SHEET,
    spreadsheetId: getCompetitionsSpreadsheetId(),
    bypassCache: options?.bypassCache,
  })).map(mapCompetition).filter((row) => row.id_competition)
}

export async function getCompetition(id: string, options: { bypassCache?: boolean } = {}) {
  const normalizedId = clean(id).toLocaleUpperCase("fr")
  return (await getCompetitions(options)).find((row) => row.id_competition.toLocaleUpperCase("fr") === normalizedId)
}

export async function getTeamParticipations(competitionId?: string) {
  await assertHeaders(TEAMS_SHEET, TEAM_SHEET_HEADERS)
  const [engagements, programs, campaigns, teams] = await Promise.all([
    getSheetRows({ sheetName: TEAMS_SHEET, spreadsheetId: getCompetitionsSpreadsheetId() }),
    getSheetRows({ sheetName: "PROGRAMMES_COMPETITION", spreadsheetId: getCompetitionsSpreadsheetId() }),
    getSheetRows({ sheetName: "CAMPAGNES_EQUIPES_NATIONALES", spreadsheetId: getNationalTeamsSpreadsheetId() }),
    getSheetRows({ sheetName: "EQUIPES_NATIONALES", spreadsheetId: getNationalTeamsSpreadsheetId() }),
  ])
  const programMap = new Map(programs.map((row) => [row.id_programme_competition, row]))
  const campaignMap = new Map(campaigns.map((row) => [row.id_campagne, row]))
  const teamMap = new Map(teams.map((row) => [row.id_equipe_nationale, row]))
  return engagements.map((row) => {
    const program = programMap.get(row.id_programme_competition)
    const campaign = campaignMap.get(row.id_campagne)
    const team = teamMap.get(campaign?.id_equipe_nationale || "")
    return { id_participation_equipe: clean(row.id_engagement_campagne), id_competition: clean(program?.id_competition), id_equipe_nationale: clean(team?.id_equipe_nationale), statut_participation: clean(row.id_statut_engagement), date_engagement: clean(row.date_engagement), observations: clean(row.observation) } as TeamParticipation
  }).filter((row) => row.id_participation_equipe && (!competitionId || row.id_competition === competitionId))
}

async function getCompetitionTypes() {
  const rows = await getSheetRows({ sheetName: "TYPES_COMPETITION", spreadsheetId: getReferentialSpreadsheetId() })
  return rows.filter((row) => row.id_type_competition).map((row) => ({ id: clean(row.id_type_competition), label: clean(row.nom_type_competition) || clean(row.id_type_competition), scope: clean(row.portee_sportive) }))
}

async function getOptions(sheetName: string, idColumn: string, labelColumn: string) {
  return (await getSheetRows({ sheetName, spreadsheetId: getReferentialSpreadsheetId() })).filter((row) => row[idColumn]).map((row) => ({ id: clean(row[idColumn]), label: clean(row[labelColumn]) || clean(row[idColumn]) }))
}

export async function getNationalTeams(): Promise<{ teams: NationalTeamOption[]; available: boolean }> {
  const [rows, references] = await Promise.all([getCentralNationalTeams(), getNationalTeamReferences()])
  const teams = rows.map((row) => ({
    id: row.id_equipe_nationale,
    label: row.nom_equipe_nationale || row.id_equipe_nationale,
    federationId: row.id_federation,
    federation: references.federations.find((item) => item.id === row.id_federation)?.label || row.id_federation,
    sportId: row.id_sport,
    sport: references.sports.find((item) => item.id === row.id_sport)?.label || row.id_sport,
    discipline: references.disciplines.find((item) => item.id === row.id_discipline)?.label || row.id_discipline,
  }))
  return { teams: teams.sort((a, b) => a.label.localeCompare(b.label, "fr")), available: true }
}

export async function getCompetitionReferences(): Promise<CompetitionReferences> {
  const spreadsheetId = getReferentialSpreadsheetId()
  const [types, levels, statuses, refs, federations, nationalTeams] = await Promise.all([getCompetitionTypes(), getOptions("NIVEAUX_COMPETITION", "id_niveau_competition", "nom_niveau_competition"), getOptions("STATUTS_COMPETITION", "id_statut_competition", "nom_statut_competition"), getSheetsRows({ sheetNames: ["EPREUVES", "CATEGORIES_AGE", "SEXES", "SPORTS", "DISCIPLINES"], spreadsheetId }), getFederationOptions(), getNationalTeams().catch(() => ({ teams: [], available: false }))])
  const events = refs.EPREUVES.filter((row) => row.id_epreuve).map((row) => ({ id: row.id_epreuve, label: row.nom_epreuve || row.id_epreuve, federationId: row.id_federation, sportId: row.id_sport, disciplineId: row.id_discipline, formatId: row.id_format_participation, resultTypeId: row.id_type_resultat }))
  const ageCategories = refs.CATEGORIES_AGE.filter((row) => row.id_categorie_age).map((row) => ({ id: row.id_categorie_age, label: row.nom_categorie_age || row.id_categorie_age, federationId: row.id_federation, sportId: row.id_sport, disciplineId: row.id_discipline }))
  const sexes = refs.SEXES.filter((row) => row.id_sexe).map((row) => ({ id: row.id_sexe, label: row.nom_sexe || row.id_sexe }))
  const sports = refs.SPORTS.filter((row) => row.id_sport).map((row) => ({ id: row.id_sport, label: row.nom_sport || row.id_sport }))
  const disciplines = refs.DISCIPLINES.filter((row) => row.id_discipline).map((row) => ({ id: row.id_discipline, label: row.nom_discipline || row.id_discipline, sportId: row.id_sport, federationId: row.id_federation }))
  return { types, levels, statuses, events, ageCategories, sexes, sports, disciplines, federations: federations.map((row) => ({ id: row.id, label: row.sigle || row.nom })), teams: nationalTeams.teams, teamsAvailable: nationalTeams.available }
}

export async function createCompetition(input: Record<string, unknown>) {
  const row = validateCompetitionInput(input)
  const references = await getCompetitionReferences()
  if (!references.types.some((type) => type.id === row.id_type_competition)) throw new Error("Type de compétition inconnu.")
  const type = references.types.find((item) => item.id === row.id_type_competition)
  if (type?.scope === "MULTISPORTS" && row.est_multisport !== "OUI") throw new Error("Ce type de compétition doit être multisport.")
  if (type?.scope === "MONOSPORT" && row.est_multisport !== "NON") throw new Error("Ce type de compétition doit être monosport.")
  if (!references.levels?.some((level) => level.id === row.niveau_competition)) throw new Error("Niveau de compétition inconnu.")
  if (!references.statuses?.some((status) => status.id === row.statut)) throw new Error("Statut de compétition inconnu.")
  const existing = await getCompetitions()
  const id = nextId(existing.map((item) => item.id_competition), "COMP")
  if (existing.some((item) => item.id_competition === id)) throw new Error("Impossible de générer un identifiant unique.")
  const created = { id_competition: id, ...row }
  await appendSheetRow({ sheetName: COMPETITIONS_SHEET, spreadsheetId: getCompetitionsSpreadsheetId(), row: competitionSheetRow(created) })
  return mapCompetition(created)
}

export async function updateCompetition(id: string, input: Record<string, unknown>) {
  const current = await getCompetition(id)
  if (!current) throw new Error("Compétition introuvable.")
  const row = validateCompetitionInput(input)
  const references = await getCompetitionReferences()
  if (!references.types.some((type) => type.id === row.id_type_competition)) throw new Error("Type de compétition inconnu.")
  const type = references.types.find((item) => item.id === row.id_type_competition)
  if (type?.scope === "MULTISPORTS" && row.est_multisport !== "OUI") throw new Error("Ce type de compétition doit être multisport.")
  if (type?.scope === "MONOSPORT" && row.est_multisport !== "NON") throw new Error("Ce type de compétition doit être monosport.")
  if (!references.levels?.some((level) => level.id === row.niveau_competition)) throw new Error("Niveau de compétition inconnu.")
  if (!references.statuses?.some((status) => status.id === row.statut)) throw new Error("Statut de compétition inconnu.")
  const physical: Record<string, string> = competitionSheetRow(row)
  await updateSheetCells({ sheetName: COMPETITIONS_SHEET, spreadsheetId: getCompetitionsSpreadsheetId(), idColumn: "id_competition", idValue: current.id_competition, updates: ["nom_competition","id_type_competition","est_multisport","id_niveau_competition","date_debut","date_fin","pays","ville","lieu","id_statut_competition","observation"].map((column) => ({ column, value: physical[column] })) })
  return mapCompetition({ id_competition: current.id_competition, ...row, edition: current.edition })
}

function mapProgram(row: Record<string, string>): CompetitionProgram {
  const mapped = Object.fromEntries(PROGRAM_HEADERS.map((header) => [header, clean(row[header])])) as Record<(typeof PROGRAM_HEADERS)[number], string>
  mapped.observations = clean(row.observation)
  return mapped
}

export async function getCompetitionPrograms(competitionId?: string, options: { bypassCache?: boolean } = {}) {
  await assertHeaders(PROGRAMS_SHEET, PROGRAM_SHEET_HEADERS)
  return (await getSheetRows({ sheetName: PROGRAMS_SHEET, spreadsheetId: getCompetitionsSpreadsheetId(), bypassCache: options.bypassCache })).map(mapProgram).filter((row) => row.id_programme_competition && (!competitionId || row.id_competition === competitionId))
}

function assertProgramReferences(row: ReturnType<typeof validateProgramInput>, references: CompetitionReferences) {
  const event = references.events?.find((item) => item.id === row.id_epreuve)
  if (!event) throw new Error("Épreuve inconnue.")
  if (row.id_sexe && !references.sexes?.some((item) => item.id === row.id_sexe)) throw new Error("Sexe inconnu.")
  if (row.id_categorie_age && !references.ageCategories?.some((item) => item.id === row.id_categorie_age && (!item.sportId || item.sportId === event.sportId) && (!item.disciplineId || item.disciplineId === event.disciplineId))) throw new Error("Catégorie d’âge incompatible avec l’épreuve.")
  return event
}

export async function createCompetitionProgram(competitionId: string, input: Record<string, unknown>) {
  const competition = await getCompetition(competitionId)
  if (!competition) throw new Error("Compétition introuvable.")
  const row = validateProgramInput(input)
  validateProgramSchedule(row, competition)
  const references = await getCompetitionReferences()
  const event = assertProgramReferences(row, references)
  const existing = await getCompetitionPrograms()
  if (existing.some((item) => item.id_competition === competitionId && item.id_epreuve === row.id_epreuve && item.id_categorie_age === row.id_categorie_age && item.id_sexe === row.id_sexe)) throw new Error("Ce programme existe déjà.")
  if (competition.est_multisport === "NON") {
    const sports = new Set(existing.filter((item) => item.id_competition === competitionId).map((item) => references.events?.find((option) => option.id === item.id_epreuve)?.sportId).filter(Boolean))
    if (sports.size && !sports.has(event.sportId)) throw new Error("Une compétition monosport ne peut pas contenir plusieurs sports.")
  }
  const id = nextId(existing.map((item) => item.id_programme_competition), "PRG")
  const created = { id_programme_competition: id, id_competition: competitionId, ...row }
  await appendSheetRow({ sheetName: PROGRAMS_SHEET, spreadsheetId: getCompetitionsSpreadsheetId(), row: { ...created, observation: created.observations } })
  const confirmed = (await getCompetitionPrograms()).find((item) => item.id_programme_competition === id)
  if (!confirmed) throw new Error("Création du programme non confirmée.")
  return confirmed
}

export async function updateCompetitionProgram(competitionId: string, id: string, input: Record<string, unknown>) {
  const competition = await getCompetition(competitionId)
  const current = (await getCompetitionPrograms(competitionId)).find((item) => item.id_programme_competition === id)
  if (!competition || !current) throw new Error("Programme introuvable.")
  const row = validateProgramInput({ ...input, id_epreuve: current.id_epreuve })
  validateProgramSchedule(row, competition)
  const references = await getCompetitionReferences(); assertProgramReferences(row, references)
  const existing = await getCompetitionPrograms()
  if (existing.some((item) => item.id_programme_competition !== id && item.id_competition === competitionId && item.id_epreuve === row.id_epreuve && item.id_categorie_age === row.id_categorie_age && item.id_sexe === row.id_sexe)) throw new Error("Ce programme existe déjà.")
  const physical = { ...row, observation: row.observations }
  await updateSheetCells({ sheetName: PROGRAMS_SHEET, spreadsheetId: getCompetitionsSpreadsheetId(), idColumn: "id_programme_competition", idValue: id, updates: ["id_categorie_age", "id_sexe", "date_debut", "date_fin", "observation"].map((column) => ({ column, value: physical[column as keyof typeof physical] })) })
  return mapProgram({ ...current, ...row, observation: row.observations })
}

export async function getCampaignEngagements(filters: { competitionId?: string; teamId?: string; fresh?: boolean } = {}): Promise<CampaignEngagement[]> {
  const [engagements, programs, campaigns, teams] = await Promise.all([
    getSheetRows({ sheetName: TEAMS_SHEET, spreadsheetId: getCompetitionsSpreadsheetId(), bypassCache: filters.fresh }), getCompetitionPrograms(undefined, { bypassCache: filters.fresh }),
    getSheetRows({ sheetName: "CAMPAGNES_EQUIPES_NATIONALES", spreadsheetId: getNationalTeamsSpreadsheetId(), bypassCache: filters.fresh }), getCentralNationalTeams({ fresh: filters.fresh }),
  ])
  const programMap = new Map(programs.map((row) => [row.id_programme_competition, row])), campaignMap = new Map(campaigns.map((row) => [row.id_campagne, row])), teamMap = new Map(teams.map((row) => [row.id_equipe_nationale, row]))
  return engagements.map((row) => { const campaign = campaignMap.get(row.id_campagne), team = teamMap.get(campaign?.id_equipe_nationale || ""); return { ...Object.fromEntries(TEAM_SHEET_HEADERS.map((header) => [header, clean(row[header])])), id_equipe_nationale: clean(campaign?.id_equipe_nationale), nom_equipe_nationale: clean(team?.nom_equipe_nationale), nom_campagne: clean(campaign?.nom_campagne), id_federation_responsable: clean(team?.id_federation) } as CampaignEngagement }).filter((row) => row.id_engagement_campagne && (!filters.competitionId || programMap.get(row.id_programme_competition)?.id_competition === filters.competitionId) && (!filters.teamId || row.id_equipe_nationale === filters.teamId))
}

export async function getEngagementReferences() {
  const [campaigns, statuses, federations, teams] = await Promise.all([
    getSheetRows({ sheetName: "CAMPAGNES_EQUIPES_NATIONALES", spreadsheetId: getNationalTeamsSpreadsheetId() }),
    getSheetRows({ sheetName: "STATUTS_ENGAGEMENT_PROGRAMME", spreadsheetId: getReferentialSpreadsheetId() }), getFederationOptions(), getCentralNationalTeams(),
  ])
  const teamMap = new Map(teams.map((row) => [row.id_equipe_nationale, row]))
  return { campaigns: campaigns.filter((row) => row.id_campagne).map((row) => { const team = teamMap.get(row.id_equipe_nationale); return { id: row.id_campagne, label: row.nom_campagne || row.id_campagne, teamId: row.id_equipe_nationale, teamName: team?.nom_equipe_nationale || row.id_equipe_nationale, federationId: team?.id_federation || "", dateStart: row.date_debut || "", dateEnd: row.date_fin || "", status: row.id_statut_campagne || row.statut } }), statuses: statuses.filter((row) => row.id_statut_engagement).map((row) => ({ id: row.id_statut_engagement, label: row.nom_statut_engagement || row.id_statut_engagement })), federations: federations.map((row) => ({ id: row.id, label: row.sigle || row.nom })) }
}

async function prepareEngagement(competitionId: string, input: Record<string, unknown>, immutable?: { id_programme_competition: string; id_campagne: string }) {
  const row = validateEngagementInput({ ...input, ...immutable })
  const [competition, programs, references, teams] = await Promise.all([getCompetition(competitionId), getCompetitionPrograms(competitionId), getEngagementReferences(), getCentralNationalTeams()])
  if (!competition) throw new Error("Compétition introuvable.")
  const program = programs.find((item) => item.id_programme_competition === row.id_programme_competition); if (!program) throw new Error("Programme étranger à la compétition.")
  const campaign = references.campaigns.find((item) => item.id === row.id_campagne); if (!campaign) throw new Error("Campagne introuvable.")
  const team = teams.find((item) => item.id_equipe_nationale === campaign.teamId); if (!team) throw new Error("Équipe nationale de la campagne introuvable.")
  if (!references.statuses.some((item) => item.id === row.id_statut_engagement) || !ENGAGEMENT_STATUSES.includes(row.id_statut_engagement as (typeof ENGAGEMENT_STATUSES)[number])) throw new Error("Statut d’engagement inconnu.")
  const start = program.date_debut || competition.date_debut, end = program.date_fin || competition.date_fin
  if ((campaign.dateEnd && campaign.dateEnd < start) || (end && campaign.dateStart > end)) throw new Error("La campagne est hors de la période du programme.")
  if (row.date_engagement < start || (end && row.date_engagement > end)) throw new Error("La date d’engagement est hors de la période du programme.")
  return row
}

export async function createCampaignEngagement(competitionId: string, input: Record<string, unknown>) {
  const row = await prepareEngagement(competitionId, input), existing = await getCampaignEngagements()
  if (row.id_statut_engagement !== "ANNULE" && existing.some((item) => item.id_programme_competition === row.id_programme_competition && item.id_campagne === row.id_campagne && item.id_statut_engagement !== "ANNULE")) throw new Error("Cette campagne est déjà engagée dans ce programme.")
  const created = { id_engagement_campagne: nextId(existing.map((item) => item.id_engagement_campagne), "ENG"), ...row }
  await appendSheetRow({ sheetName: TEAMS_SHEET, spreadsheetId: getCompetitionsSpreadsheetId(), row: created })
  return (await getCampaignEngagements({ competitionId, fresh: true })).find((item) => item.id_engagement_campagne === created.id_engagement_campagne) || created
}

export async function updateCampaignEngagement(competitionId: string, id: string, input: Record<string, unknown>) {
  const current = (await getCampaignEngagements({ competitionId })).find((item) => item.id_engagement_campagne === id); if (!current) throw new Error("Engagement introuvable.")
  const row = await prepareEngagement(competitionId, input, { id_programme_competition: current.id_programme_competition, id_campagne: current.id_campagne })
  const siblings = (await getCampaignEngagements()).filter((item) => item.id_engagement_campagne !== id && item.id_programme_competition === current.id_programme_competition && item.id_campagne === current.id_campagne && item.id_statut_engagement !== "ANNULE")
  if (row.id_statut_engagement !== "ANNULE" && siblings.length) throw new Error("Cette campagne est déjà engagée dans ce programme.")
  await updateSheetCells({ sheetName: TEAMS_SHEET, spreadsheetId: getCompetitionsSpreadsheetId(), idColumn: "id_engagement_campagne", idValue: id, updates: TEAM_SHEET_HEADERS.slice(3).map((column) => ({ column, value: row[column as keyof typeof row] })) })
  return { ...current, ...row }
}

export async function getAthleteParticipations(filters:{competitionId?:string;engagementId?:string;fresh?:boolean}={}):Promise<AthleteParticipation[]>{
  const [rows,engagements,selections]=await Promise.all([getSheetRows({sheetName:"PARTICIPATIONS_ACTEURS_COMPETITION",spreadsheetId:getCompetitionsSpreadsheetId(),bypassCache:filters.fresh}),getCampaignEngagements(filters.competitionId?{competitionId:filters.competitionId,fresh:filters.fresh}:{fresh:filters.fresh}),getCampaignSelections()])
  const engagementIds=new Set(engagements.map((row)=>row.id_engagement_campagne)),selectionMap=new Map(selections.map((row)=>[row.id_selection,row]))
  return rows.filter((row)=>engagementIds.has(row.id_engagement_campagne)&&(!filters.engagementId||row.id_engagement_campagne===filters.engagementId)).map((row)=>{const selection=selectionMap.get(row.id_selection),id=clean(row.id_participation_acteur);return{id_participation_acteur:id,id_participation_athlete:id,id_engagement_campagne:clean(row.id_engagement_campagne),id_acteur_coc:clean(row.id_acteur_coc),id_type_acteur:clean(row.id_type_acteur),id_selection:clean(row.id_selection),id_affectation_staff:clean(row.id_affectation_staff),id_statut_participation:clean(row.id_statut_participation),date_statut:clean(row.date_statut),id_participation_remplacement:clean(row.id_participation_remplacement),id_selection_remplacement:clean(row.id_participation_remplacement),observation:clean(row.observation),athlete_id:selection?.id_athlete||clean(row.id_acteur_coc),athlete_label:selection?.athlete_label,campaign_id:selection?.id_campagne}}).filter((row)=>row.id_participation_acteur)
}

const PARTICIPANT_ACTOR_TYPES = ["ATHLETE", "COACH", "OFFICIEL", "ARBITRE", "MEDECIN", "AUTRE"] as const
const ACTOR_TYPE_LABELS: Record<string,string> = { ATHLETE:"Athlètes", COACH:"Entraîneurs", OFFICIEL:"Officiels", ARBITRE:"Arbitres", MEDECIN:"Médecins", AUTRE:"Autres" }

export async function getCompetitionParticipants(competitionId:string, fresh=false):Promise<CompetitionParticipant[]> {
  const [participants, engagements, campaigns, teams, references, assignments, roles, actorGroups] = await Promise.all([
    getAthleteParticipations({competitionId,fresh}),
    getCampaignEngagements({competitionId,fresh}),
    getSheetRows({sheetName:"CAMPAGNES_EQUIPES_NATIONALES",spreadsheetId:getNationalTeamsSpreadsheetId(),bypassCache:fresh}),
    getCentralNationalTeams({fresh}),
    getCompetitionReferences(),
    getSheetRows({sheetName:"AFFECTATIONS_STAFF",spreadsheetId:getNationalTeamsSpreadsheetId(),bypassCache:fresh}),
    getSheetRows({sheetName:"ROLES_STAFF_EQUIPE_NATIONALE",spreadsheetId:getReferentialSpreadsheetId(),bypassCache:fresh}).catch(()=>[]),
    Promise.all(PARTICIPANT_ACTOR_TYPES.map(async type=>[type,await getActors(type,{fresh})] as const)),
  ])
  const engagementMap=new Map(engagements.map(row=>[row.id_engagement_campagne,row])), campaignMap=new Map(campaigns.map(row=>[row.id_campagne,row])), teamMap=new Map(teams.map(row=>[row.id_equipe_nationale,row]))
  const sportMap=new Map((references.sports||[]).map(row=>[row.id,row.label])), assignmentMap=new Map(assignments.map(row=>[row.id_affectation_staff,row])), roleMap=new Map(roles.map(row=>[row.id_role_staff,row.nom_role_staff||row.id_role_staff]))
  const actorMap=new Map<string,string>(actorGroups.flatMap(([type,actors])=>actors.map(actor=>[`${type}:${actor.id}`,actor.label] as [string,string])))
  return participants.map(row=>{const engagement=engagementMap.get(row.id_engagement_campagne),campaign=campaignMap.get(engagement?.id_campagne||""),team=teamMap.get(campaign?.id_equipe_nationale||""),assignment=assignmentMap.get(row.id_affectation_staff),sportId=team?.id_sport||"NON_RENSEIGNE";return {...row,actor_label:actorMap.get(`${row.id_type_acteur}:${row.id_acteur_coc}`)||row.athlete_label||row.id_acteur_coc,sport_id:sportId,sport_label:sportMap.get(sportId)||team?.id_sport||"Sport non renseigné",actor_type_label:ACTOR_TYPE_LABELS[row.id_type_acteur]||row.id_type_acteur,role_label:roleMap.get(assignment?.id_role_staff||"")||assignment?.id_role_staff||"",campaign_label:engagement?.nom_campagne||campaign?.nom_campagne||engagement?.id_campagne||""}})
}

export async function getCocParticipantReferences(actorType?:string) {
  const type=clean(actorType).toUpperCase()
  const actors=PARTICIPANT_ACTOR_TYPES.includes(type as typeof PARTICIPANT_ACTOR_TYPES[number])&&type!=="ATHLETE"?await getActors(type,{fresh:true}):[]
  const roles=await getSheetRows({sheetName:"ROLES_STAFF_EQUIPE_NATIONALE",spreadsheetId:getReferentialSpreadsheetId()}).catch(()=>[])
  const typeIds:Record<string,string[]>={COACH:["COACH","TYPACT002"],MEDECIN:["MEDECIN","TYPACT003"],ARBITRE:["ARBITRE","TYPACT004"],OFFICIEL:["OFFICIEL","OFFICIELS","TYPACT005"],AUTRE:["AUTRE","AUTRES","TYPACT006"]}
  return {actors,roles:roles.filter(row=>row.id_role_staff&&(!row.id_type_acteur||(typeIds[type]||[type]).includes(row.id_type_acteur))).map(row=>({id:row.id_role_staff,label:row.nom_role_staff||row.id_role_staff}))}
}

export async function createCocParticipant(competitionId:string,input:Record<string,unknown>) {
  const engagementId=clean(input.id_engagement_campagne),type=clean(input.id_type_acteur).toUpperCase(),actorId=clean(input.id_acteur_coc),roleId=clean(input.id_role_staff),dateStart=clean(input.date_debut),dateEnd=clean(input.date_fin),observation=clean(input.observation)
  if(!PARTICIPANT_ACTOR_TYPES.includes(type as typeof PARTICIPANT_ACTOR_TYPES[number])||type==="ATHLETE")throw new Error("Type d’acteur COC invalide.")
  if(!engagementId||!actorId||!dateStart)throw new Error("L’engagement, l’acteur et la date de début sont obligatoires.")
  if(dateEnd&&dateEnd<dateStart)throw new Error("La date de fin doit être postérieure à la date de début.")
  const [engagements,actors,participantRows,assignmentRows,statusRows]=await Promise.all([getCampaignEngagements({competitionId,fresh:true}),getActors(type,{fresh:true}),getSheetRows({sheetName:"PARTICIPATIONS_ACTEURS_COMPETITION",spreadsheetId:getCompetitionsSpreadsheetId(),bypassCache:true}),getSheetRows({sheetName:"AFFECTATIONS_STAFF",spreadsheetId:getNationalTeamsSpreadsheetId(),bypassCache:true}),getSheetRows({sheetName:"STATUTS_PARTICIPATION_ATHLETE",spreadsheetId:getReferentialSpreadsheetId()})])
  const engagement=engagements.find(row=>row.id_engagement_campagne===engagementId);if(!engagement)throw new Error("Engagement étranger à la compétition.")
  if(!actors.some(row=>row.id===actorId))throw new Error("Acteur introuvable ou type incohérent.")
  if(dateStart<engagement.date_engagement)throw new Error("La date de début est antérieure à la date d’engagement.")
  const duplicate=participantRows.find(row=>row.id_engagement_campagne===engagementId&&row.id_acteur_coc===actorId&&row.id_type_acteur===type);if(duplicate)return (await getCompetitionParticipants(competitionId,true)).find(row=>row.id_participation_acteur===duplicate.id_participation_acteur)
  let assignment=assignmentRows.find(row=>row.id_campagne===engagement.id_campagne&&row.id_acteur_coc===actorId&&row.id_type_acteur===type)
  if(!assignment){if(type!=="ARBITRE"&&!roleId)throw new Error("Le rôle est obligatoire pour ce type d’acteur.");assignment={id_affectation_staff:nextId(assignmentRows.map(row=>row.id_affectation_staff),"AFF"),id_campagne:engagement.id_campagne,id_acteur_coc:actorId,id_type_acteur:type,id_role_staff:roleId,date_debut:dateStart,date_fin:dateEnd,observation};await appendSheetRow({sheetName:"AFFECTATIONS_STAFF",spreadsheetId:getNationalTeamsSpreadsheetId(),row:assignment})}
  const participantStatus=statusRows.find(row=>row.id_statut_participation==="PARTICIPANT")?.id_statut_participation||statusRows.find(row=>row.id_statut_participation)?.id_statut_participation;if(!participantStatus)throw new Error("Statut initial de participation indisponible.")
  const physical={id_participation_acteur:nextId(participantRows.map(row=>row.id_participation_acteur),"PAR"),id_engagement_campagne:engagementId,id_acteur_coc:actorId,id_type_acteur:type,id_selection:"",id_affectation_staff:assignment.id_affectation_staff,id_statut_participation:participantStatus,date_statut:dateStart,id_participation_remplacement:"",observation}
  await appendSheetRow({sheetName:"PARTICIPATIONS_ACTEURS_COMPETITION",spreadsheetId:getCompetitionsSpreadsheetId(),row:physical})
  return (await getCompetitionParticipants(competitionId,true)).find(row=>row.id_participation_acteur===physical.id_participation_acteur)
}

export async function getParticipationReferences(){const [statuses,selections]=await Promise.all([getSheetRows({sheetName:"STATUTS_PARTICIPATION_ATHLETE",spreadsheetId:getReferentialSpreadsheetId()}),getCampaignSelections()]);return{statuses:statuses.filter((row)=>row.id_statut_participation).map((row)=>({id:row.id_statut_participation,label:row.nom_statut_participation||row.id_statut_participation})),selections}}

async function prepareParticipation(competitionId:string,input:Record<string,unknown>,immutable?:{id_engagement_campagne:string;id_selection:string}){
  const row=validateAthleteParticipationInput({...input,...immutable}),[engagements,refs]=await Promise.all([getCampaignEngagements({competitionId}),getParticipationReferences()]),engagement=engagements.find((item)=>item.id_engagement_campagne===row.id_engagement_campagne);if(!engagement)throw new Error("Engagement étranger à la compétition.")
  const selection=refs.selections.find((item)=>item.id_selection===row.id_selection);if(!selection||selection.id_campagne!==engagement.id_campagne)throw new Error("La sélection n’appartient pas à la campagne engagée.")
  if(!refs.statuses.some((item)=>item.id===row.id_statut_participation))throw new Error("Statut de participation absent du référentiel.")
  if(row.id_selection_remplacement){const replacement=refs.selections.find((item)=>item.id_selection===row.id_selection_remplacement);if(!replacement||replacement.id_campagne!==selection.id_campagne||replacement.id_statut_selection!=="REMPLACANT")throw new Error("La sélection remplaçante est invalide.")}
  if(row.date_statut<engagement.date_engagement)throw new Error("La date de participation est antérieure à la date d’engagement.")
  return row
}

export async function createAthleteParticipation(competitionId:string,input:Record<string,unknown>){const row=await prepareParticipation(competitionId,input),existing=await getAthleteParticipations();if(existing.some((item)=>item.id_engagement_campagne===row.id_engagement_campagne&&item.id_selection===row.id_selection))throw new Error("Une participation existe déjà pour cette sélection et cet engagement.");const selection=(await getCampaignSelections()).find(x=>x.id_selection===row.id_selection),id=nextId(existing.map((item)=>item.id_participation_acteur),"PAR");const physical={id_participation_acteur:id,id_engagement_campagne:row.id_engagement_campagne,id_acteur_coc:selection?.id_athlete||"",id_type_acteur:"ATHLETE",id_selection:row.id_selection,id_affectation_staff:"",id_statut_participation:row.id_statut_participation,date_statut:row.date_statut,id_participation_remplacement:row.id_selection_remplacement,observation:row.observation};await appendSheetRow({sheetName:"PARTICIPATIONS_ACTEURS_COMPETITION",spreadsheetId:getCompetitionsSpreadsheetId(),row:physical});return{...physical,id_participation_athlete:id,id_selection_remplacement:physical.id_participation_remplacement}}

export async function updateAthleteParticipation(competitionId:string,id:string,input:Record<string,unknown>){const current=(await getAthleteParticipations({competitionId})).find((item)=>item.id_participation_acteur===id);if(!current)throw new Error("Participation introuvable.");const row=await prepareParticipation(competitionId,input,{id_engagement_campagne:current.id_engagement_campagne,id_selection:current.id_selection});await updateSheetCells({sheetName:"PARTICIPATIONS_ACTEURS_COMPETITION",spreadsheetId:getCompetitionsSpreadsheetId(),idColumn:"id_participation_acteur",idValue:id,updates:[{column:"id_statut_participation",value:row.id_statut_participation},{column:"date_statut",value:row.date_statut},{column:"id_participation_remplacement",value:row.id_selection_remplacement},{column:"observation",value:row.observation}]});return{...current,...row,id_participation_remplacement:row.id_selection_remplacement}}

export async function getParticipatingUnits(competitionId?:string):Promise<ParticipatingUnit[]>{
 const spreadsheetId=getCompetitionsSpreadsheetId()
 const [tables,selections]=await Promise.all([
  getSheetsRows({sheetNames:["UNITES_PARTICIPANTES","MEMBRES_UNITES_PARTICIPANTES",TEAMS_SHEET,PROGRAMS_SHEET,"PARTICIPATIONS_ACTEURS_COMPETITION"],spreadsheetId}),
  getCampaignSelections().catch(() => []),
 ])
 const programIds=new Set(tables[PROGRAMS_SHEET].filter(row=>!competitionId||row.id_competition===competitionId).map(row=>row.id_programme_competition))
 const engagementIds=new Set(tables[TEAMS_SHEET].filter(row=>programIds.has(row.id_programme_competition)).map(row=>row.id_engagement_campagne))
 const selectionMap=new Map(selections.map(row=>[row.id_selection,row]))
 const participantMap=new Map(tables.PARTICIPATIONS_ACTEURS_COMPETITION.map(row=>{const selection=selectionMap.get(row.id_selection);return[row.id_participation_acteur,selection?.athlete_label||row.id_acteur_coc||row.id_participation_acteur]}))
 return tables.UNITES_PARTICIPANTES.filter(row=>engagementIds.has(row.id_engagement_campagne)).map(row=>{
  const memberIds=tables.MEMBRES_UNITES_PARTICIPANTES.filter(member=>member.id_unite_participante===row.id_unite_participante).map(member=>clean(member.id_participation_acteur))
  const direct=row.id_participation_acteur?[clean(row.id_participation_acteur)]:[]
  return{id_unite_participante:clean(row.id_unite_participante),id_engagement_campagne:clean(row.id_engagement_campagne),type_unite:clean(row.type_unite) as "INDIVIDUEL"|"EQUIPE",id_participation_acteur:clean(row.id_participation_acteur),nom_unite:clean(row.nom_unite),observation:clean(row.observation),membres:memberIds,composition:[...direct,...memberIds].map(id=>participantMap.get(id)||id)}
 }).filter(row=>row.id_unite_participante)
}

export async function createParticipatingUnit(competitionId:string,input:Record<string,unknown>){const type=clean(input.type_unite).toUpperCase(),engagementId=clean(input.id_engagement_campagne),participantId=clean(input.id_participation_acteur),name=clean(input.nom_unite),memberIds=[...new Set((Array.isArray(input.membres)?input.membres:[]).map(clean).filter(Boolean))];if(!["INDIVIDUEL","EQUIPE"].includes(type))throw new Error("Type d’unité invalide.");const engagements=await getCampaignEngagements({competitionId}),engagement=engagements.find(x=>x.id_engagement_campagne===engagementId);if(!engagement)throw new Error("Engagement étranger à la compétition.");const participants=(await getAthleteParticipations({competitionId,engagementId})).filter(x=>x.id_statut_participation==="PARTICIPANT");if(type==="INDIVIDUEL"&&!participants.some(x=>x.id_participation_acteur===participantId))throw new Error("Une unité individuelle exige un participant effectif.");if(type==="EQUIPE"&&(!name||memberIds.length<2||memberIds.some(id=>!participants.some(x=>x.id_participation_acteur===id))))throw new Error("Une équipe exige un nom et au moins deux participants effectifs.");const existing=await getParticipatingUnits(),id=nextId(existing.map(x=>x.id_unite_participante),"UNI"),created={id_unite_participante:id,id_engagement_campagne:engagementId,type_unite:type as "INDIVIDUEL"|"EQUIPE",id_participation_acteur:type==="INDIVIDUEL"?participantId:"",nom_unite:type==="EQUIPE"?name:"",observation:clean(input.observation)};await appendSheetRow({sheetName:"UNITES_PARTICIPANTES",spreadsheetId:getCompetitionsSpreadsheetId(),row:created});if(type==="EQUIPE")await appendSheetRows({sheetName:"MEMBRES_UNITES_PARTICIPANTES",spreadsheetId:getCompetitionsSpreadsheetId(),rows:memberIds.map((pid,index)=>({id_membre_unite:`MUN${String(Date.now()+index).slice(-8)}`,id_unite_participante:id,id_participation_acteur:pid,role_membre:"MEMBRE",observation:""}))});return created}

export async function updateParticipatingUnit(competitionId:string,id:string,input:Record<string,unknown>){const current=(await getParticipatingUnits(competitionId)).find(x=>x.id_unite_participante===id);if(!current)throw new Error("Unité participante introuvable.");const participantId=clean(input.id_participation_acteur),name=clean(input.nom_unite),memberIds=[...new Set((Array.isArray(input.membres)?input.membres:[]).map(clean).filter(Boolean))];const participants=(await getAthleteParticipations({competitionId,engagementId:current.id_engagement_campagne})).filter(x=>x.id_statut_participation==="PARTICIPANT");if(current.type_unite==="INDIVIDUEL"&&!participants.some(x=>x.id_participation_acteur===participantId))throw new Error("Une unité individuelle exige un participant effectif.");if(current.type_unite==="EQUIPE"&&(!name||memberIds.length<2||memberIds.some(pid=>!participants.some(x=>x.id_participation_acteur===pid))))throw new Error("Une équipe exige un nom et au moins deux participants effectifs.");await updateSheetCells({sheetName:"UNITES_PARTICIPANTES",spreadsheetId:getCompetitionsSpreadsheetId(),idColumn:"id_unite_participante",idValue:id,updates:[{column:"id_participation_acteur",value:current.type_unite==="INDIVIDUEL"?participantId:""},{column:"nom_unite",value:current.type_unite==="EQUIPE"?name:""},{column:"observation",value:clean(input.observation)}]});if(current.type_unite==="EQUIPE"){const allMembers=await getSheetRows({sheetName:"MEMBRES_UNITES_PARTICIPANTES",spreadsheetId:getCompetitionsSpreadsheetId()});for(const member of allMembers.filter(x=>x.id_unite_participante===id))await deleteSheetRow({sheetName:"MEMBRES_UNITES_PARTICIPANTES",spreadsheetId:getCompetitionsSpreadsheetId(),idColumn:"id_membre_unite",idValue:member.id_membre_unite});for(const [index,pid] of memberIds.entries())await appendSheetRow({sheetName:"MEMBRES_UNITES_PARTICIPANTES",spreadsheetId:getCompetitionsSpreadsheetId(),row:{id_membre_unite:`MUN${String(Date.now()+index).slice(-8)}`,id_unite_participante:id,id_participation_acteur:pid,role_membre:"MEMBRE",observation:""}})}return{...current,id_participation_acteur:current.type_unite==="INDIVIDUEL"?participantId:"",nom_unite:current.type_unite==="EQUIPE"?name:"",observation:clean(input.observation),membres:current.type_unite==="EQUIPE"?memberIds:[]}}

export async function getCompetitionResults(competitionId?:string,includeHistory=true,options:{bypassCache?:boolean}={}):Promise<CompetitionResult[]>{
 const [rows,engagements]=await Promise.all([getSheetRows({sheetName:"RESULTATS",spreadsheetId:getCompetitionsSpreadsheetId(),bypassCache:options.bypassCache}),getCampaignEngagements(competitionId?{competitionId}:{})]),engagementMap=new Map(engagements.map((row)=>[row.id_engagement_campagne,row]))
 return rows.map((row)=>{const engagement=engagementMap.get(row.id_engagement_campagne);return{...Object.fromEntries(RESULT_HEADERS.map((header)=>[header,clean(row[header])])),nom_equipe_nationale:engagement?.nom_equipe_nationale,nom_campagne:engagement?.nom_campagne} as CompetitionResult}).filter((row)=>row.id_resultat&&engagementMap.has(row.id_engagement_campagne)&&(includeHistory||row.est_version_courante==="OUI")).sort((a,b)=>a.id_resultat_logique===b.id_resultat_logique?Number(b.numero_version)-Number(a.numero_version):b.date_resultat.localeCompare(a.date_resultat))
}

export async function getResultReferences(){const spreadsheetId=getReferentialSpreadsheetId(),refs=await getSheetsRows({sheetNames:["RESULTATS_SYNTHETIQUES","UNITES_MESURE","DECISIONS_RESULTATS","STATUTS_RESULTAT","TYPES_ADVERSAIRES"],spreadsheetId});return{federations:[],synthetics:refs.RESULTATS_SYNTHETIQUES.filter((row)=>row.id_resultat_synthetique).map((row)=>({id:row.id_resultat_synthetique,label:row.nom_resultat_synthetique||row.id_resultat_synthetique})),units:refs.UNITES_MESURE.filter((row)=>row.id_unite_mesure).map((row)=>({id:row.id_unite_mesure,label:row.nom_unite_mesure||row.id_unite_mesure,type:row.type_mesure})),decisions:refs.DECISIONS_RESULTATS.filter((row)=>row.id_decision_resultat).map((row)=>({id:row.id_decision_resultat,label:row.nom_decision||row.id_decision_resultat,federationId:row.id_federation,sportId:row.id_sport,disciplineId:row.id_discipline,active:clean(row.statut).toUpperCase()==="ACTIF"})),statuses:refs.STATUTS_RESULTAT.filter((row)=>row.id_statut_resultat).map((row)=>({id:row.id_statut_resultat,label:row.nom_statut_resultat||row.id_statut_resultat})),opponentTypes:refs.TYPES_ADVERSAIRES.filter((row)=>row.id_type_adversaire).map((row)=>({id:row.id_type_adversaire,label:row.nom_type_adversaire||row.id_type_adversaire}))}}

async function prepareResult(competitionId:string,input:Record<string,unknown>,engagementId?:string,historicalDecisionId?:string){const validated=validateCompetitionResultInput({...input,id_engagement_campagne:engagementId||input.id_engagement_campagne}),[engagements,refs,programs,competitionRefs]=await Promise.all([getCampaignEngagements({competitionId}),getResultReferences(),getCompetitionPrograms(competitionId),getCompetitionReferences()]),engagement=engagements.find((item)=>item.id_engagement_campagne===validated.id_engagement_campagne);if(!engagement)throw new Error("Engagement étranger à la compétition.");const program=programs.find((item)=>item.id_programme_competition===engagement.id_programme_competition);if(!program)throw new Error("Programme de l’engagement introuvable.");const event=competitionRefs.events?.find((item)=>item.id===program.id_epreuve),row=normalizeResultForType(validated,event?.resultTypeId||"")
 if(row.id_programme_competition&&row.id_programme_competition!==program.id_programme_competition)throw new Error("Le programme ne correspond pas à l’engagement sélectionné.")
 if(row.id_epreuve&&row.id_epreuve!==program.id_epreuve)throw new Error("L’épreuve ne correspond pas au programme sélectionné.")
 if(row.id_discipline&&row.id_discipline!==(event?.disciplineId||""))throw new Error("La discipline ne correspond pas au programme sélectionné.")
 if(event?.resultTypeId==="TR_DECISION"&&(!row.id_resultat_synthetique||!row.id_decision_resultat))throw new Error("Le résultat synthétique et la décision sont obligatoires pour cette épreuve.");if(!refs.statuses.some((item)=>item.id===row.id_statut_resultat))throw new Error("Statut de résultat absent du référentiel.");if(row.id_resultat_synthetique&&!refs.synthetics.some((item)=>item.id===row.id_resultat_synthetique))throw new Error("Résultat synthétique inconnu.");if((row.valeur_coc||row.valeur_adversaire)&&!row.id_unite_mesure&&event?.resultTypeId!=="TR_RANG")throw new Error("L’unité de mesure est obligatoire pour ce type de valeur.");if(row.id_unite_mesure&&!refs.units.some((item)=>item.id===row.id_unite_mesure))throw new Error("Unité de mesure inconnue.");if(row.id_decision_resultat&&!refs.decisions.some((item)=>item.id===row.id_decision_resultat&&(item.active||item.id===historicalDecisionId)&&(!item.federationId||item.federationId===engagement.id_federation_responsable)&&(!item.sportId||item.sportId===event?.sportId)&&(!item.disciplineId||item.disciplineId===event?.disciplineId)))throw new Error("Décision incompatible avec le contexte sportif.")
 const resultUnits=await getParticipatingUnits(competitionId);if(!resultUnits.some((unit)=>unit.id_unite_participante===row.id_unite_participante&&unit.id_engagement_campagne===engagement.id_engagement_campagne))throw new Error("L’unité participante n’appartient pas à cet engagement.");if(row.date_resultat<engagement.date_engagement)throw new Error("La date du résultat est antérieure à la date d’engagement.");return{row,program,engagement}}

export async function createCompetitionResult(competitionId:string,input:Record<string,unknown>){const{row,program}=await prepareResult(competitionId,input),existing=await getCompetitionResults();const created={...row,id_resultat:nextId(existing.map((item)=>item.id_resultat),"RES"),id_resultat_logique:nextId(existing.map((item)=>item.id_resultat_logique),"RSL"),numero_version:"1",id_resultat_precedent:"",est_version_courante:"OUI",id_programme_competition:program.id_programme_competition,motif_correction:""};await appendSheetRow({sheetName:"RESULTATS",spreadsheetId:getCompetitionsSpreadsheetId(),row:created});return created}

export async function correctCompetitionResult(competitionId:string,id:string,input:Record<string,unknown>){const current=(await getCompetitionResults(competitionId)).find((item)=>item.id_resultat===id&&item.est_version_courante==="OUI");if(!current)throw new Error("Version courante du résultat introuvable.");const{row}=await prepareResult(competitionId,input,current.id_engagement_campagne,current.id_decision_resultat);if(!row.motif_correction)throw new Error("Le motif de correction est obligatoire.");const all=await getCompetitionResults(),created={...current,...row,id_resultat:nextId(all.map((item)=>item.id_resultat),"RES"),numero_version:String(Number(current.numero_version)+1),id_resultat_precedent:current.id_resultat,est_version_courante:"OUI"};await appendSheetRow({sheetName:"RESULTATS",spreadsheetId:getCompetitionsSpreadsheetId(),row:created});await updateSheetCells({sheetName:"RESULTATS",spreadsheetId:getCompetitionsSpreadsheetId(),idColumn:"id_resultat",idValue:current.id_resultat,updates:[{column:"est_version_courante",value:"NON"},{column:"id_statut_resultat",value:"CORRIGE"}]});return created}

export async function getMedalReferences(){
 const rows=await getSheetRows({sheetName:"DISTINCTIONS_SPORTIVES",spreadsheetId:getReferentialSpreadsheetId()})
 return rows.filter(row=>MEDAL_DISTINCTIONS.includes(clean(row.id_distinction) as (typeof MEDAL_DISTINCTIONS)[number])).map(row=>({id:clean(row.id_distinction),label:clean(row.nom_distinction)||clean(row.id_distinction)}))
}

export async function getCompetitionMedals(competitionId?:string):Promise<CompetitionMedal[]>{
 const [rows,results,units,programs,references]=await Promise.all([getSheetRows({sheetName:"MEDAILLES",spreadsheetId:getCompetitionsSpreadsheetId()}),getCompetitionResults(competitionId,false),getParticipatingUnits(competitionId),getCompetitionPrograms(competitionId),getCompetitionReferences()])
 const resultMap=new Map(results.map(row=>[row.id_resultat_logique,row])),unitMap=new Map(units.map(row=>[row.id_unite_participante,row])),programMap=new Map(programs.map(row=>[row.id_programme_competition,row]))
 return rows.filter(row=>resultMap.has(clean(row.id_resultat_logique))).map(row=>{const result=resultMap.get(clean(row.id_resultat_logique))!,unit=unitMap.get(result.id_unite_participante),program=programMap.get(result.id_programme_competition),event=references.events?.find(item=>item.id===program?.id_epreuve);return{id_medaille:clean(row.id_medaille),id_resultat_logique:clean(row.id_resultat_logique),id_distinction:clean(row.id_distinction) as CompetitionMedal["id_distinction"],date_obtention:clean(row.date_obtention),observation:clean(row.observation),id_unite_participante:result.id_unite_participante,unit_label:participatingUnitMedalLabel(unit,result.id_unite_participante),event_label:event?.label||program?.id_epreuve||"Épreuve non renseignée"}}).filter(row=>row.id_medaille).sort((a,b)=>b.date_obtention.localeCompare(a.date_obtention))
}

export async function getCompetitionMedalCounts(){
 const rows=await getSheetRows({sheetName:"MEDAILLES",spreadsheetId:getCompetitionsSpreadsheetId()})
 const valid=rows.filter(row=>clean(row.id_medaille)&&MEDAL_DISTINCTIONS.includes(clean(row.id_distinction) as (typeof MEDAL_DISTINCTIONS)[number]))
 return{total:valid.length,or:valid.filter(row=>clean(row.id_distinction)==="DIST_OR").length,argent:valid.filter(row=>clean(row.id_distinction)==="DIST_ARGENT").length,bronze:valid.filter(row=>clean(row.id_distinction)==="DIST_BRONZE").length}
}

async function getMedalMutationContext(competitionId:string){
 const spreadsheetId=getCompetitionsSpreadsheetId()
 const [tables,references]=await Promise.all([
  getSheetsRows({sheetNames:["MEDAILLES","RESULTATS",TEAMS_SHEET,PROGRAMS_SHEET],spreadsheetId}),
  getMedalReferences(),
 ])
 const programIds=new Set(tables[PROGRAMS_SHEET].filter(row=>row.id_competition===competitionId).map(row=>row.id_programme_competition))
 const engagementIds=new Set(tables[TEAMS_SHEET].filter(row=>programIds.has(row.id_programme_competition)).map(row=>row.id_engagement_campagne))
 const results=tables.RESULTATS.filter(row=>row.est_version_courante==="OUI"&&engagementIds.has(row.id_engagement_campagne))
 return{medals:tables.MEDAILLES,results,references}
}

function prepareMedal(input:Record<string,unknown>,context:Awaited<ReturnType<typeof getMedalMutationContext>>){
 const row=validateCompetitionMedalInput(input)
 const result=context.results.find(item=>item.id_resultat_logique===row.id_resultat_logique)
 if(!result)throw new Error("Le résultat logique n’existe pas dans cette compétition.")
 if(!context.references.some(item=>item.id===row.id_distinction))throw new Error("La distinction sportive est absente du référentiel.")
 return{row,result}
}

export async function createCompetitionMedal(competitionId:string,input:Record<string,unknown>){
 const context=await getMedalMutationContext(competitionId),{row}=prepareMedal(input,context),existing=context.medals
 if(existing.some(item=>item.id_resultat_logique===row.id_resultat_logique))throw new Error("Cette unité possède déjà une médaille pour ce résultat.")
 const created={id_medaille:nextId(existing.map(item=>item.id_medaille),"MED"),...row}
 await appendSheetRow({sheetName:"MEDAILLES",spreadsheetId:getCompetitionsSpreadsheetId(),row:created});return created
}

export async function updateCompetitionMedal(competitionId:string,id:string,input:Record<string,unknown>){
 const context=await getMedalMutationContext(competitionId),resultIds=new Set(context.results.map(item=>item.id_resultat_logique)),current=context.medals.find(item=>item.id_medaille===id&&resultIds.has(item.id_resultat_logique));if(!current)throw new Error("Médaille introuvable.")
 const{row}=prepareMedal(input,context),existing=context.medals
 if(existing.some(item=>item.id_medaille!==id&&item.id_resultat_logique===row.id_resultat_logique))throw new Error("Cette unité possède déjà une médaille pour ce résultat.")
 await updateSheetCells({sheetName:"MEDAILLES",spreadsheetId:getCompetitionsSpreadsheetId(),idColumn:"id_medaille",idValue:id,updates:[{column:"id_resultat_logique",value:row.id_resultat_logique},{column:"id_distinction",value:row.id_distinction},{column:"date_obtention",value:row.date_obtention},{column:"observation",value:row.observation}]});return{...current,...row,id_medaille:id}
}

export async function deleteCompetitionMedal(competitionId:string,id:string){
 const context=await getMedalMutationContext(competitionId),resultIds=new Set(context.results.map(item=>item.id_resultat_logique)),current=context.medals.find(item=>item.id_medaille===id&&resultIds.has(item.id_resultat_logique));if(!current)throw new Error("Médaille introuvable.")
 // Aucun processus dépendant ne référence id_medaille dans le modèle actuel.
 await deleteSheetRow({sheetName:"MEDAILLES",spreadsheetId:getCompetitionsSpreadsheetId(),idColumn:"id_medaille",idValue:id});return current
}


export async function createTeamParticipation(competitionId: string, input: Record<string, unknown>) {
  void competitionId
  void input
  throw new Error("Le rattachement direct d’une équipe est supprimé. Utilisez un engagement campagne-programme.")
  /* compatibilité supprimée après migration T03
  if (!(await getCompetition(competitionId))) throw new Error("Compétition introuvable.")
  const row = validateTeamParticipationInput(input)
  const references = await getCompetitionReferences()
  if (!references.teamsAvailable) throw new Error("Le catalogue des équipes nationales n’est pas encore configuré.")
  if (!references.teams.some((team) => team.id === row.id_equipe_nationale)) throw new Error("Équipe nationale inconnue ou identifiant ambigu.")
  const existing = await getTeamParticipations()
  if (existing.some((item) => item.id_competition === competitionId && item.id_equipe_nationale === row.id_equipe_nationale)) throw new Error("Cette équipe nationale est déjà rattachée à la compétition.")
  const created = { id_participation_equipe: nextId(existing.map((item) => item.id_participation_equipe), "PEN"), id_competition: competitionId, ...row }
  await appendSheetRow({ sheetName: TEAMS_SHEET, spreadsheetId: getCompetitionsSpreadsheetId(), row: { ...created, observation: created.observations } })
  return created */
}

export async function updateTeamParticipation(competitionId: string, id: string, input: Record<string, unknown>) {
  void competitionId
  void id
  void input
  throw new Error("Le rattachement direct d’une équipe est supprimé. Modifiez l’engagement campagne-programme.")
  /* compatibilité supprimée après migration T03
  const current = (await getTeamParticipations(competitionId)).find((item) => item.id_participation_equipe === id)
  if (!current) throw new Error("Participation d’équipe introuvable.")
  const row = validateTeamParticipationInput({ ...input, id_equipe_nationale: current.id_equipe_nationale })
  const updates = ["statut_participation", "date_engagement"].map((column) => ({ column, value: row[column as keyof typeof row] })).concat([{ column: "observation", value: row.observations }])
  await updateSheetCells({ sheetName: TEAMS_SHEET, spreadsheetId: getCompetitionsSpreadsheetId(), idColumn: "id_participation_equipe", idValue: id, updates })
  return { ...current, ...row, id_equipe_nationale: current.id_equipe_nationale } */
}
