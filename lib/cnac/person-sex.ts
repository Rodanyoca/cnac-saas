import { sexCode } from "./display.ts"

// Conserver l'identifiant réel du référentiel, même si Sheets l'a stocké en nombre.
export function personSexOptions(rows: Record<string, string>[]) {
  return rows.filter(row => {
    if (!row.id_sexe?.trim()) return false
    const label = sexCode((row.nom_sexe || "").trim())
    if (label === "H" || label === "F") return true
    if (["01", "02"].includes(row.id_sexe.trim())) return true
    if (row.nom_sexe?.trim()) return false
    return ["01", "02", "1", "2"].includes(row.id_sexe.trim())
  }).map(row => ({ id: row.id_sexe, label: row.nom_sexe || row.id_sexe }))
}
