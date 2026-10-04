import type { FederationData } from "./types"
import { TERRITORIAL_RESOURCE_BINDINGS, type TerritorialResourceKey } from "../cnac/territorial-resources.ts"
import { territorialEditorRow } from "../cnac/territorial-model.ts"

export type FederationStructureItem = { id: string; typeId: string; resource: TerritorialResourceKey; federalId: string; name: string; alias: string; parentId: string; parentLabel: string; secondary: string; phone: string; email: string; status: string; childrenCount: number; record: Record<string, string> }
export type FederationStructureSection = {
  key: string
  typeId: string
  label: string
  configured: boolean
  supported: boolean
  routeResource?: string
  items: FederationStructureItem[]
}
export type FederationStructure = { hierarchy: string[]; sections: FederationStructureSection[] }

const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr")
const pluralize = (value: string) => {
  const name = value.trim().toLocaleLowerCase("fr")
  const normalized = normalize(name)
  const plural = /[sxz]$/.test(normalized) ? name : `${name}s`
  return plural.replace(/^\p{L}/u, (letter) => letter.toLocaleUpperCase("fr"))
}
const value = (row: Record<string, unknown>, key: string) => String(row[key] ?? "").trim()

export function buildFederationStructure(data: FederationData, federationId: string): FederationStructure {
  const hierarchyRows = data.hierarchie.filter((row) => row.id_federation === federationId).sort((a, b) => Number(a.niveau) - Number(b.niveau))
  const records = Object.fromEntries(TERRITORIAL_RESOURCE_BINDINGS.map((binding) => [binding.dataKey, (data as unknown as Record<string, unknown[]>)[binding.dataKey] || []]))
  const sections = hierarchyRows
    .filter((row) => !normalize(row.nom_structure).includes("federation"))
    .map((level): FederationStructureSection => {
      const binding = TERRITORIAL_RESOURCE_BINDINGS.find((item) => item.typeId === level.id_type_structure)
      const rows = binding ? records[binding.dataKey] as Record<string, unknown>[] : []
      const items = binding ? rows.filter((row) => value(row, "id_federation") === federationId).map((row) => {
        const record = territorialEditorRow(binding.key, Object.fromEntries(Object.entries(row).map(([key, item]) => [key, String(item ?? "")])))
        const parentId = value(row, binding.parentRowColumn) || value(row, binding.parentFallbackColumn)
        return {
          id: value(row, binding.rowIdColumn), typeId: binding.typeId, resource: binding.key,
          federalId: value(row, binding.federalIdColumn), name: value(row, binding.nameColumn), alias: value(row, binding.aliasColumn),
          parentId, parentLabel: "", secondary: binding.key === "equipes" ? `Catégorie équipe : ${value(row, "nom_categorie_age") || "Non renseignée"}` : value(row, "relationIssue") || value(row, "parentLabel"),
          phone: value(row, binding.phoneColumn), email: value(row, binding.emailColumn), status: value(row, binding.statusColumn), childrenCount: 0, record,
        }
      }) : []
      return { key: binding?.key || level.id_type_structure, typeId: level.id_type_structure, label: pluralize(level.nom_structure), configured: true, supported: Boolean(binding), routeResource: binding?.key, items }
    })
  const allItems = sections.flatMap((section) => section.items)
  const itemsById = new Map(allItems.map((item) => [item.id, item]))
  for (const section of sections) {
    for (const item of section.items) {
      const parent = item.parentId ? itemsById.get(item.parentId) : undefined
      if (parent) item.parentLabel = parent.alias || parent.name
      if (!item.secondary) item.secondary = item.parentLabel
      item.childrenCount = allItems.filter((candidate) => candidate.parentId === item.id).length
    }
    section.items.sort((a, b) => a.name.localeCompare(b.name, "fr"))
  }
  const configuredHierarchy = hierarchyRows.map((row) => row.nom_structure).filter((name) => !normalize(name).includes("federation"))
  const hierarchy = ["Fédération", ...configuredHierarchy]
  return { hierarchy, sections }
}
