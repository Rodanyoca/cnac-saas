import type { AuthorizationAction, AuthorizationRequirement } from "./authorization.ts"

export type RoutePolicy = AuthorizationRequirement & { action: AuthorizationAction; id: string }

type Rule = {
  id: string
  methods?: readonly string[]
  pattern: RegExp
  requirement: AuthorizationRequirement
  action?: AuthorizationAction
}

const SPT = { scope: "BUSINESS", blocks: ["AUT-SPT"] } as const
const ADM = { scope: "BUSINESS", blocks: ["AUT-ADM"] } as const
const COM = { scope: "BUSINESS", blocks: ["AUT-COM"] } as const
const ANY_BUSINESS = { scope: "BUSINESS", blocks: ["AUT-ADM", "AUT-SPT", "AUT-COM"] } as const
const SUPER_ADMIN = { scope: "SUPER_ADMIN" } as const

export const ROUTE_RULES: readonly Rule[] = [
  { id: "page-users", pattern: /^\/dashboard\/(?:users|utilisateurs|autorisations|referentiels)(?:\/.*)?$/, requirement: SUPER_ADMIN },
  { id: "page-federation-settings", pattern: /^\/dashboard\/federations\/[^/]+\/parametres$/, requirement: SPT, action: "WRITE" },
  { id: "page-other-actor-write", pattern: /^\/dashboard\/acteurs\/autres\/(?:nouveau|[^/]+\/modifier)$/, requirement: SPT, action: "WRITE" },
  { id: "page-sport-create", pattern: /^\/dashboard\/(?:competitions|equipes-nationales)\/nouveau$/, requirement: SPT, action: "WRITE" },
  { id: "page-administration-create", pattern: /^\/dashboard\/documents\/nouveau$/, requirement: ADM, action: "WRITE" },
  { id: "page-administration", pattern: /^\/dashboard\/(?:activites|documents)(?:\/.*)?$/, requirement: ADM },
  { id: "page-sport", pattern: /^\/dashboard\/(?:federations|acteurs|competitions|equipes-nationales)(?:\/.*)?$/, requirement: SPT },
  { id: "page-communication", pattern: /^\/dashboard\/(?:articles|galeries|partenaires|contenus-web)(?:\/.*)?$/, requirement: COM },
  { id: "page-site-web", pattern: /^\/dashboard\/site-web(?:\/(?:sliders|communiques|actualites|galeries|historique|gouvernance|jeux|athletes|entites|evenements|documents)(?:\/.*)?)?$/, requirement: COM },
  { id: "page-dashboard", pattern: /^\/dashboard$/, requirement: ANY_BUSINESS },
  { id: "page-antidopage-placeholder", pattern: /^\/dashboard\/antidopage(?:\/(?:controles|aut|sanctions))?$/, requirement: ANY_BUSINESS, action: "READ" },
  { id: "api-super-admin", pattern: /^\/api\/(?:users|authorizations|autorisations|referentiels)(?:\/.*)?$/, requirement: SUPER_ADMIN },
  { id: "api-dashboard-refresh", methods: ["POST"], pattern: /^\/api\/dashboard\/refresh$/, requirement: ANY_BUSINESS, action: "WRITE" },
  { id: "api-administration", pattern: /^\/api\/(?:activites|documents)(?:\/.*)?$/, requirement: ADM },
  { id: "api-sport", pattern: /^\/api\/(?:arbitres|athletes|autres|coachs|competitions|equipes-nationales|federations|medecins|officiels|upload-media)(?:\/.*)?$/, requirement: SPT },
  { id: "api-communication", pattern: /^\/api\/(?:articles|galeries|partenaires|contenus-web)(?:\/.*)?$/, requirement: COM },
  { id: "api-site-web", pattern: /^\/api\/site-web\/(?:sliders|communiques|actualites|galeries|historique|gouvernance|jeux|athletes|entites|evenements|documents)(?:\/.*)?$/, requirement: COM },
]

export function routePolicy(pathname: string, method = "GET"): RoutePolicy | null {
  const normalizedMethod = method.toUpperCase()
  const rule = ROUTE_RULES.find((candidate) => (!candidate.methods || candidate.methods.includes(normalizedMethod)) && candidate.pattern.test(pathname))
  if (!rule) return null
  const action = rule.action ?? (["GET", "HEAD", "OPTIONS"].includes(normalizedMethod) ? "READ" : "WRITE")
  return { ...rule.requirement, action, id: rule.id }
}
