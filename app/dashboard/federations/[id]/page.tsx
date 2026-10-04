import { displayCivilDate } from "@/lib/cnac/model"
import { CnacSourceError } from "@/components/dashboard/cnac-source-error"
import { cnacError } from "@/lib/cnac/errors"
import type { ReactNode } from "react"
import Link from "next/link"
import { ArrowLeft, Building2, ExternalLink, Mail, Pencil, Phone } from "lucide-react"
import { Header } from "@/components/dashboard/header"
import { FederationLogoManager } from "@/components/dashboard/federation-logo-manager"
import { EntityContactsSection } from "@/components/dashboard/entity-contacts-section"
import { FederationHierarchySummary, FederationStructureTables } from "@/components/dashboard/federation-structure-section"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { loadFederationDetail } from "@/lib/federations/detail"
import { loadFederationStructure } from "@/lib/federations/structure"
import type { FederationStructure } from "@/lib/federations/structure-model"
import type { FederationLinkedEntity } from "@/lib/federations/detail-mappers"
import { canAccess } from "@/lib/auth"

export const dynamic = "force-dynamic"

const missing = "Non renseigné"
const shown = (value?: string) => value || missing
const readable = (value?: string) => value ? value.replaceAll("_", " ").toLocaleLowerCase("fr").replace(/^\p{L}/u, (letter) => letter.toLocaleUpperCase("fr")) : missing
const initials = (name: string, sigle: string) => sigle.slice(0, 3).toUpperCase() || name.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase() || "FD"
const websiteUrl = (value: string) => /^https?:\/\//i.test(value) ? value : `https://${value}`

function Field({ label, value, children, className = "" }: { label: string; value?: string; children?: ReactNode; className?: string }) {
  return <div className={`min-w-0 space-y-1 ${className}`}><p className="text-sm text-muted-foreground">{label}</p><div className="break-words font-medium">{children ?? shown(value)}</div></div>
}

