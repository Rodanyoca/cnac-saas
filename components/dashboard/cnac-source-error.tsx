"use client"
import { useRouter } from "next/navigation"
import { Header } from "@/components/dashboard/header"
import { Alert,AlertDescription,AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
export function CnacSourceError({message}:{message:string}) {
  const router=useRouter()
  return <div className="min-h-screen"><Header title="Chargement impossible" subtitle="Données CNAC"/><main className="space-y-4 p-6"><Alert><AlertTitle>Source Google indisponible</AlertTitle><AlertDescription>{message}</AlertDescription></Alert><Button variant="outline" onClick={()=>router.refresh()}>Réessayer</Button></main></div>
}
