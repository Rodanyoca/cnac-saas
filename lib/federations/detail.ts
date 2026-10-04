import { getSheetsRows } from "@/lib/cnac/sheets"
import { getReferentialSpreadsheetId } from "./config"
import type { FederationLinkedEntity } from "./detail-mappers"
import { mapEntiteRow, mapFederationRow, mapSportRow } from "./mappers"
import type { Federation } from "./types"

export type FederationDetailData = {
  federation: Federation
  national?: FederationLinkedEntity
  continental?: FederationLinkedEntity
  international?: FederationLinkedEntity
  contactsAvailable: boolean
}

export async function loadFederationDetail(id: string): Promise<FederationDetailData | undefined> {
  const referential = await getSheetsRows({
      sheetNames: ["FEDERATIONS", "ENTITES", "SPORTS", "CATEGORIES_ENTITES"],
      spreadsheetId: getReferentialSpreadsheetId(),
      cacheTtlMs: 5000,
    })
  const source = referential.FEDERATIONS.map(mapFederationRow).find((item) => item.id_federation === id)
  if (!source) return undefined

  const entities = new Map(referential.ENTITES.map(mapEntiteRow).map((entity) => [entity.id_entite, entity]))
  const sports = new Map(referential.SPORTS.map(mapSportRow).map((sport) => [sport.id_sport, sport.nom_sport]))
  const categories = new Map(referential.CATEGORIES_ENTITES.map((row) => [row.id_categorie_entite, row.nom_categorie_entite]))
  const nationalEntity = entities.get(source.id_entite)
  const linkedEntity = (entityId: string): FederationLinkedEntity | undefined => {
    const entity = entities.get(entityId)
    return entity ? { ...entity, contacts: [] } : undefined
  }
  return {
    federation: {
      ...source,
      nom_federation: nationalEntity?.nom_entite || "",
      sigle_federation: nationalEntity?.sigle_entite || "",
      nom_sport: sports.get(source.id_sport) || "",
      categorie_entite: categories.get(nationalEntity?.id_categorie_entite || "") || "",
      adresse_siege: nationalEntity?.adresse_siege || "",
      telephone: nationalEntity?.telephone || "",
      email: nationalEntity?.email || "",
      site_web: nationalEntity?.site_web || "",
      observations: source.observations || nationalEntity?.observations || "",
    },
    national: linkedEntity(source.id_entite),
    continental: linkedEntity(source.id_entite_continentale),
    international: linkedEntity(source.id_entite_internationale),
    contactsAvailable: true,
  }
}
