"use client"

import Link from "next/link"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { Header } from "./header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function ServiceUnavailable({ retry }: { retry?: () => void }) {
  return <div>
    <Header title="Service momentanément indisponible" subtitle="CNAC" />
    <div className="p-4 sm:p-6">
      <Card className="mx-auto w-full max-w-xl">
        <CardHeader>
          <AlertTriangle className="mb-2 h-8 w-8 text-amber-600" aria-hidden="true" />
          <CardTitle>La connexion au service de données est interrompue</CardTitle>
          <CardDescription>Votre session n’a pas été supprimée. Les données sont temporairement indisponibles. Réessayez dans quelques instants.</CardDescription>
        </CardHeader>
        <CardContent>{retry ? <Button onClick={retry}><RefreshCw aria-hidden="true" />Réessayer</Button> : <Button asChild><Link href="/dashboard"><RefreshCw aria-hidden="true" />Réessayer</Link></Button>}</CardContent>
      </Card>
    </div>
  </div>
}
