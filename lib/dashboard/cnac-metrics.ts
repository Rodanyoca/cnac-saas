export type MetricRow = Record<string, string>
export type MetricTables = Record<string, MetricRow[]>
export const actorMetrics = [
  { sheet: "ATHLETES", id: "id_athlete_cnac", label: "Athlètes" },
  { sheet: "COACHS", id: "id_coach_cnac", label: "Entraîneurs" },
  { sheet: "ARBITRES", id: "id_arbitre_cnac", label: "Arbitres" },
  { sheet: "OFFICIELS", id: "id_officiel_cnac", label: "Officiels" },
  { sheet: "MEDECINS", id: "id_medecin_cnac", label: "Médecins" },
  { sheet: "AUTRES", id: "id_autre_acteur_cnac", label: "Autres acteurs" },
] as const
export const territorialMetrics = [
  { sheet: "ZONES", id: "id_zone_cnac", label: "Zones", name: "nom_zone" },
  { sheet: "LIGUES", id: "id_ligue_cnac", label: "Ligues", name: "nom_ligue" },
  { sheet: "ENTENTES", id: "id_entente_cnac", label: "Ententes", name: "nom_entente" },
  { sheet: "CERCLES", id: "id_cercle_cnac", label: "Cercles", name: "nom_cercle" },
  { sheet: "CLUBS", id: "id_club_cnac", label: "Clubs", name: "nom_club" },
  { sheet: "EQUIPES", id: "id_equipe_cnac", label: "Équipes", name: "nom_equipe" },
] as const
const normalize = (value = "") => value.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
const filled = (row: MetricRow, keys: string[]) => keys.every(key => Boolean(row[key]?.trim()))
export const metricPercent = (value: number, total: number) => total ? Math.round(value * 100 / total) : 0
export function metricRecords(rows: MetricRow[], id: string) {
  return [...new Map(rows.filter(row => row[id]?.trim()).map(row => [row[id].trim(), row])).values()]
}
function statusCounts(rows: MetricRow[]) {
  const active = rows.filter(row => normalize(row.statut) === "actif").length
  const inactive = rows.filter(row => normalize(row.statut) === "inactif").length
  return { total: rows.length, active, inactive, unknown: rows.length - active - inactive }
}
export function aggregateCnacMetrics(sources: { referential?: MetricTables; territorial?: MetricTables; actors?: MetricTables; affiliations?: MetricTables }) {
  const sexLabels = sources.referential ? new Map(sources.referential.SEXES.map(row => [row.id_sexe, normalize(row.nom_sexe)])) : undefined
  const actorRows = sources.actors ? actorMetrics.map(definition => {
    const rows = metricRecords(sources.actors![definition.sheet], definition.id)
    const gender = (row: MetricRow) => sexLabels?.get(row.id_sexe) || ""
    const men = sexLabels ? rows.filter(row => ["m", "h", "homme", "masculin"].includes(gender(row))).length : undefined
    const women = sexLabels ? rows.filter(row => ["f", "femme", "feminin"].includes(gender(row))).length : undefined
    const complete = rows.filter(row => filled(row, ["nom_complet", "id_sexe", "date_de_naissance", "telephone", "email", "statut"])).length
    return { label: definition.label, ...statusCounts(rows), men, women, genderUnknown: men === undefined || women === undefined ? undefined : rows.length - men - women, complete }
  }) : undefined
  const territorialRows = sources.territorial ? territorialMetrics.map(definition => {
    const rows = metricRecords(sources.territorial![definition.sheet], definition.id)
    return { label: definition.label, ...statusCounts(rows), complete: rows.filter(row => filled(row, [definition.name, "statut"])).length }
  }) : undefined
  const federations = sources.referential ? metricRecords(sources.referential.FEDERATIONS, "id_federation") : undefined
  const federationRows = federations ? [
    ["Statut technique", "statut"], ["Reconnaissance ministérielle", "statut_reconnaissance_ministere"], ["Affiliation COC", "statut_affiliation_coc"],
  ].flatMap(([label, field]) => {
    const counts = new Map<string, number>()
    federations.forEach(row => { const status = normalize(row[field]).replaceAll("_", " ") || "Non renseigné"; counts.set(status, (counts.get(status) || 0) + 1) })
    return [...counts].map(([status, total]) => ({ label, status, total, share: `${metricPercent(total, federations.length)} %` }))
  }) : undefined
  const affiliations = sources.affiliations ? metricRecords(sources.affiliations.AFFILIATIONS_COACHS, "id_affiliation_coach") : undefined
  const affiliationStats = affiliations ? statusCounts(affiliations) : undefined
  const totalActors = actorRows?.reduce((sum, row) => sum + row.total, 0)
  const completeActors = actorRows?.reduce((sum, row) => sum + row.complete, 0)
  const totalStructures = territorialRows?.reduce((sum, row) => sum + row.total, 0)
  const qualityRows = [
    ...(territorialRows ? [{ label: "Structures territoriales", total: totalStructures!, complete: territorialRows.reduce((sum, row) => sum + row.complete, 0) }] : []),
    ...(actorRows ? [{ label: "Acteurs", total: totalActors!, complete: completeActors! }] : []),
    ...(affiliations ? [{ label: "Affiliations entraîneur–club", total: affiliations.length, complete: affiliations.filter(row => filled(row, ["id_coach_cnac", "id_club_cnac", "statut"])).length }] : []),
  ].map(row => ({ ...row, incomplete: row.total - row.complete, rate: `${metricPercent(row.complete, row.total)} %` }))
  const alertRows = [
    ...(sources.actors ? [{ label: "Athlètes sans club", count: metricRecords(sources.actors.ATHLETES, "id_athlete_cnac").filter(row => !row.id_club_cnac?.trim()).length }] : []),
    ...(sources.territorial ? [{ label: "Structures sans statut", count: territorialMetrics.reduce((sum, def) => sum + metricRecords(sources.territorial![def.sheet], def.id).filter(row => !row.statut?.trim()).length, 0) }] : []),
  ]
  return { totalFederations: federations?.length, federationRows, totalActors, completeActors, actorCompletionRate: totalActors === undefined ? undefined : metricPercent(completeActors!, totalActors), actorRows, totalStructures, territorialRows: territorialRows?.map(row => ({ ...row, share: `${metricPercent(row.total, totalStructures!)} %` })), affiliationStats, qualityRows, alertRows }
}
export type CnacDashboardMetrics = ReturnType<typeof aggregateCnacMetrics>
