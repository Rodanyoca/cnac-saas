"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Activity, BadgeCheck, Building2, Calendar, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, FileText, Flag, Globe2, Landmark, LayoutDashboard, MapPin, Shield, Stethoscope, Trophy, UserCog, Users, X, type LucideIcon } from "lucide-react"
import { useEffect, useRef, useState, useSyncExternalStore } from "react"
import { NAVIGATION_SNAPSHOT_KEY, navigationSnapshot } from "@/lib/navigation/navigation-snapshot"
import { dashboardNavigation, visibleDashboardNavigation, type DashboardNavigationItem } from "@/lib/navigation/dashboard-navigation"
import { dashboardSections } from "@/lib/navigation/dashboard-presentation"
import { cn } from "@/lib/utils"
import { useDashboardNavigation } from "./navigation-provider"

const icons = { dashboard: LayoutDashboard, landmark: Landmark, users: Users, trophy: Trophy, shield: Shield, calendar: Calendar, file: FileText, globe: Globe2 }
const routeIcons: Record<string, LucideIcon> = {
  "/dashboard/acteurs/athletes": Users, "/dashboard/acteurs/entraineurs": UserCog,
  "/dashboard/acteurs/arbitres": Flag, "/dashboard/acteurs/officiels": BadgeCheck,
  "/dashboard/acteurs/medecins": Stethoscope, "/dashboard/acteurs/autres": Users,
  "/dashboard/equipes-nationales": Flag, "/dashboard/activites": Activity,
  "/dashboard/ligues": MapPin, "/dashboard/ententes": Building2, "/dashboard/clubs": Shield,
}
const focusStyle = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"

const subscribeSnapshot = (onChange: () => void) => { window.addEventListener("storage", onChange); return () => window.removeEventListener("storage", onChange) }
const readSnapshot = () => { try { return sessionStorage.getItem(NAVIGATION_SNAPSHOT_KEY) || "" } catch { return "" } }
const emptySnapshot = () => ""

