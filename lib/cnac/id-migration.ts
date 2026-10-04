import { CNAC_KEYS, type CnacSheet } from "./schema.ts"
import { CNAC_ID_PREFIXES, nextCompactCnacId } from "./identifiers.ts"
import { assertHeaders, CnacDataError } from "./model.ts"

export type IdMigrationCell = { sheet: string; row: number; column: number; before: string; after: string }
export type IdMigrationPlan = { mappings: { sheet: string; before: string; after: string }[]; cells: IdMigrationCell[] }
export function planCnacIdMigration(tables: Record<string, unknown[][]>): IdMigrationPlan {
  const reserved = new Set<string>()
  const identities: { sheet: keyof typeof CNAC_ID_PREFIXES; id: string }[] = []
  for (const sheet of Object.keys(CNAC_ID_PREFIXES)) {
    const matrix = tables[sheet]
    if (!matrix) continue
    const headers = (matrix[0] || []).map(String)
    assertHeaders(sheet as CnacSheet, headers)
    const index = headers.indexOf(CNAC_KEYS[sheet as CnacSheet])
    for (const row of matrix.slice(1)) {
      const id = String(row[index] || "")
      if (!id) continue
      if (id.startsWith("=") || id.trim() !== id || reserved.has(id)) throw new CnacDataError("MIGRATION_ID", `Identifiant ambigu ou calculé dans ${sheet} : migration refusée.`)
      reserved.add(id)
      identities.push({ sheet: sheet as keyof typeof CNAC_ID_PREFIXES, id })
    }
  }
  const mappings: IdMigrationPlan["mappings"] = []
  for (const { sheet, id } of identities) {
    if (id.length < 25) continue
    const after = nextCompactCnacId(CNAC_ID_PREFIXES[sheet], reserved)
    reserved.add(after)
    mappings.push({ sheet, before: id, after })
  }
  const replacements = new Map(mappings.map(item => [item.before, item.after]))
  const idColumns = new Set([
    ...Object.keys(CNAC_ID_PREFIXES).map(sheet => CNAC_KEYS[sheet as CnacSheet]),
    "id_structure_parent_cnac", "id_structure_parent_coc", "id_acteur_cnac", "id_acteur_coc",
    ...["zone", "ligue", "entente", "cercle", "club", "equipe", "athlete", "coach", "arbitre", "officiel", "medecin", "autre_acteur"].map(type => `id_${type}_coc`),
  ])
  const cells: IdMigrationCell[] = []
  for (const [sheet, matrix] of Object.entries(tables)) {
    const headers = (matrix[0] || []).map(String)
    matrix.slice(1).forEach((row, offset) => row.forEach((value, column) => {
      const before = String(value ?? "")
      if (before.startsWith("=") && mappings.some(item => before.includes(item.before))) throw new CnacDataError("MIGRATION_FORMULA", `Une formule de ${sheet} contient un ancien identifiant : migration refusée.`)
      const after = replacements.get(before)
      if (!after) return
      if (!idColumns.has(headers[column])) {
        if (headers[column]?.startsWith("id_")) throw new CnacDataError("MIGRATION_REFERENCE", `Référence non prise en charge dans ${sheet}.${headers[column]}.`)
        return
      }
      cells.push({ sheet, row: offset + 2, column, before, after })
    }))
  }
  return { mappings, cells }
}
