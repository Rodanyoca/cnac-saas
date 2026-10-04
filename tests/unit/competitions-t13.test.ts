import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"
import { classifyDataError, competitionQuality, nationalTeamQuality, qualifiedValue } from "../../lib/competitions/quality.ts"
import type { Competition } from "../../lib/competitions/types.ts"

const source = (path: string) => readFile(new URL(`../../${path}`, import.meta.url), "utf8")
const competition: Competition = { id_competition: "COM-1", nom_competition: "Jeux", id_type_competition: "TYPE", niveau_competition: "INT", edition: "2026", est_multisport: "OUI", date_debut: "2026-09-01", date_fin: "2026-09-15", pays: "", ville: "", lieu: "", statut: "PLANIFIEE", statut_normalise: "PLANIFIEE", observations: "" }
const team = { id_equipe_nationale: "EQ-1", id_federation: "FED-1", id_sport: "SP-1", id_discipline: "", nom_equipe_nationale: "RDC", id_categorie_age: "", id_sexe: "", date_debut: "2026-01-01", date_fin: "", statut: "ACTIF", observations: "" }

test("T13: qualifie distinctement non renseigné, inconnu et non applicable", () => {
  assert.deepEqual(qualifiedValue(""), { state: "NON_RENSEIGNE", label: "Non renseigné" })
  assert.deepEqual(qualifiedValue("X", { known: false }), { state: "INCONNU", label: "Inconnu" })
  assert.deepEqual(qualifiedValue("", { applicable: false }), { state: "NON_APPLICABLE", label: "Non applicable" })
  assert.deepEqual(qualifiedValue("Kinshasa"), { state: null, label: "Kinshasa" })
})

test("T13: distingue schéma invalide, timeout et source indisponible", () => {
  assert.equal(classifyDataError(new Error("colonnes manquantes"), "programmes").state, "SCHEMA_INVALIDE")
  assert.equal(classifyDataError(new Error("timeout Sheets"), "resultats").state, "SOURCE_INDISPONIBLE")
  assert.equal(classifyDataError(new Error("Impossible de charger"), "documents").state, "SOURCE_INDISPONIBLE")
})

test("T13: une relation orpheline est visible et ne fait pas échouer le rapport", () => {
  const report = competitionQuality({ competition, programs: [], engagements: [{ id_engagement_campagne: "ENG-1", id_programme_competition: "PRG-X", id_campagne: "CAM-1", id_statut_engagement: "PREVU", date_engagement: "", observation: "" }], participations: [], results: [], eventsAvailable: true })
  assert.equal(report.issues.some((item) => item.state === "ORPHELIN" && item.blockingWrite), true)
  assert.equal(report.provenance, 0)
})

test("T13: la complétude et la provenance sont calculées sans inventer de valeur", () => {
  const complete = competitionQuality({ competition, programs: [], engagements: [], participations: [], results: [], eventsAvailable: true })
  assert.equal(complete.completeness, 100)
  assert.equal(complete.provenance, 100)
  const incomplete = nationalTeamQuality({ team: { ...team, id_federation: "" }, campaigns: [], selections: [], members: [], engagements: [] })
  assert.equal(incomplete.completeness, 75)
  assert.equal(incomplete.issues.some((item) => item.code === "TEAM_INCOMPLETE"), true)
})

test("T13: les fiches affichent le diagnostic sans masquer leurs onglets", async () => {
  const component = await source("components/dashboard/data-quality-summary.tsx")
  const competitionDetail = await source("app/dashboard/competitions/[id]/competition-detail-client.tsx")
  const teamDetail = await source("app/dashboard/equipes-nationales/[id]/team-detail-client.tsx")
  assert.match(component, /Complétude/)
  assert.match(component, /Provenance/)
  assert.match(component, /Action :/)
  assert.match(competitionDetail, /DataQualitySummary/)
  assert.match(teamDetail, /DataQualitySummary/)
  assert.match(competitionDetail, /TabsContent value="general"/)
  assert.match(teamDetail, /TabsContent value="general"/)
})

test("T13: les mutations réussies invalident toujours les caches concernés", async () => {
  for (const path of ["app/api/competitions/route.ts", "app/api/competitions/[id]/engagements/route.ts", "app/api/equipes-nationales/route.ts", "app/api/equipes-nationales/[id]/selections/route.ts"]) {
    const code = await source(path)
    assert.match(code, /revalidatePath|revalidateTag/, path)
    assert.match(code, /runSportMutation/, path)
  }
})
