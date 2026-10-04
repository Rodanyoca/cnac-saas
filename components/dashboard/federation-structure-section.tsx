"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { ChevronRight, Eye, Pencil, Plus, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { FederationStructure, FederationStructureSection } from "@/lib/federations/structure-model"

const number = new Intl.NumberFormat("fr-FR")
const shown = (value: string) => value || "—"
export function FederationHierarchySummary({ structure, loadError }: { structure?: FederationStructure; loadError?: boolean }) {
  return <section className="min-w-0 rounded-xl border border-border/70 bg-card/80 p-4 shadow-[0_12px_28px_rgba(7,25,54,.04)]" aria-labelledby="hierarchy-title">
    <h3 id="hierarchy-title" className="mb-3 flex items-center gap-3 text-[11px] font-bold uppercase tracking-[.16em] text-primary/80 before:h-0.5 before:w-8 before:bg-primary/80">Hiérarchie appliquée</h3>
    {loadError ? <p className="text-sm text-destructive">La hiérarchie territoriale est temporairement indisponible.</p>
      : structure && structure.hierarchy.length > 1 ? <div className="flex flex-wrap items-center gap-1.5">{structure.hierarchy.map((level, index) => <span key={`${level}-${index}`} className="contents"><Badge variant={index === 0 ? "secondary" : "outline"} className="whitespace-normal text-center">{level}</Badge>{index < structure.hierarchy.length - 1 && <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />}</span>)}</div>
      : <p className="text-sm text-muted-foreground">Aucune hiérarchie territoriale n’est paramétrée pour cette fédération.</p>}
    {structure && <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">{structure.sections.map((section) => <div key={section.key} className="rounded-lg border border-border/60 bg-background/35 px-3 py-2"><p className="text-[10px] font-semibold uppercase tracking-[.14em] text-muted-foreground">{section.label}</p><p className="mt-2 text-lg font-semibold tabular-nums">{number.format(section.items.length)}</p></div>)}</div>}
  </section>
}

function editorHref(federationId: string, typeId: string, action: "create" | "edit", entityId?: string) {
  const query = new URLSearchParams({ typeId, action })
  if (entityId) query.set("entityId", entityId)
  return `/dashboard/federations/${encodeURIComponent(federationId)}/parametres?${query.toString()}`
}

function StructureTable({ section, federationId, canWrite }: { section: FederationStructureSection; federationId: string; canWrite: boolean }) {
  const [query, setQuery] = useState("")
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)
  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("fr")
    return needle ? section.items.filter((item) => [item.id, item.federalId, item.name, item.alias, item.record.nom_categorie_age || "", item.phone, item.email, item.status].some((value) => value.toLocaleLowerCase("fr").includes(needle))) : section.items
  }, [query, section.items])
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const emptyMessage = query ? "Aucun élément ne correspond à la recherche." : "Aucun élément enregistré."

  return <div className="space-y-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="relative min-w-0 flex-1 sm:max-w-md"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} className="pl-9" placeholder={`Rechercher dans ${section.label.toLocaleLowerCase("fr")}…`} aria-label={`Rechercher dans ${section.label}`} /></div><div className="flex items-center gap-2 text-sm"><span className="whitespace-nowrap text-muted-foreground">Afficher</span><Select value={String(pageSize)} onValueChange={(value) => { setPageSize(Number(value)); setPage(1) }}><SelectTrigger className="w-20" aria-label={`Nombre de ${section.label.toLocaleLowerCase("fr")} par page`}><SelectValue /></SelectTrigger><SelectContent>{[10, 20, 50].map((size) => <SelectItem key={size} value={String(size)}>{size}</SelectItem>)}</SelectContent></Select></div></div>
    <div className="hidden md:block"><Table><TableHeader><TableRow><TableHead>ID CNAC</TableHead><TableHead>ID fédéral</TableHead><TableHead>Nom</TableHead><TableHead>{section.key === "equipes" ? "Catégorie équipe" : "Sigle"}</TableHead><TableHead>Statut</TableHead><TableHead className="w-24">Actions</TableHead></TableRow></TableHeader><TableBody>{visible.map((item) => <TableRow key={item.id || item.name}><TableCell>{shown(item.id)}</TableCell><TableCell>{shown(item.federalId)}</TableCell><TableCell className="max-w-56 whitespace-normal font-medium">{shown(item.name)}</TableCell><TableCell className="max-w-48 whitespace-normal">{section.key === "equipes" ? item.record.nom_categorie_age || "Non renseignée" : shown(item.alias)}</TableCell><TableCell><Badge variant="outline">{shown(item.status).replaceAll("_", " ")}</Badge></TableCell><TableCell><div className="flex">{canWrite && <Button asChild variant="ghost" size="icon-sm" aria-label={`Modifier ${item.name}`}><Link href={editorHref(federationId, item.typeId, "edit", item.id)}><Pencil className="h-4 w-4" /></Link></Button>}<Button asChild variant="ghost" size="icon-sm" aria-label={`Ouvrir la fiche de ${item.name}`}><Link href={`/dashboard/federations/${encodeURIComponent(federationId)}/structures/${encodeURIComponent(item.typeId)}/${encodeURIComponent(item.id)}`}><Eye className="h-4 w-4" /></Link></Button></div></TableCell></TableRow>)}{visible.length === 0 && <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">{emptyMessage}</TableCell></TableRow>}</TableBody></Table></div>
    <div className="grid gap-3 md:hidden">{visible.map((item) => <article key={`mobile-${item.id || item.name}`} className="min-w-0 rounded-lg border border-border/60 p-4"><div className="mb-3 flex items-start justify-between gap-3"><div className="min-w-0"><p className="break-words font-semibold">{shown(item.name)}</p></div><Badge variant="outline" className="shrink-0">{shown(item.status).replaceAll("_", " ")}</Badge></div><dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2"><div><dt className="text-muted-foreground">ID CNAC</dt><dd className="break-all">{shown(item.id)}</dd></div><div><dt className="text-muted-foreground">ID fédéral</dt><dd className="break-all">{shown(item.federalId)}</dd></div><div><dt className="text-muted-foreground">{section.key === "equipes" ? "Catégorie équipe" : "Sigle"}</dt><dd className="break-words">{section.key === "equipes" ? item.record.nom_categorie_age || "Non renseignée" : shown(item.alias)}</dd></div></dl><div className="mt-3 flex justify-end">{canWrite && <Button asChild variant="ghost" size="sm"><Link href={editorHref(federationId, item.typeId, "edit", item.id)}><Pencil className="h-4 w-4" />Modifier</Link></Button>}<Button asChild variant="ghost" size="sm"><Link href={`/dashboard/federations/${encodeURIComponent(federationId)}/structures/${encodeURIComponent(item.typeId)}/${encodeURIComponent(item.id)}`}><Eye className="h-4 w-4" />Ouvrir la fiche</Link></Button></div></article>)}{visible.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">{emptyMessage}</p>}</div>
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground"><p>{number.format(filtered.length)} élément{filtered.length > 1 ? "s" : ""}</p><div className="flex items-center gap-2"><Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Précédent</Button><span className="whitespace-nowrap">Page {currentPage} sur {pageCount}</span><Button variant="outline" size="sm" disabled={currentPage === pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>Suivant</Button></div></div>
  </div>
}

export function FederationStructureTables({ structure, loadError, federationId, canWrite }: { structure?: FederationStructure; loadError?: boolean; federationId: string; canWrite: boolean }) {
  const sections = structure?.sections ?? []
  if (loadError) return <p className="text-sm text-destructive">Impossible de charger les niveaux configurés dans Hiérarchie.</p>
  if (!sections.length) return <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">Aucun niveau n’est configuré dans Hiérarchie pour cette fédération.</p>
  return <div className="space-y-6">{sections.map((section) => <Card key={section.key} className="min-w-0 border-border/70 bg-card/85 shadow-[0_12px_28px_rgba(7,25,54,.04)]"><CardHeader className="flex flex-row items-center justify-between gap-3 pb-3"><CardTitle className="text-base tracking-[-0.01em]">{section.label}</CardTitle><div className="flex items-center gap-2">{canWrite && section.supported && <Button asChild size="sm"><Link href={editorHref(federationId, section.typeId, "create")}><Plus className="h-4 w-4" />Ajouter</Link></Button>}</div></CardHeader><CardContent>
    {loadError ? <p className="text-sm text-destructive">Impossible de déterminer la configuration de ce niveau.</p>
      : !section.supported ? <p className="text-sm text-muted-foreground">Aucun stockage CNAC n’est associé à ce type de structure.</p>
      : !section.configured ? <p className="text-sm text-muted-foreground">Ce niveau territorial n’est pas paramétré pour cette fédération.</p>
      : section.items.length === 0 ? <p className="text-sm text-muted-foreground">Ce niveau est paramétré, mais aucun élément n’est encore enregistré.</p>
      : <StructureTable section={section} federationId={federationId} canWrite={canWrite} />}
  </CardContent></Card>)}</div>
}

export function FederationStructureSection(props: { structure?: FederationStructure; loadError?: boolean; federationId: string; canWrite: boolean }) {
  return <div className="space-y-6"><FederationHierarchySummary {...props} /><FederationStructureTables {...props} /></div>
}
