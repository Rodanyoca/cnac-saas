import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Building2 } from "lucide-react"
import { Header } from "@/components/dashboard/header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { loadFederationData } from "@/lib/federations/data"
import { buildFederationStructure } from "@/lib/federations/structure-model"

export const dynamic = "force-dynamic"

function DetailField({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0 space-y-1"><p className="text-sm text-muted-foreground">{label}</p><p className="break-words font-medium">{value || "—"}</p></div>
}

function structureHref(federationId: string, typeId: string, structureId: string) {
  return `/dashboard/federations/${encodeURIComponent(federationId)}/structures/${encodeURIComponent(typeId)}/${encodeURIComponent(structureId)}`
}

export default async function StructureDetailPage({ params }: { params: Promise<{ id: string; typeId: string; structureId: string }> }) {
  const { id, typeId, structureId } = await params
  const data = await loadFederationData({ connected: true })
  const federation = data.federations.find((item) => item.id_federation === id)
  if (!federation) notFound()
  const structure = buildFederationStructure(data, id)
  const sectionIndex = structure.sections.findIndex((item) => item.typeId === typeId)
  if (sectionIndex < 0) notFound()
  const section = structure.sections[sectionIndex]
  const item = section.items.find((candidate) => candidate.id === structureId)
  if (!item) notFound()
  const category = item.resource === "equipes" ? item.record.nom_categorie_age || "Non renseignée" : undefined

  const allItems = structure.sections.flatMap((current) => current.items.map((entity) => ({ section: current, entity })))
  const parent = item.parentId ? allItems.find(({ entity }) => entity.id === item.parentId) : undefined
  const childSection = structure.sections[sectionIndex + 1]
  const children = childSection?.items.filter((entity) => entity.parentId === item.id) || []
  const observations = item.record.observations || item.record.observation || ""

  return <div className="min-h-screen">
    <Header title={item.name || section.label} subtitle={`${section.label} · ${federation.nom_federation}`} />
    <main className="space-y-5 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm"><Link href={`/dashboard/federations/${encodeURIComponent(id)}`}><ArrowLeft className="h-4 w-4" />Retour à la fédération</Link></Button>
        <Button asChild variant="outline" size="sm"><Link href={`/dashboard/federations/${encodeURIComponent(id)}/parametres?tab=elements`}><Building2 className="h-4 w-4" />Structures</Link></Button>
      </div>
      <Card className="min-w-0 border-border/70">
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div className="min-w-0"><CardTitle className="break-words">{item.name || section.label}</CardTitle><p className="mt-1 break-all font-mono text-xs text-muted-foreground">{item.id}</p></div>
          {item.status && <Badge variant="outline">{item.status.replaceAll("_", " ")}</Badge>}
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <DetailField label="Type de structure" value={section.label} />
          <DetailField label="Nom" value={item.name} />
          <DetailField label="Identifiant fédéral" value={item.federalId} />
          <DetailField label="Sigle / pseudo" value={item.alias} />
          <DetailField label="Téléphone" value={item.phone} />
          <DetailField label="E-mail" value={item.email} />
          <DetailField label="Statut" value={item.status} />
          <DetailField label="Observations" value={observations} />
        </CardContent>
      </Card>

      {category && <Card className="min-w-0 border-border/70"><CardHeader><CardTitle className="text-base">Catégorie équipe</CardTitle></CardHeader><CardContent><p className="font-medium">{category}</p></CardContent></Card>}
      {item.parentId && <Card className="min-w-0 border-border/70">
        <CardHeader><CardTitle className="text-base">Parent direct</CardTitle></CardHeader>
        <CardContent>{parent ? <Link className="font-medium text-primary hover:underline" href={structureHref(id, parent.section.typeId, parent.entity.id)}>{parent.entity.name || parent.entity.id}</Link> : <p className="text-sm text-destructive">Parent introuvable : {item.parentId}</p>}</CardContent>
      </Card>}

      {childSection && <Card className="min-w-0 border-border/70">
        <CardHeader className="flex flex-row items-center justify-between gap-3"><CardTitle className="text-base">{childSection.label} rattachés</CardTitle><Badge variant="secondary">{children.length}</Badge></CardHeader>
        <CardContent>{children.length ? <ul className="divide-y">{children.map((child) => <li key={child.id} className="py-3 first:pt-0 last:pb-0"><Link className="font-medium text-primary hover:underline" href={structureHref(id, childSection.typeId, child.id)}>{child.name || child.id}</Link><p className="mt-1 break-all font-mono text-xs text-muted-foreground">{child.id}</p></li>)}</ul> : <p className="text-sm text-muted-foreground">Aucun élément de type {childSection.label.toLocaleLowerCase("fr")} n’est encore rattaché à cette structure.</p>}</CardContent>
      </Card>}
    </main>
  </div>
}