export function Sidebar({ initialAccess, initialIsSuperAdmin, unavailable = false }: { initialAccess: Record<string, boolean>; initialIsSuperAdmin: boolean; unavailable?: boolean }) {
  const pathname = usePathname()
  const navigation = useDashboardNavigation()
  const collapsed = navigation?.collapsed || false, mobileOpen = navigation?.mobileOpen || false
  const closeMobile = navigation?.closeMobile
  const aside = useRef<HTMLElement>(null)
  const [expanded, setExpanded] = useState<string[]>(["Acteurs", "Antidopage", "Structure territoriale", "Compétitions", "Competition", "Equipe nationale", "Administration"])
  const snapshotValue = useSyncExternalStore(subscribeSnapshot, readSnapshot, emptySnapshot)
  const snapshot = unavailable ? navigationSnapshot(snapshotValue) : null
  const shownAccess = snapshot?.access || initialAccess
  const readableBlocks = ["AUT-ADM", "AUT-SPT", "AUT-COM"].filter(block => shownAccess[`${block}:READ`] === true)
  const permittedNavigation = visibleDashboardNavigation(dashboardNavigation, { isSuperAdmin: snapshot?.isSuperAdmin ?? initialIsSuperAdmin, readableBlocks })
  const visible = unavailable && !permittedNavigation.length ? [dashboardNavigation[0]] : permittedNavigation
  useEffect(() => {
    if (unavailable) return
    try { sessionStorage.setItem(NAVIGATION_SNAPSHOT_KEY, JSON.stringify({ access: initialAccess, isSuperAdmin: initialIsSuperAdmin })) } catch { /* La navigation reste disponible sans stockage navigateur. */ }
  }, [initialAccess, initialIsSuperAdmin, unavailable])
  const toggle = (name: string) => setExpanded(current => current.includes(name) ? current.filter(item => item !== name) : [...current, name])
  const isActive = (href?: string) => Boolean(href && (href === "/dashboard" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`)))

  useEffect(() => {
    if (!mobileOpen) return
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const focusable = () => Array.from(aside.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])') || []).filter(element => element.getClientRects().length > 0)
    focusable()[0]?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); closeMobile?.() }
      if (event.key !== "Tab") return
      const elements = focusable(), first = elements[0], last = elements.at(-1)
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
    }
    document.addEventListener("keydown", onKeyDown)
    const desktop = window.matchMedia("(min-width: 1024px)")
    const onViewportChange = () => { if (desktop.matches) closeMobile?.() }
    desktop.addEventListener("change", onViewportChange)
    return () => { document.removeEventListener("keydown", onKeyDown); desktop.removeEventListener("change", onViewportChange); previous?.focus() }
  }, [mobileOpen, closeMobile])

  const renderLink = (item: { name: string; href?: string; icon?: DashboardNavigationItem["icon"] }, fallback: LucideIcon = Users) => {
    if (!item.href) return null
    const Icon = routeIcons[item.href] || (item.icon ? icons[item.icon] : fallback)
    const active = isActive(item.href)
    return <Link key={item.href} href={item.href} onClick={closeMobile} aria-current={active ? "page" : undefined} title={collapsed ? item.name : undefined} className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors", focusStyle, active ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground")}><Icon className="h-5 w-5 flex-shrink-0" strokeWidth={2} aria-hidden="true" />{!collapsed && <span>{item.name}</span>}</Link>
  }

  const renderGroup = (title: string, items: readonly { name: string; href?: string; icon?: DashboardNavigationItem["icon"] }[], href?: string, fallback?: LucideIcon) => {
    if (collapsed) return <div key={title} className="space-y-1">{href && renderLink({ name: title, href }, fallback)}{items.map(item => renderLink(item, fallback))}</div>
    const open = expanded.includes(title)
    return <div key={title} className="space-y-1">
      <div className="flex items-center">
        {href ? <><Link href={href} onClick={closeMobile} className={cn("min-w-0 flex-1 rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wide text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground", focusStyle)}>{title}</Link><button type="button" className={cn("rounded-lg px-3 py-2 text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground", focusStyle)} aria-label={`${open ? "Réduire" : "Développer"} ${title}`} aria-expanded={open} onClick={() => toggle(title)}>{open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</button></> : <button type="button" onClick={() => toggle(title)} aria-expanded={open} className={cn("flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground", focusStyle)}><span className="uppercase tracking-wide">{title}</span>{open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</button>}
      </div>
      {open && <div className="space-y-1 pl-2">{items.map(item => renderLink(item, fallback))}</div>}
    </div>
  }

  return <>
    {mobileOpen && <button type="button" tabIndex={-1} onClick={closeMobile} aria-label="Fermer la navigation" className="fixed inset-0 z-40 bg-black/60 lg:hidden" />}
    <aside ref={aside} id="dashboard-navigation" aria-label="Navigation CNAC" role={mobileOpen ? "dialog" : undefined} aria-modal={mobileOpen || undefined} className={cn("fixed inset-y-0 left-0 z-50 h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar shadow-[16px_0_40px_rgba(1,10,20,0.22)] transition-all duration-300 lg:relative lg:z-40 lg:flex", mobileOpen ? "flex" : "hidden", collapsed ? "lg:w-16" : "lg:w-64")}>
      <div className="flex h-full min-h-0 flex-col">
        <div className={cn("relative flex h-16 shrink-0 items-center justify-between border-b border-sidebar-border after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-gradient-to-r after:from-[#1188c7] after:via-[#f6c515] after:to-[#e23b52]", collapsed ? "justify-center px-2" : "px-4")}>
          <Link href="/dashboard" onClick={closeMobile} className={cn("flex items-center gap-3 rounded-md", focusStyle)} title={collapsed ? "CNAC" : undefined}><span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white"><Image src="/images/logo-cnac-temp.png" alt="Emblème temporaire du CNAC" width={40} height={40} className="h-full w-full object-contain" priority /></span>{!collapsed && <span className="text-lg font-black tracking-[0.12em] text-sidebar-foreground">CNAC</span>}</Link>
          <button type="button" aria-label="Fermer la navigation" onClick={closeMobile} className={cn("rounded-md p-1 text-sidebar-muted hover:text-sidebar-foreground lg:hidden", focusStyle)}><X className="h-5 w-5" /></button>
        </div>
        <button type="button" onClick={navigation?.toggleCollapsed} aria-label={collapsed ? "Déployer la navigation" : "Réduire la navigation"} aria-expanded={!collapsed} className={cn("absolute -right-3 top-20 hidden h-6 w-6 items-center justify-center rounded-full border border-sidebar-border bg-sidebar text-sidebar-muted shadow-md transition-colors hover:border-primary/60 hover:bg-sidebar-accent hover:text-primary lg:flex", focusStyle)}>{collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}</button>
        <nav aria-label="Navigation principale" className="min-h-0 flex-1 space-y-1 overflow-y-auto overflow-x-hidden px-2 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {dashboardSections(visible).map((section, index) => section.title ? renderGroup(section.title, section.items) : <div key={index} className="space-y-1">{section.items.map(item => item.children ? renderGroup(item.name, item.children, item.href, icons[item.icon]) : renderLink(item))}</div>)}
        </nav>
        <div className="shrink-0 border-t border-sidebar-border px-4 py-3"><p className="text-center text-[10px] uppercase tracking-[0.18em] text-sidebar-muted">{collapsed ? "DS" : <>DS <span className="font-semibold text-sidebar-foreground/70">Concept</span></>}</p></div>
      </div>
    </aside>
  </>
}
