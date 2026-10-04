import "server-only"

import { loadFederationData } from "./data"
import { buildFederationStructure } from "./structure-model"

export async function loadFederationStructure(federationId: string) {
  return buildFederationStructure(await loadFederationData({ connected: true }), federationId)
}
