export type ResultDecisionOption = {
  id: string
  label: string
  federationId?: string
  sportId?: string
  disciplineId?: string
  active?: boolean
  disabled?: boolean
}

export type ResultDecisionContext = {
  federationId?: string
  sportId?: string
  disciplineId?: string
}

export function filterResultDecisions(decisions: ResultDecisionOption[], context: ResultDecisionContext) {
  return decisions
    .filter((decision) => decision.active !== false)
    .filter((decision) => !decision.federationId || decision.federationId === context.federationId)
    .filter((decision) => !decision.sportId || decision.sportId === context.sportId)
    .filter((decision) => !decision.disciplineId || decision.disciplineId === context.disciplineId)
    .sort((a, b) => decisionRank(a) - decisionRank(b) || a.label.localeCompare(b.label, "fr"))
}

function decisionRank(decision: ResultDecisionOption) {
  if (decision.disciplineId) return 0
  if (decision.sportId) return 1
  return 2
}

export function resultFormPolicy(resultTypeId: string, decisions: ResultDecisionOption[]) {
  const decisionOnly = resultTypeId === "TR_DECISION"
  const hasSpecializedDecision = decisions.some((decision) => Boolean(decision.sportId || decision.disciplineId))
  return {
    showQuantitative: !decisionOnly,
    showDecision: decisionOnly || hasSpecializedDecision,
    syntheticRequired: decisionOnly,
    decisionRequired: decisionOnly,
  }
}

export function normalizeResultForType<T extends { valeur_coc: string; valeur_adversaire: string; id_unite_mesure: string }>(row: T, resultTypeId: string): T {
  return resultTypeId === "TR_DECISION"
    ? { ...row, valeur_coc: "", valeur_adversaire: "", id_unite_mesure: "" }
    : row
}

export function formatResultSummary(input: { synthetic?: string; decision?: string; value?: string; opponentValue?: string; unit?: string }) {
  const score = input.value
    ? `${input.value}${input.opponentValue ? `–${input.opponentValue}` : ""}${input.unit ? ` ${input.unit}` : ""}`
    : ""
  const outcome = [input.synthetic, score].filter(Boolean).join(" ")
  return [outcome, input.decision].filter(Boolean).join(" — ") || "Résultat non renseigné"
}