function TechnicalStatus({ value }: { value: string }) {
  return <Badge variant="secondary" className={!value ? "text-muted-foreground" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"}>{readable(value)}</Badge>
}

function MinistryStatus({ value }: { value: string }) {
  return <Badge variant="secondary" className={!value ? "text-muted-foreground" : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200"}>{readable(value)}</Badge>
}

function CocStatus({ value }: { value: string }) {
  return <Badge variant="secondary" className={!value ? "text-muted-foreground" : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"}>{readable(value)}</Badge>
}

function EntityTab({ entity, linked, dateLabel, date, emptyLabel }: {
  entity?: FederationLinkedEntity; linked: boolean; dateLabel: string; date: string; contactsAvailable?: boolean; emptyLabel: string
}) {
  if (!linked) return <Empty className="min-h-64"><EmptyHeader><EmptyMedia variant="icon"><Building2 /></EmptyMedia><EmptyTitle>{emptyLabel}</EmptyTitle><EmptyDescription>Aucune fédération n’est liée à cette fédération dans le référentiel.</EmptyDescription></EmptyHeader></Empty>
  if (!entity) return <Empty className="min-h-64"><EmptyHeader><EmptyMedia variant="icon"><Building2 /></EmptyMedia><EmptyTitle>Fédération liée introuvable</EmptyTitle><EmptyDescription>La référence existe dans FEDERATIONS mais ne correspond à aucune ligne de ENTITES.</EmptyDescription></EmptyHeader></Empty>

  return <div className="space-y-6">
    <section aria-labelledby={`${entity.id_entite}-organisation`} className="space-y-4">
      <h3 id={`${entity.id_entite}-organisation`} className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Organisation</h3>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Field label="Nom officiel" value={entity.nom_entite} />
        <Field label="Sigle" value={entity.sigle_entite} />
        <Field label={dateLabel} value={displayCivilDate(date)} />
        <Field label="Adresse du siège" value={entity.adresse_siege} />
        <Field label="Téléphone">{entity.telephone ? <a className="text-primary hover:underline" href={`tel:${entity.telephone}`}><Phone className="mr-1 inline h-4 w-4" aria-hidden="true" />{entity.telephone}</a> : missing}</Field>
        <Field label="E-mail">{entity.email ? <a className="break-all text-primary hover:underline" href={`mailto:${entity.email}`}><Mail className="mr-1 inline h-4 w-4" aria-hidden="true" />{entity.email}</a> : missing}</Field>
        <Field label="Site web" className="md:col-span-2">{entity.site_web ? <a className="break-all text-primary hover:underline" href={websiteUrl(entity.site_web)} target="_blank" rel="noopener noreferrer">{entity.site_web}<ExternalLink className="ml-1 inline h-3.5 w-3.5" aria-hidden="true" /><span className="sr-only"> (ouvre un nouvel onglet)</span></a> : missing}</Field>
      </div>
    </section>
  </div>
}

function NationalCoordinates({ entity }: { entity?: FederationLinkedEntity }) {
  if (!entity) return <p className="text-sm text-muted-foreground">Aucune coordonnée nationale n’est disponible.</p>
  return <div className="grid grid-cols-1 gap-5 md:grid-cols-2"><Field label="Adresse du siège" value={entity.adresse_siege} /><Field label="Téléphone">{entity.telephone ? <a className="break-all text-primary hover:underline" href={`tel:${entity.telephone}`}><Phone className="mr-1 inline h-4 w-4" aria-hidden="true" />{entity.telephone}</a> : missing}</Field><Field label="E-mail">{entity.email ? <a className="break-all text-primary hover:underline" href={`mailto:${entity.email}`}><Mail className="mr-1 inline h-4 w-4" aria-hidden="true" />{entity.email}</a> : missing}</Field><Field label="Site web">{entity.site_web ? <a className="break-all text-primary hover:underline" href={websiteUrl(entity.site_web)} target="_blank" rel="noopener noreferrer">{entity.site_web}<ExternalLink className="ml-1 inline h-3.5 w-3.5" aria-hidden="true" /></a> : missing}</Field></div>
}

async function FederationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let detail
  let canEditLogo = false
  try { [detail, canEditLogo] = await Promise.all([loadFederationDetail(id), canAccess("AUT-SPT", "WRITE")]) } catch (error) {
    return <CnacSourceError message={cnacError(error).message} />
  }
  if (!detail) return <div className="min-h-screen"><Header title="Fédération introuvable" subtitle={id} /><main className="space-y-5 p-4 md:p-6"><Button asChild variant="ghost"><Link href="/dashboard/federations"><ArrowLeft className="mr-2 h-4 w-4" />Retour aux fédérations</Link></Button><Empty className="min-h-64"><EmptyHeader><EmptyMedia variant="icon"><Building2 /></EmptyMedia><EmptyTitle>Fédération indisponible</EmptyTitle><EmptyDescription>Aucune fédération ne correspond à cet identifiant.</EmptyDescription></EmptyHeader></Empty></main></div>

  const federation = detail.federation
  const title = federation.nom_federation || "Fédération"
  let structure: FederationStructure | undefined
  let structureLoadError = false
  try { structure = await loadFederationStructure(id) } catch { structureLoadError = true }
  return <div className="min-h-screen">
    <Header title={title} subtitle={[federation.sigle_federation, federation.nom_sport].filter(Boolean).join(" · ") || undefined} />
    <main className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><Button asChild variant="ghost" size="sm" className="gap-2"><Link href="/dashboard/federations"><ArrowLeft className="h-4 w-4" />Retour aux fédérations</Link></Button>{canEditLogo && <Button asChild size="sm" variant="outline"><Link href={`/dashboard/federations/${encodeURIComponent(id)}/parametres`}><Pencil className="h-4 w-4" />Modifier</Link></Button>}</div>
      <Card className="min-w-0 border-border/50"><Tabs defaultValue="identification" className="w-full"><CardHeader className="pb-0"><div className="grid grid-cols-1 lg:grid-cols-3"><TabsList className="grid h-auto w-full grid-cols-2 lg:col-span-2 lg:col-start-2"><TabsTrigger value="identification">Identification</TabsTrigger><TabsTrigger value="structure">Structure</TabsTrigger></TabsList></div></CardHeader><CardContent className="pt-6">
        <TabsContent value="identification" className="mt-0 min-w-0"><div className="grid min-w-0 grid-cols-1 items-start gap-6 lg:grid-cols-3">
          <section className="min-w-0 self-start rounded-xl border border-border/60 p-5 lg:col-span-1" aria-labelledby="federation-identity-title"><div className="flex flex-col items-center text-center">
            <div className="mb-3"><FederationLogoManager federationId={federation.id_federation} federationName={title} initials={initials(title, federation.sigle_federation)} initialUrl={federation.logo_drive_url} canEdit={false} /></div>
            <h2 id="federation-identity-title" className="break-words text-xl font-semibold">{shown(federation.nom_federation)}</h2><p className="text-muted-foreground">{shown(federation.sigle_federation)}</p><div className="mt-3"><TechnicalStatus value={federation.statut} /></div>
            <div className="mt-5 w-full space-y-3 text-sm"><div className="flex min-w-0 justify-between gap-3"><span className="text-muted-foreground">Identifiant</span><span className="break-all text-right font-mono text-xs font-medium">{shown(federation.id_federation)}</span></div><div className="flex min-w-0 justify-between gap-3"><span className="text-muted-foreground">Sport</span><span className="break-words text-right font-medium">{shown(federation.nom_sport)}</span></div></div>
          </div></section>
          <section className="min-w-0 space-y-5 lg:col-span-2" aria-labelledby="recognition-title"><h3 id="recognition-title" className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Reconnaissance nationale</h3><div className="grid grid-cols-1 gap-5 md:grid-cols-2"><Field label="Catégorie de la fédération" value={federation.categorie_entite} /><Field label="Reconnaissance ministérielle"><MinistryStatus value={federation.statut_reconnaissance_ministere} /></Field><Field label="Date de reconnaissance nationale" value={displayCivilDate(federation.date_reconnaissance_nationale)} /><Field label="Affiliation au COC"><CocStatus value={federation.statut_affiliation_coc} /></Field><Field label="Date d’affiliation au COC" value={displayCivilDate(federation.date_affiliation_coc)} /><Field label="Observations" value={federation.observations} className="md:col-span-2" /></div></section>
          <section className="min-w-0 space-y-4 border-t border-border pt-6 lg:col-span-3" aria-labelledby="national-entity-title"><h3 id="national-entity-title" className="text-lg font-semibold">Coordonnées</h3><NationalCoordinates entity={detail.national} /></section>
          <div className="min-w-0 border-t border-border pt-6 lg:col-span-3"><EntityContactsSection entityId={federation.id_entite} canWrite={false} /></div>
          <section className="min-w-0 space-y-4 border-t border-border pt-6 lg:col-span-3" aria-labelledby="continental-entity-title"><h3 id="continental-entity-title" className="text-lg font-semibold">Rattachement continental</h3><EntityTab entity={detail.continental} linked={Boolean(federation.id_entite_continentale)} dateLabel="Date d’affiliation continentale" date={federation.date_affiliation_continentale} contactsAvailable={detail.contactsAvailable} emptyLabel="Aucune confédération continentale liée" /></section>
          <section className="min-w-0 space-y-4 border-t border-border pt-6 lg:col-span-3" aria-labelledby="international-entity-title"><h3 id="international-entity-title" className="text-lg font-semibold">Rattachement international</h3><EntityTab entity={detail.international} linked={Boolean(federation.id_entite_internationale)} dateLabel="Date d’affiliation internationale" date={federation.date_affiliation_internationale} contactsAvailable={detail.contactsAvailable} emptyLabel="Aucune fédération internationale liée" /></section>
        </div></TabsContent>
        <TabsContent value="structure" className="mt-0 min-w-0"><div className="grid min-w-0 grid-cols-1 items-start gap-6 lg:grid-cols-3">
          <section className="min-w-0 self-start rounded-xl border border-border/60 p-5 lg:col-span-1" aria-labelledby="federation-structure-identity-title"><div className="flex flex-col items-center text-center">
            <div className="mb-3"><FederationLogoManager federationId={federation.id_federation} federationName={title} initials={initials(title, federation.sigle_federation)} initialUrl={federation.logo_drive_url} canEdit={false} /></div>
            <h2 id="federation-structure-identity-title" className="break-words text-xl font-semibold">{shown(federation.nom_federation)}</h2><p className="text-muted-foreground">{shown(federation.sigle_federation)}</p><div className="mt-3"><TechnicalStatus value={federation.statut} /></div>
            <div className="mt-5 w-full space-y-3 text-sm"><div className="flex min-w-0 justify-between gap-3"><span className="text-muted-foreground">Identifiant</span><span className="break-all text-right font-mono text-xs font-medium">{shown(federation.id_federation)}</span></div><div className="flex min-w-0 justify-between gap-3"><span className="text-muted-foreground">Sport</span><span className="break-words text-right font-medium">{shown(federation.nom_sport)}</span></div></div>
          </div></section>
          <div className="min-w-0 lg:col-span-2"><FederationHierarchySummary structure={structure} loadError={structureLoadError} /></div>
          <div className="min-w-0 lg:col-span-3"><FederationStructureTables structure={structure} loadError={structureLoadError} federationId={id} canWrite={canEditLogo} /></div>
        </div></TabsContent>
      </CardContent></Tabs></Card>
    </main>
  </div>
}

export default async function ConnectedPage(props: Parameters<typeof FederationDetailPage>[0]) {
  try { return await FederationDetailPage(props) } catch(error) {
    if(error && typeof error === "object" && "digest" in error && String(error.digest).startsWith("NEXT_")) throw error
    return <CnacSourceError message={cnacError(error).message} />
  }
}
