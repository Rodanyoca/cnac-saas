import "server-only"

import { getSheetsRows } from "@/lib/google/sheets"
import { getReferentialSpreadsheetId } from "./config"

export type FederationOption = {
  id: string
  idEntite: string
  sigle: string
  nom: string
  idSport: string
}

export async function getFederationOptions(options: { fresh?: boolean } = {}): Promise<FederationOption[]> {
  const rows = await getSheetsRows({
    sheetNames: ["FEDERATIONS", "ENTITES"],
    spreadsheetId: getReferentialSpreadsheetId(),
    cacheTtlMs: 5000,
    bypassCache: options.fresh,
  })
  const entities = new Map(rows.ENTITES.map((row) => [row.id_entite, row]))
  return rows.FEDERATIONS
    .filter((row) => row.id_federation && row.id_entite && entities.has(row.id_entite))
    .map((row) => {
      const entity = entities.get(row.id_entite)
      return {
        id: row.id_federation,
        idEntite: row.id_entite || "",
        sigle: entity?.sigle || entity?.sigle_entite || "",
        nom: entity?.nom_officiel || entity?.nom_entite || row.id_federation,
        idSport: row.id_sport || "",
      }
    })
    .sort((a, b) => a.nom.localeCompare(b.nom, "fr"))
}
