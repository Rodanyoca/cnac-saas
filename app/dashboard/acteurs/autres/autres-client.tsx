"use client"

import Link from "next/link"
import { Eye, Plus, Search } from "lucide-react"
import { useMemo, useState } from "react"
import { Header } from "@/components/dashboard/header"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { OtherActorReferences, OtherActorView } from "@/lib/acteurs/autres-model"
import { emptyOtherActorForm } from "@/components/dashboard/other-actor-form"
import { OtherActorEditor } from "./other-actor-editor"

const ALL = "__all__"
const PAGE_SIZE = 20
const affiliation = (actor: OtherActorView) => actor.federationSigle || actor.entiteSigle || actor.federationNom || actor.entiteNom || "Non renseigné"
const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0] || "").join("").toUpperCase() || "AA"

export default function AutresClient({ actors, references, canWrite, loadError = false }: { actors: OtherActorView[]; references: OtherActorReferences; canWrite: boolean; loadError?: boolean }) {
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState(ALL)
  const [entity, setEntity] = useState(ALL)
  const [functionName, setFunctionName] = useState(ALL)
  const [page, setPage] = useState(1)
  const filtered = useMemo(() => actors.filter((actor) => {
    const needle = query.trim().toLocaleLowerCase("fr")
    const matchesQuery = !needle || [actor.nom_complet, actor.type_autre_acteur, actor.entiteNom, actor.entiteSigle, actor.federationNom, actor.federationSigle, actor.telephone, actor.email].some((value) => value.toLocaleLowerCase("fr").includes(needle))
    return matchesQuery && (status === ALL || actor.statut === status) && (entity === ALL || actor.id_entite === entity) && (functionName === ALL || actor.type_autre_acteur === functionName)
  }), [actors, entity, functionName, query, status])
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  return <div className="min-h-screen min-w-0 overflow-x-hidden"><Header title="Autres acteurs" subtitle="Responsables, contacts, partenaires et représentants d’entités" />
    <main className="min-w-0 space-y-5 p-4 md:p-6">
      {loadError && <Alert variant="destructive"><AlertTitle>Données indisponibles</AlertTitle><AlertDescription>La feuille AUTRES n’a pas pu être chargée. Réessayez plus tard.</AlertDescription></Alert>}
      <div className="flex min-w-0 flex-col gap-3 xl:flex-row xl:items-center"><div className="relative min-w-0 flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Rechercher par nom, fonction, entité ou fédération…" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} /></div><div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-3">
        <Filter value={functionName} onChange={(value) => { setFunctionName(value); setPage(1) }} placeholder="Toutes les fonctions" options={references.functions.map((item) => [item, item])} />
        <Filter value={entity} onChange={(value) => { setEntity(value); setPage(1) }} placeholder="Toutes les entités" options={references.entities.map((item) => [item.id, item.acronym || item.name])} />
        <Filter value={status} onChange={(value) => { setStatus(value); setPage(1) }} placeholder="Tous les statuts" options={references.statuses.map((item) => [item, item.replaceAll("_", " ")])} />
      </div>{canWrite && <OtherActorEditor presentation="sheet" initialValue={emptyOtherActorForm} references={references} trigger={<Button><Plus className="h-4 w-4" />Ajouter un autre acteur</Button>} />}</div>
      <Card className="min-w-0 overflow-hidden"><CardContent className="p-0"><div className="hidden lg:block"><Table><TableHeader><TableRow><TableHead>Identité</TableHead><TableHead>Fonction / qualité</TableHead><TableHead>Rattachement</TableHead><TableHead>Téléphone</TableHead><TableHead>Adresse électronique</TableHead><TableHead>Statut</TableHead><TableHead className="w-16 text-right">Action</TableHead></TableRow></TableHeader><TableBody>{visible.map((actor) => <TableRow key={actor.id_autre_acteur_coc}><TableCell className="max-w-60 whitespace-normal"><div className="flex items-center gap-3"><ActorAvatar actor={actor} /><span className="font-medium">{actor.nom_complet || "Non renseigné"}</span></div></TableCell><TableCell className="max-w-48 whitespace-normal">{actor.type_autre_acteur || "Non renseigné"}</TableCell><TableCell className="max-w-52 whitespace-normal">{affiliation(actor)}</TableCell><TableCell>{actor.telephone || "—"}</TableCell><TableCell className="max-w-56 break-all whitespace-normal">{actor.email || "—"}</TableCell><TableCell><Badge variant="secondary">{actor.statut || "Non renseigné"}</Badge></TableCell><TableCell className="text-right"><DetailLink actor={actor} /></TableCell></TableRow>)}{!visible.length && <TableRow><TableCell colSpan={7} className="h-28 text-center text-muted-foreground">{actors.length ? "Aucun résultat pour ces critères." : "Aucun autre acteur enregistré."}</TableCell></TableRow>}</TableBody></Table></div>
        <div className="grid min-w-0 gap-3 p-3 sm:grid-cols-2 lg:hidden">{visible.map((actor) => <article key={actor.id_autre_acteur_coc} className="min-w-0 rounded-lg border p-4"><div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><ActorAvatar actor={actor} /><div className="min-w-0"><h2 className="break-words font-semibold">{actor.nom_complet || "Non renseigné"}</h2><p className="break-words text-sm text-muted-foreground">{actor.type_autre_acteur || "Fonction non renseignée"}</p></div></div><DetailLink actor={actor} /></div><div className="mt-3 space-y-1 text-sm"><p className="break-words"><span className="text-muted-foreground">Rattachement : </span>{affiliation(actor)}</p>{actor.telephone && <p className="break-all">{actor.telephone}</p>}{actor.email && <p className="break-all">{actor.email}</p>}<Badge variant="secondary" className="mt-2">{actor.statut || "Non renseigné"}</Badge></div></article>)}{!visible.length && <p className="py-10 text-center text-sm text-muted-foreground sm:col-span-2">{actors.length ? "Aucun résultat pour ces critères." : "Aucun autre acteur enregistré."}</p>}</div>
      </CardContent></Card><div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground"><p>Affichage de {filtered.length} sur {actors.length}</p>{pageCount > 1 && <div className="flex items-center gap-2"><Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setPage((value) => value - 1)}>Précédent</Button><span>Page {currentPage} sur {pageCount}</span><Button variant="outline" size="sm" disabled={currentPage === pageCount} onClick={() => setPage((value) => value + 1)}>Suivant</Button></div>}</div>
    </main>
  </div>
}

function Filter({ value, onChange, placeholder, options }: { value: string; onChange: (value: string) => void; placeholder: string; options: string[][] }) { return <Select value={value} onValueChange={onChange}><SelectTrigger className="w-full min-w-0 xl:w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value={ALL}>{placeholder}</SelectItem>{options.map(([id, label]) => <SelectItem key={id} value={id}>{label}</SelectItem>)}</SelectContent></Select> }
function ActorAvatar({ actor }: { actor: OtherActorView }) { return <Avatar className="h-10 w-10 shrink-0"><AvatarImage src={actor.avatar_drive_url || undefined} alt={actor.nom_complet || "Autre acteur"} referrerPolicy="no-referrer" /><AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">{initials(actor.nom_complet)}</AvatarFallback></Avatar> }
function DetailLink({ actor }: { actor: OtherActorView }) { return <Button asChild variant="ghost" size="icon"><Link href={`/dashboard/acteurs/autres/${encodeURIComponent(actor.id_autre_acteur_coc)}`} aria-label={`Voir la fiche de ${actor.nom_complet}`} title="Voir la fiche"><Eye className="h-4 w-4" /></Link></Button> }
