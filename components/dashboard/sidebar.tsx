"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BadgeCheck,
  Calendar,
  ChevronDown,
  ChevronUp,
  FileText,
  Flag,
  Globe2,
  Landmark,
  LayoutDashboard,
  Shield,
  Stethoscope,
  Trophy,
  UserCog,
  Users,
} from "lucide-react"
import { useState } from "react"
import { dashboardNavigation, visibleDashboardNavigation } from "@/lib/navigation/dashboard-navigation"
import { cn } from "@/lib/utils"

const icons = {
  dashboard: LayoutDashboard,
  landmark: Landmark,
  users: Users,
  trophy: Trophy,
  shield: Shield,
  calendar: Calendar,
  file: FileText,
  globe: Globe2,
}

const childIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "/dashboard/acteurs/athletes": Users,
  "/dashboard/acteurs/entraineurs": UserCog,
  "/dashboard/acteurs/arbitres": Flag,
  "/dashboard/acteurs/officiels": BadgeCheck,
  "/dashboard/acteurs/medecins": Stethoscope,
  "/dashboard/acteurs/autres": Users,
}

export function Sidebar({ initialAccess, initialIsSuperAdmin }: { initialAccess: Record<string, boolean>; initialIsSuperAdmin: boolean }) {
  const pathname = usePathname()
  const [expanded, setExpanded] = useState<string[]>(["Acteurs", "Structure territoriale", "Compétitions"])

  const readableBlocks = ["AUT-ADM", "AUT-SPT", "AUT-COM"].filter((block) => initialAccess[`${block}:READ`] === true)
  const visible = visibleDashboardNavigation(dashboardNavigation, { isSuperAdmin: initialIsSuperAdmin, readableBlocks })

  const toggle = (name: string) => {
    setExpanded((current) => (current.includes(name) ? current.filter((item) => item !== name) : [...current, name]))
  }

  function isItemActive(href: string | undefined): boolean {
    if (!href) return false
    if (href === "/dashboard") return pathname === "/dashboard"
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <aside className="relative flex h-screen w-64 shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar font-sans text-sidebar-foreground shadow-[16px_0_40px_rgba(1,10,20,0.22)]">
      <div className="flex h-full min-h-0 flex-col">
        {/* En-tête de marque CNAC avec emblème temporaire */}
        <div className="relative flex h-16 shrink-0 items-center justify-between border-b border-sidebar-border px-4 after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-gradient-to-r after:from-[#1188c7] after:via-[#f6c515] after:to-[#e23b52]">
          <Link href="/dashboard" className="flex items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white shadow-sm ring-1 ring-primary/20">
              <Image src="/images/logo-cnac-temp.png" alt="Emblème temporaire du CNAC" width={40} height={40} className="h-full w-full object-contain" priority />
            </span>
            <span className="text-lg font-black tracking-[0.12em] text-sidebar-foreground">CNAC</span>
          </Link>
        </div>

        {/* Navigation principale */}
        <nav aria-label="Navigation principale" className="min-h-0 flex-1 space-y-1 overflow-y-auto overflow-x-hidden px-2 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[.18em] text-sidebar-muted/70">Navigation</p>

          <div className="space-y-1">
            {visible.map((item) => {
              const Icon = icons[item.icon]
              const opened = expanded.includes(item.name)

              if (item.children) {
                return (
                  <div key={item.name} className="space-y-1">
                    <button
                      type="button"
                      onClick={() => toggle(item.name)}
                      className="flex min-h-9 w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wide text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
                      aria-expanded={opened}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                        <span className="truncate">{item.name}</span>
                      </div>
                      {opened ? <ChevronUp className="h-4 w-4 shrink-0" aria-hidden="true" /> : <ChevronDown className="h-4 w-4 shrink-0" aria-hidden="true" />}
                    </button>

                    {opened && (
                      <div className="space-y-1 pl-2">
                        {item.children.map((child) => {
                          const childActive = isItemActive(child.href)
                          const ChildIcon = childIcons[child.href] || Icon
                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              className={cn(
                                "flex min-h-9 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                                childActive
                                  ? "bg-sidebar-primary text-sidebar-primary-foreground font-semibold shadow-sm"
                                  : "text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground"
                              )}
                            >
                              <ChildIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
                              <span className="truncate">{child.name}</span>
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              }

              const active = isItemActive(item.href)
              return (
                <Link
                  key={item.name}
                  href={item.href!}
                  className={cn(
                    "flex min-h-10 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                    active
                      ? "bg-sidebar-primary text-sidebar-primary-foreground font-semibold shadow-sm"
                      : "text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                  <span className="truncate">{item.name}</span>
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="shrink-0 border-t border-sidebar-border px-4 py-3">
          <p className="text-center text-[10px] tracking-[0.18em] text-sidebar-muted uppercase">
            DS <span className="font-semibold text-sidebar-foreground/70">Concept</span>
          </p>
        </div>
      </div>
    </aside>
  )
}
