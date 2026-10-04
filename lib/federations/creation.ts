import "server-only"
import { getSheetsRows } from "@/lib/cnac/sheets"
import { getReferentialSpreadsheetId } from "./config"
import { FederationCreationError, nextSequentialId, normalizeFederationCreation, validateFederationCreation } from "./creation-model"
import type { SaveRow } from "../cnac/confirmed-save"
import { reserveCnacIdentifier } from "../cnac/identifiers"

export async function getFederationCreationReferences() {
  const rows = await getSheetsRows({ sheetNames: ["CATEGORIES_ENTITES", "SPORTS", "ENTITES"], spreadsheetId: getReferentialSpreadsheetId(), cacheTtlMs: 5000 })
  return { categories: rows.CATEGORIES_ENTITES.filter((r) => r.id_categorie_entite).map((r) => ({ id: r.id_categorie_entite, label: r.nom_categorie_entite })), sports: rows.SPORTS.filter((r) => r.id_sport).map((r) => ({ id: r.id_sport, label: r.nom_sport })), entities: rows.ENTITES.filter((r) => r.id_entite).map((r) => ({ id: r.id_entite, categoryId: r.id_categorie_entite, name: r.nom_officiel, acronym: r.sigle })) }
}

export async function buildFederationCreationRows(input: Record<string, unknown>): Promise<SaveRow[]> {
    const spreadsheetId = getReferentialSpreadsheetId(), row = normalizeFederationCreation(input)
    validateFederationCreation(row)
    const data = await getSheetsRows({ sheetNames: ["ENTITES", "FEDERATIONS", "CATEGORIES_ENTITES", "SPORTS"], spreadsheetId, cacheTtlMs: 0 })
    if (!data.CATEGORIES_ENTITES.some((item) => item.id_categorie_entite === row.id_categorie_entite)) throw new FederationCreationError("La catégorie sélectionnée n’existe pas.", "id_categorie_entite")
    if (!data.SPORTS.some((item) => item.id_sport === row.id_sport)) throw new FederationCreationError("Le sport sélectionné n’existe pas.", "id_sport")
    const entityIds = new Set(data.ENTITES.map((item) => item.id_entite))
    if (row.id_entite_continentale && !entityIds.has(row.id_entite_continentale)) throw new FederationCreationError("La fédération continentale n’existe pas.", "id_entite_continentale")
    if (row.id_entite_internationale && !entityIds.has(row.id_entite_internationale)) throw new FederationCreationError("La fédération internationale n’existe pas.", "id_entite_internationale")
    const normalizedName = row.nom_officiel.toLocaleUpperCase("fr"), normalizedAcronym = row.sigle.toLocaleUpperCase("fr")
    if (data.ENTITES.some((item) => item.nom_officiel.trim().toLocaleUpperCase("fr") === normalizedName)) throw new FederationCreationError("Une fédération portant ce nom officiel existe déjà.", "nom_officiel")
    if (normalizedAcronym && data.ENTITES.some((item) => item.sigle.trim().toLocaleUpperCase("fr") === normalizedAcronym)) throw new FederationCreationError("Une fédération portant ce sigle existe déjà.", "sigle")
    const idEntity = reserveCnacIdentifier("ENTITES", data.ENTITES.map(row => row.id_entite), ids => nextSequentialId(ids.map(id => ({ id_entite: id })), "id_entite", "RDCENT"))
    const idFederation = reserveCnacIdentifier("FEDERATIONS", data.FEDERATIONS.map(row => row.id_federation), ids => nextSequentialId(ids.map(id => ({ id_federation: id })), "id_federation", "FED"))
    return [
      { sheet: "ENTITES" as const, id: idEntity, mode: "create" as const, values: { id_entite: idEntity, id_categorie_entite: row.id_categorie_entite, nom_officiel: row.nom_officiel, sigle: row.sigle, adresse_siege: row.adresse_siege, telephone: row.telephone, email: row.email, site_web: row.site_web, statut: row.statut, observations: row.observations } },
      { sheet: "FEDERATIONS" as const, id: idFederation, mode: "create" as const, values: { id_federation: idFederation, id_entite: idEntity, id_sport: row.id_sport, statut_reconnaissance_ministere: row.statut_reconnaissance_ministere, date_reconnaissance_nationale: row.date_reconnaissance_nationale, statut_affiliation_coc: row.statut_affiliation_coc, date_affiliation_coc: row.date_affiliation_coc, id_entite_continentale: row.id_entite_continentale, date_affiliation_continentale: row.date_affiliation_continentale, id_entite_internationale: row.id_entite_internationale, date_affiliation_internationale: row.date_affiliation_internationale, statut: row.statut, observations: row.observations } },
    ]
}
