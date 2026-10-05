"use client"

import { createContext, useCallback, useContext, useState, type ReactNode } from "react"

type NavigationState = { collapsed: boolean; mobileOpen: boolean; toggleCollapsed: () => void; toggleMobile: () => void; closeMobile: () => void }
const NavigationContext = createContext<NavigationState | null>(null)

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const toggleCollapsed = useCallback(() => setCollapsed(value => !value), [])
  const toggleMobile = useCallback(() => { setCollapsed(false); setMobileOpen(value => !value) }, [])
  const closeMobile = useCallback(() => setMobileOpen(false), [])
  return <NavigationContext.Provider value={{ collapsed, mobileOpen, toggleCollapsed, toggleMobile, closeMobile }}>{children}</NavigationContext.Provider>
}

export const useDashboardNavigation = () => useContext(NavigationContext)
