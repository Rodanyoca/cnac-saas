import type { Metadata, Viewport } from "next"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

export const metadata: Metadata = {
  title: "CNAC — Système de gestion",
  description: "Système de gestion du Comité National Antidopage Congolais",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr"><body className="font-sans antialiased">{children}<Toaster richColors position="top-right" /><Analytics /></body></html>
}
