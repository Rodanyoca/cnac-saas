import type { DashboardNavigationItem } from "./dashboard-navigation.ts"

// Presentation only: original items, destinations and permission filtering remain intact.
export function dashboardSections(visible: readonly DashboardNavigationItem[]) {
  const sectionFor = (item: DashboardNavigationItem) => item.href === "/dashboard/competitions" ? "Competition"
    : item.href === "/dashboard/equipes-nationales" ? "Equipe nationale"
    : ["/dashboard/activites", "/dashboard/documents", "/dashboard/site-web", "/dashboard/utilisateurs"].includes(item.href || "") ? "Administration" : ""
  const sections: { title: string; items: DashboardNavigationItem[] }[] = []
  for (const item of visible) {
    const title = sectionFor(item), last = sections.at(-1)
    if (title && last?.title === title) last.items.push(item)
    else sections.push({ title, items: [item] })
  }
  return sections
}
