import type { AuthorizationBlock } from "../users/types.ts"

export type DashboardNavigationItem = {
  name: string
  href?: string
  icon: "dashboard" | "landmark" | "users" | "trophy" | "shield" | "calendar" | "file" | "globe"
  blocks: readonly AuthorizationBlock[]
  superOnly?: boolean
  children?: readonly { name: string; href: string }[]
}

export const dashboardNavigation: readonly DashboardNavigationItem[] = [
  { name: "Tableau de bord", href: "/dashboard", icon: "dashboard", blocks: ["AUT-ADM", "AUT-SPT", "AUT-COM"] },
  { name: "Fédérations", href: "/dashboard/federations", icon: "landmark", blocks: ["AUT-SPT"] },
  { name: "Acteurs", href: "/dashboard/acteurs", icon: "users", blocks: ["AUT-SPT"], children: [
    { name: "Athlètes", href: "/dashboard/acteurs/athletes" },
    { name: "Entraîneurs", href: "/dashboard/acteurs/entraineurs" },
    { name: "Arbitres", href: "/dashboard/acteurs/arbitres" },
    { name: "Officiels", href: "/dashboard/acteurs/officiels" },
    { name: "Médecins", href: "/dashboard/acteurs/medecins" },
    { name: "Autres", href: "/dashboard/acteurs/autres" },
  ] },
  { name: "Antidopage", href: "/dashboard/antidopage", icon: "shield", blocks: ["AUT-ADM", "AUT-SPT", "AUT-COM"], children: [
    { name: "Contrôles", href: "/dashboard/antidopage/controles" },
    { name: "AUT", href: "/dashboard/antidopage/aut" },
    { name: "Sanctions", href: "/dashboard/antidopage/sanctions" },
  ] },
  { name: "Compétitions", href: "/dashboard/competitions", icon: "trophy", blocks: ["AUT-SPT"] },
  { name: "Équipes nationales", href: "/dashboard/equipes-nationales", icon: "shield", blocks: ["AUT-SPT"] },
  { name: "Activités", href: "/dashboard/activites", icon: "calendar", blocks: ["AUT-ADM"] },
  { name: "Documents", href: "/dashboard/documents", icon: "file", blocks: ["AUT-ADM"] },
  { name: "Site web", href: "/dashboard/site-web", icon: "globe", blocks: ["AUT-COM"] },
  { name: "Utilisateurs", href: "/dashboard/utilisateurs", icon: "users", blocks: [], superOnly: true },
]

export function visibleDashboardNavigation(
  items: readonly DashboardNavigationItem[],
  access: { isSuperAdmin: boolean; readableBlocks: readonly string[] },
) {
  if (access.isSuperAdmin) return items
  return items.filter((item) => !item.superOnly && item.blocks.some((block) => access.readableBlocks.includes(block)))
}
