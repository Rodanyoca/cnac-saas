"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { AlertCircle, Building2, Eye, Search } from "lucide-react"
import { Header } from "@/components/dashboard/header"
import { FederationCreateSheet, type FederationCreationReferences } from "@/components/dashboard/federation-create-sheet"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { Federation } from "@/lib/federations/types"

const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr")
const readable = (value: string) => value ? value.replaceAll("_", " ").toLocaleLowerCase("fr").replace(/^./, (letter) => letter.toLocaleUpperCase("fr")) : "Non renseigné"
const positive = (value: string) => ["actif", "affilie", "reconnu", "oui", "valide"].some((word) => normalize(value).includes(word))
const initials = (name: string, sigle: string) => sigle.slice(0, 3).toUpperCase() || name.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase() || "FD"

function StatusBadge({ value, shortLabel }: { value: string; shortLabel?: string }) {
  const label = readable(value)
  return <Tooltip><TooltipTrigger asChild><Badge variant="outline" className={value && positive(value) ? "max-w-full border-green-300 bg-green-50 text-green-700" : value ? "max-w-full border-orange-300 bg-orange-50 text-orange-700" : "max-w-full text-muted-foreground"}><span className="whitespace-normal text-center leading-4 sm:hidden">{shortLabel || label}</span><span className="hidden whitespace-normal text-center leading-4 sm:inline">{label}</span></Badge></TooltipTrigger><TooltipContent>{label}</TooltipContent></Tooltip>
}

export default function FederationsClient({ initialFederations: initial, references, canWrite, loadError, logoAvailable = false }: { initialFederations: Federation[]; references: FederationCreationReferences; canWrite: boolean; loadError?: string; logoAvailable?: boolean }) {
  const [initialFederations, setFederations] = useState(initial)
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("TOUTES")
  const categories = useMemo(() => [...new Set(initialFederations.map((item) => item.categorie_entite).filter(Boolean))].sort((a, b) => a.localeCompare(b, "fr")), [initialFederations])
  const rows = useMemo(() => { const needle=normalize(query.trim()); return initialFederations.filter((item) => (category === "TOUTES" || item.categorie_entite === category) && (!needle || normalize([item.id_federation,item.nom_federation,item.sigle_federation,item.categorie_entite,item.statut_reconnaissance_ministere,item.statut_affiliation_coc].join(" ")).includes(needle))) }, [category, initialFederations, query])
  return <div className="min-h-screen"><Header title="Fédérations" subtitle="Fédérations sportives nationales" /><main className="space-y-5 p-4 md:p-6">
    <div className="flex justify-end">{canWrite && <FederationCreateSheet logoAvailable={logoAvailable} references={references} onCreated={(federation) => setFederations((current) => [...current, federation].sort((a, b) => a.nom_federation.localeCompare(b.nom_federation, "fr")))} />}</div>
    {loadError ? <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Impossible de charger les fédérations</AlertTitle><AlertDescription>Les données sont temporairement indisponibles. Réessayez plus tard.</AlertDescription></Alert> : <>
      <div className="flex max-w-3xl flex-col gap-3 sm:flex-row"><div className="relative min-w-0 flex-1"><Search aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input aria-label="Rechercher une fédération" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher une fédération…" className="pl-9" /></div><Select value={category} onValueChange={setCategory}><SelectTrigger className="w-full sm:w-64" aria-label="Filtrer par catégorie"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="TOUTES">Toutes les catégories</SelectItem>{categories.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
      <Card className="overflow-hidden"><CardContent className="p-0">{!initialFederations.length ? <Empty className="min-h-64 border-0"><EmptyHeader><EmptyMedia variant="icon"><Building2 /></EmptyMedia><EmptyTitle>Aucune fédération</EmptyTitle><EmptyDescription>Aucune fédération exploitable n’est disponible dans le référentiel.</EmptyDescription></EmptyHeader></Empty> : !rows.length ? <Empty className="min-h-64 border-0"><EmptyHeader><EmptyMedia variant="icon"><Search /></EmptyMedia><EmptyTitle>Aucun résultat</EmptyTitle><EmptyDescription>Aucune fédération ne correspond à cette recherche.</EmptyDescription></EmptyHeader></Empty> : <div className="w-full">
        <div className="hidden grid-cols-[minmax(0,.65fr)_3rem_minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1.1fr)_minmax(0,1.1fr)_2.75rem] gap-3 border-b bg-muted/40 px-4 py-3 text-xs font-medium text-muted-foreground lg:grid"><span>Identifiant</span><span>Logo</span><span>Nom et sigle</span><span>Catégorie</span><span>Reconnaissance</span><span>Affiliation COC</span><span className="sr-only">Action</span></div>
        <div className="divide-y">{rows.map((item) => {const href=`/dashboard/federations/${encodeURIComponent(item.id_federation)}`;return <article key={item.id_federation} className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] gap-3 p-4 transition-colors hover:bg-muted/30 lg:grid-cols-[minmax(0,.65fr)_3rem_minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1.1fr)_minmax(0,1.1fr)_2.75rem] lg:items-center">
          <div className="min-w-0"><span className="text-xs text-muted-foreground lg:hidden">Identifiant</span><p className="break-all font-mono text-xs sm:text-sm">{item.id_federation || "Non renseigné"}</p></div>
          <Avatar className="h-9 w-9 border border-border/60 bg-muted">{item.logo_drive_url && <AvatarImage src={item.logo_drive_url} alt={`Logo de ${item.nom_federation || item.id_federation}`} className="object-contain p-0.5" />}<AvatarFallback className="text-[10px] font-medium">{initials(item.nom_federation, item.sigle_federation)}</AvatarFallback></Avatar>
          <div className="row-span-3 flex items-start justify-end lg:row-span-1 lg:items-center"><Tooltip><TooltipTrigger asChild><Button asChild variant="ghost" size="icon"><Link href={href} aria-label={`Voir la fiche de ${item.nom_federation || item.id_federation}`}><Eye className="h-4 w-4" /></Link></Button></TooltipTrigger><TooltipContent>Voir la fiche</TooltipContent></Tooltip></div>
          <div className="min-w-0 lg:col-start-3 lg:row-start-1"><p className="break-words font-medium">{item.nom_federation || "Non renseigné"}</p>{item.sigle_federation && <p className="mt-0.5 break-words text-sm text-muted-foreground">{item.sigle_federation}</p>}</div>
          <div className="min-w-0 lg:col-start-4 lg:row-start-1"><span className="text-xs text-muted-foreground lg:hidden">Catégorie</span><p className="break-words text-sm">{item.categorie_entite || "Non renseigné"}</p></div>
          <div className="min-w-0 lg:col-start-5 lg:row-start-1"><span className="mb-1 block text-xs text-muted-foreground lg:hidden">Reconnaissance</span><StatusBadge value={item.statut_reconnaissance_ministere} shortLabel="Ministère" /></div>
          <div className="min-w-0 lg:col-start-6 lg:row-start-1"><span className="mb-1 block text-xs text-muted-foreground lg:hidden">Affiliation COC</span><StatusBadge value={item.statut_affiliation_coc} shortLabel="COC" /></div>
        </article>})}</div>
      </div>}</CardContent></Card>
    </>}
  </main></div>
}
