import "server-only"
import { getSheetsTables } from "@/lib/cnac/sheets"
import { getReferentialSpreadsheetId, getTerritorialSpreadsheetId } from "@/lib/federations/config"
import { getActeursSpreadsheetId, getActeursAffiliationsSpreadsheetId } from "@/lib/acteurs/config"
import { actorMetrics, territorialMetrics, aggregateCnacMetrics, type MetricTables } from "./cnac-metrics"

export async function loadCnacDashboard() {
  const definitions = [
    { key: "referential", label: "Fédérations et référentiel des sexes", id: getReferentialSpreadsheetId, names: ["FEDERATIONS", "SEXES"] },
    { key: "territorial", label: "Structures territoriales", id: getTerritorialSpreadsheetId, names: territorialMetrics.map(item => item.sheet) },
    { key: "actors", label: "Acteurs", id: getActeursSpreadsheetId, names: actorMetrics.map(item => item.sheet) },
    { key: "affiliations", label: "Affiliations entraîneur–club", id: getActeursAffiliationsSpreadsheetId, names: ["AFFILIATIONS_COACHS"] },
  ] as const
  const results = await Promise.allSettled(definitions.map(async source => {
    const tables = await getSheetsTables({ spreadsheetId: source.id(), sheetNames: [...source.names], cacheTtlMs: 60000 })
    return Object.fromEntries(Object.entries(tables).map(([name, table]) => [name, table.rows]))
  }))
  const sources: Partial<Record<typeof definitions[number]["key"], MetricTables>> = {}
  const unavailable: string[] = []
  results.forEach((result, index) => {
    if (result.status === "fulfilled") sources[definitions[index].key] = result.value
    else unavailable.push(definitions[index].label)
  })
  return { metrics: aggregateCnacMetrics(sources), unavailable }
}
