"use client"
import { TeamSportingFields } from "@/components/dashboard/team-sporting-fields"
import { trainingPatch, trainingFields } from "@/lib/cnac/team-training"
import { parentKind, territorialEditorRow, type TerritorialKind } from "@/lib/cnac/territorial-model"
import { buildFederationStructure } from "@/lib/federations/structure-model"

import { apiFetch } from "@/lib/api/client"

import { useRef, useState } from "react"
import { ImageSelection } from "@/components/dashboard/image-selection"
import { confirmedSave } from "@/lib/api/confirmed-save"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AlertCircle, ArrowLeft, CheckCircle2, Eye, MinusCircle, Pencil, Plus } from "lucide-react"
import { Header } from "@/components/dashboard/header"
import { FederationLogoManager } from "@/components/dashboard/federation-logo-manager"
import { EntityContactsSection } from "@/components/dashboard/entity-contacts-section"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { FederationData } from "@/lib/federations/types"

type Resource = "identification" | "hierarchie" | "zones" | "ligues" | "ententes" | "cercles" | "clubs" | "equipes"
type Editor = { resource: Resource; id?: string; row: Record<string, string> } | null
type Feedback = { type: "success" | "error"; text: string } | null

export default function ParametresClient({ data, federationId, logoAvailable = false, initialEditor }: { data: FederationData; federationId: string; logoAvailable?: boolean; initialEditor?: { resource: string; id?: string; row: Record<string, string> } }) {
  const router = useRouter()
  const federation = data.federations.find((item) => item.id_federation === federationId)!
  const hierarchie = data.hierarchie.filter((item) => item.id_federation === federationId)
  const structureSections = buildFederationStructure(data, federationId).sections
  const typeName = (id: string) => data.typesStructure.find((item) => item.id_type_structure === id)?.nom_structure || id
  const orderedHierarchy = [...hierarchie].sort((a, b) => Number(a.niveau) - Number(b.niveau))
  const categories = data.categoriesClub.filter((item) => !item.id_federation || item.id_federation === federationId)
  const [editor, setEditor] = useState<Editor>(() => initialEditor ? { ...initialEditor, resource: initialEditor.resource as Resource, row: territorialEditorRow(initialEditor.resource, initialEditor.row) } : null)
  const ticket = useRef("")
  const [pendingSave, setPendingSave] = useState(false)
  const [logo, setLogo] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<Feedback>(null)

  const open = (resource: Resource, row: Record<string, string> = {}) => {
    setFeedback(null); setLogo(null); ticket.current = ""
    setEditor({ resource, id: row[idColumn(resource)] || undefined, row: { ...territorialEditorRow(resource, row), id_structure_parent_coc: row.directParentId || row.id_structure_parent_coc || "", id_federation: federationId, ...(resource === "hierarchie" ? {} : { statut: row.statut || "ACTIF" }) } })
  }
  const update = (key: string, value: string) => setEditor((current) => current ? ({ ...current, row: { ...current.row, [key]: value } }) : null)
  async function save() {
    if (!editor) return
    const validationError = validateEditor(editor, data)
    if (validationError) return setFeedback({ type: "error", text: validationError })
    setSaving(true); setFeedback(null)
    try {
      const row = territorialEditorRow(editor.resource, editor.row)
      if (editor.resource === "identification") {
        await confirmedSave("/api/federations/identification", "PUT", { id: editor.id, row }, logo, "logo", ticket)
      } else {
      const response = await apiFetch(`/api/federations/${editor.resource}`, { method: editor.id ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editor.id ? { id: editor.id, row } : { row }) })
      const result = await response.json().catch(() => ({})) as { error?: string }
      if (!response.ok) return setFeedback({ type: "error", text: result.error || "L’enregistrement a échoué. Vérifiez les informations saisies." })
      }
      setEditor(null); setFeedback({ type: "success", text: `${label(editor.resource)} : enregistrement effectué avec succès.` }); router.refresh()
    } catch {
      setFeedback({ type: "error", text: "Impossible de joindre le serveur. Vérifiez votre connexion puis réessayez." })
    } finally {
      setPendingSave(Boolean(ticket.current))
      setSaving(false)
    }
  }
  async function disableHierarchy(id: string) {
    if (!window.confirm("Désactiver ce niveau ? Les éléments existants ne seront ni supprimés ni déplacés.")) return
    const response = await apiFetch("/api/federations/hierarchie", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, federationId }) })
    const result = await response.json().catch(() => ({})) as { error?: string }
    setFeedback(response.ok ? { type: "success", text: "Niveau désactivé. Les éléments existants ont été conservés." } : { type: "error", text: result.error || "Impossible de désactiver ce niveau." })
    if (response.ok) router.refresh()
  }

  return <div className="min-h-screen">
    <Header title="Paramétrage territorial" subtitle={`${federation.nom_federation} · ${federation.sigle_federation || federation.id_federation}`} />
    <main className="space-y-5 p-4 md:p-6">
      <Card><CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-semibold">{federation.nom_federation}</h2>{federation.sigle_federation && <Badge variant="secondary">{federation.sigle_federation}</Badge>}</div><p className="text-sm text-muted-foreground">{federation.nom_sport} · ID fédération : {federation.id_federation}</p></div><Button asChild variant="outline"><Link href="/dashboard/federations"><ArrowLeft className="h-4 w-4" />Retour vers Fédérations</Link></Button></CardContent></Card>
      {feedback && !editor && <FeedbackAlert feedback={feedback} />}
      <Tabs defaultValue={initialEditor ? "elements" : "identification"} className="space-y-4"><TabsList className="grid h-auto w-full grid-cols-1 sm:grid-cols-3"><TabsTrigger value="identification">Identification et logo</TabsTrigger><TabsTrigger value="hierarchie">Hiérarchie territoriale</TabsTrigger><TabsTrigger value="elements">Éléments de la structure</TabsTrigger></TabsList>
        <TabsContent value="identification" className="space-y-4"><Card><CardHeader><CardTitle>Identification et logo</CardTitle></CardHeader><CardContent className="grid gap-6 md:grid-cols-[auto_1fr] md:items-center"><FederationLogoManager key={federation.logo_drive_url} federationId={federation.id_federation} federationName={federation.nom_federation} initials={(federation.sigle_federation || federation.nom_federation).slice(0, 3).toUpperCase()} initialUrl={federation.logo_drive_url} canEdit={logoAvailable} /><div className="space-y-3"><p className="text-sm text-muted-foreground">Modifiez les statuts, dates et rattachements prévus dans la fiche Fédération.</p><Button onClick={() => open("identification", federation as unknown as Record<string, string>)}><Pencil className="h-4 w-4" />Modifier l’identification</Button></div></CardContent></Card><Card><CardContent className="pt-6"><EntityContactsSection entityId={federation.id_entite} canWrite /></CardContent></Card></TabsContent>
        <TabsContent value="hierarchie" className="space-y-4"><div className="rounded-lg border bg-muted/20 p-4"><p className="mb-2 text-sm font-medium text-muted-foreground">Aperçu immédiat</p><p className="break-words font-semibold">{["Fédération", ...orderedHierarchy.map((row) => row.nom_structure || typeName(row.id_type_structure))].join(" → ")}</p></div><ResourceCard title="Niveaux de structure" onAdd={() => open("hierarchie")} headers={["Niveau", "Structure", "Observations"]} rows={orderedHierarchy.map((row) => ({ key: row.id_hierarchie, cells: [row.niveau, row.nom_structure || typeName(row.id_type_structure), row.observations], edit: () => open("hierarchie", row as unknown as Record<string, string>), disable: () => disableHierarchy(row.id_hierarchie) }))} /></TabsContent>
        <TabsContent value="elements" className="space-y-6">
          {structureSections.map((section) => {
            const resource = section.supported ? section.key as Resource : undefined
            return <ResourceCard key={section.key} title={section.label} onAdd={resource ? () => open(resource) : undefined} unsupportedMessage={!section.supported ? `Aucun stockage CNAC n’est associé au type « ${typeName(section.typeId)} ».` : undefined} headers={["ID CNAC", "ID fédéral", "Nom", "Sigle", "Statut"]} rows={section.items.map((item) => ({ key: item.id, cells: [item.id, item.federalId, item.name, item.alias, item.status], edit: resource ? () => open(resource, item.record) : undefined, detailHref: `/dashboard/federations/${encodeURIComponent(federationId)}/structures/${encodeURIComponent(item.typeId)}/${encodeURIComponent(item.id)}` }))} />
          })}
        </TabsContent>
      </Tabs>
    </main>
    <Dialog open={Boolean(editor)} onOpenChange={(openState) => { if (!openState) { if (saving || ticket.current) return; setEditor(null); setFeedback(null); if (initialEditor) router.replace(`/dashboard/federations/${encodeURIComponent(federationId)}/parametres`) } }}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl"><DialogHeader><DialogTitle>{editor?.id ? "Modifier" : "Ajouter"} {editor ? label(editor.resource).toLowerCase() : ""}</DialogTitle><DialogDescription>L’identifiant CNAC est généré automatiquement et reste immuable.</DialogDescription></DialogHeader>{editor && <fieldset disabled={saving || (editor.resource === "identification" && pendingSave)} className="min-w-0 space-y-4"><EditorFields editor={editor} update={update} data={data} categories={categories} />{editor.resource === "identification" && <ImageSelection label="Logo" file={logo} onChange={setLogo} existingUrl={federation.logo_drive_url} disabled={saving || pendingSave || !logoAvailable} />}</fieldset>}{feedback && editor && <FeedbackAlert feedback={feedback} />}<DialogFooter><Button variant="outline" disabled={saving || pendingSave} onClick={() => { setEditor(null); setFeedback(null); if (initialEditor) router.replace(`/dashboard/federations/${encodeURIComponent(federationId)}/parametres`) }}>Annuler</Button><Button onClick={save} disabled={saving}>{saving ? "Enregistrement…" : "Enregistrer"}</Button></DialogFooter></DialogContent></Dialog>
  </div>
}

function ResourceCard({ title, onAdd, headers, rows, unsupportedMessage }: { title: string; onAdd?: () => void; headers: string[]; rows: { key: string; cells: string[]; edit?: () => void; detailHref?: string; disable?: () => void }[]; unsupportedMessage?: string }) {
  return <Card><CardHeader className="flex-row items-center justify-between"><CardTitle>{title}</CardTitle>{onAdd && <Button size="sm" onClick={onAdd}><Plus className="h-4 w-4" />Ajouter</Button>}</CardHeader><CardContent>{unsupportedMessage ? <p className="text-sm text-muted-foreground">{unsupportedMessage}</p> : <><div className="hidden md:block"><Table><TableHeader><TableRow>{headers.map((header) => <TableHead key={header}>{header}</TableHead>)}<TableHead className="w-24">Actions</TableHead></TableRow></TableHeader><TableBody>{rows.map((row) => <TableRow key={row.key}>{row.cells.map((cell, index) => <TableCell className="whitespace-normal" key={index}>{cell || "—"}</TableCell>)}<TableCell><div className="flex">{row.detailHref && <Button asChild variant="ghost" size="icon-sm"><Link href={row.detailHref} aria-label={`Détails de ${row.cells[2]}`}><Eye className="h-4 w-4" /></Link></Button>}{row.edit && <Button variant="ghost" size="icon-sm" onClick={row.edit} aria-label="Modifier"><Pencil className="h-4 w-4" /></Button>}{row.disable && <Button variant="ghost" size="icon-sm" onClick={row.disable} aria-label="Désactiver"><MinusCircle className="h-4 w-4" /></Button>}</div></TableCell></TableRow>)}{!rows.length && <TableRow><TableCell colSpan={headers.length + 1} className="h-24 text-center text-muted-foreground">Aucun enregistrement.</TableCell></TableRow>}</TableBody></Table></div><div className="grid gap-3 md:hidden">{rows.map((row) => <div key={`mobile-${row.key}`} className="rounded-lg border p-4"><dl className="space-y-2">{row.cells.map((cell, index) => <div key={headers[index]}><dt className="text-xs text-muted-foreground">{headers[index]}</dt><dd className="break-words text-sm font-medium">{cell || "—"}</dd></div>)}</dl><div className="mt-3 flex justify-end">{row.detailHref && <Button asChild variant="ghost" size="sm"><Link href={row.detailHref}><Eye className="h-4 w-4" />Détails</Link></Button>}{row.edit && <Button variant="ghost" size="sm" onClick={row.edit}><Pencil className="h-4 w-4" />Modifier</Button>}{row.disable && <Button variant="ghost" size="sm" onClick={row.disable}><MinusCircle className="h-4 w-4" />Désactiver</Button>}</div></div>)}{!rows.length && <p className="py-8 text-center text-sm text-muted-foreground">Aucun enregistrement.</p>}</div></>}</CardContent></Card>
}

function EditorFields({ editor, update, data, categories }: { editor: NonNullable<Editor>; update: (key: string, value: string) => void; data: FederationData; categories: FederationData["categoriesClub"] }) {
  const row = editor.row
  const parent = configuredParent(editor.resource, data, row.id_federation)
  if (editor.resource === "equipes") return <div className="grid gap-4 sm:grid-cols-2">
    {editor.id && <Field label="ID CNAC" value={editor.id} disabled onChange={() => {}} />}
    <Field label="ID fédéral (facultatif)" value={row.id_equipe_federation} onChange={value => update("id_equipe_federation", value)} />
    <TeamSportingFields key={editor.id || "new-team"} row={row} update={update} />
  </div>
  if (editor.resource === "identification") return <div className="grid gap-4 sm:grid-cols-2"><Choice label="Reconnaissance ministérielle" value={row.statut_reconnaissance_ministere} onChange={(v) => update("statut_reconnaissance_ministere", v)} options={[["RECONNUE", "Reconnue"], ["NON_RECONNUE", "Non reconnue"], ["EN_ATTENTE", "En attente"]]} /><Field label="Date de reconnaissance nationale" type="date" value={row.date_reconnaissance_nationale} onChange={(v) => update("date_reconnaissance_nationale", v)} /><Choice label="Affiliation au COC" value={row.statut_affiliation_coc} onChange={(v) => update("statut_affiliation_coc", v)} options={[["AFFILIEE", "Affiliée"], ["NON_AFFILIEE", "Non affiliée"], ["SUSPENDUE", "Suspendue"]]} /><Field label="Date d’affiliation au COC" type="date" value={row.date_affiliation_coc} onChange={(v) => update("date_affiliation_coc", v)} /><Field label="ID fédération continentale" value={row.id_entite_continentale} onChange={(v) => update("id_entite_continentale", v)} /><Field label="Date d’affiliation continentale" type="date" value={row.date_affiliation_continentale} onChange={(v) => update("date_affiliation_continentale", v)} /><Field label="ID fédération internationale" value={row.id_entite_internationale} onChange={(v) => update("id_entite_internationale", v)} /><Field label="Date d’affiliation internationale" type="date" value={row.date_affiliation_internationale} onChange={(v) => update("date_affiliation_internationale", v)} /><Choice label="Statut" value={row.statut} onChange={(v) => update("statut", v)} options={[["ACTIF", "Actif"], ["INACTIF", "Inactif"]]} /><div className="sm:col-span-2"><Field label="Observations" value={row.observations} onChange={(v) => update("observations", v)} /></div></div>
  if (editor.resource === "hierarchie") return <div className="grid gap-4 sm:grid-cols-2"><Choice label="Structure" required value={row.id_type_structure} onChange={(v) => update("id_type_structure", v)} options={data.typesStructure.map((item) => [item.id_type_structure, item.nom_structure])} /><Field label="Niveau" required type="number" value={row.niveau} onChange={(v) => update("niveau", v)} /><div className="sm:col-span-2"><Field label="Observations (facultatif)" value={row.observations} onChange={(v) => update("observations", v)} /></div></div>
  if (editor.resource === "zones") return <div className="grid gap-4 sm:grid-cols-2"><Field label="Nom de la zone" required value={row.nom_zone} onChange={(v) => update("nom_zone", v)} /><Field label="Sigle (facultatif)" value={row.sigle_zone} onChange={(v) => update("sigle_zone", v)} /><Field label="Identifiant fédéral (facultatif)" value={row.id_zone_federation} onChange={(v) => update("id_zone_federation", v)} /><Choice label="Statut" value={row.statut} onChange={(v) => update("statut", v)} options={[["ACTIF", "Actif"], ["INACTIF", "Inactif"]]} /><div className="sm:col-span-2"><Field label="Observations" value={row.observations} onChange={(v) => update("observations", v)} /></div></div>
  return <div className="grid gap-4 sm:grid-cols-2">{editor.id && <Field label="ID CNAC" value={editor.id} disabled onChange={() => {}} />}
    {parent.error ? <p className="text-sm text-destructive sm:col-span-2">{parent.error}</p> : parent.kind && <Choice label={`${label(parent.kind)} parent`} required value={row.id_structure_parent_coc} onChange={value=>update("id_structure_parent_coc",value)} options={data[parent.kind].filter(item=>item.id_federation===row.id_federation).map(item=>[String(item[idColumn(parent.kind!) as keyof typeof item]), String(item[`nom_${parent.kind!.slice(0,-1)}` as keyof typeof item]||"")])} />}
    {editor.resource === "ligues" && <><Field label="Nom de la ligue" required value={row.nom_ligue} onChange={(v) => update("nom_ligue", v)} /><Field label="Pseudo (facultatif)" value={row.pseudo_ligue} onChange={(v) => update("pseudo_ligue", v)} /><Field label="ID fédéral (facultatif)" value={row.id_ligue_federation || row.id_ligue_federal} onChange={(v) => update("id_ligue_federal", v)} /><Choice label="Province" required value={row.id_province} onChange={(v) => update("id_province", v)} options={data.provinces.map((item) => [item.id_province, item.nom_province])} /><div className="sm:col-span-2"><Field label="E-mail de la ligue (facultatif)" type="email" value={row.email_ligue} onChange={(v) => update("email_ligue", v)} /></div></>}
    {editor.resource === "ententes" && <><RequiredHint /><Field label="Nom de l’entente" required value={row.nom_entente} onChange={(v) => update("nom_entente", v)} /><Field label="Pseudo (facultatif)" value={row.pseudo_entente} onChange={(v) => update("pseudo_entente", v)} /><Field label="ID fédéral (facultatif)" value={row.id_entente_federation} onChange={(v) => update("id_entente_federation", v)} /><Choice label="Ville (facultatif)" clearable value={row.id_ville} onChange={(v) => update("id_ville", v)} options={data.villes.map((item) => [item.id_ville, item.nom_ville])} /><Field label="E-mail (facultatif)" type="email" value={row.email_entente} onChange={(v) => update("email_entente", v)} /></>}
    {editor.resource === "cercles" && <><Field label="Nom du cercle" required value={row.nom_cercle} onChange={(v) => update("nom_cercle", v)} /><Field label="ID fédéral (facultatif)" value={row.id_cercle_federation} onChange={(v) => update("id_cercle_federation", v)} /><Field label="Sigle (facultatif)" value={row.pseudo_cercle || row.sigle_cercle} onChange={(v) => update("pseudo_cercle", v)} /><Choice label="Ville (facultatif)" clearable value={row.id_ville} onChange={(v) => update("id_ville", v)} options={data.villes.map((item) => [item.id_ville, item.nom_ville])} /><Field label="Téléphone (facultatif)" value={row.telephone_cercle} onChange={(v) => update("telephone_cercle", v)} /><Field label="E-mail (facultatif)" type="email" value={row.email_cercle} onChange={(v) => update("email_cercle", v)} /></>}
    {editor.resource === "clubs" && <><Field label="Nom du club" required value={row.nom_club} onChange={(v) => update("nom_club", v)} /><Field label="ID fédéral (facultatif)" value={row.id_club_federation} onChange={(v) => update("id_club_federation", v)} /><Choice label="Ville (facultatif)" clearable value={row.id_ville} onChange={(v) => update("id_ville", v)} options={data.villes.map((item) => [item.id_ville, item.nom_ville])} /><Choice label="Catégorie (facultatif)" clearable value={row.id_categorie} onChange={(v) => update("id_categorie", v)} options={categories.map((item) => [item.id_categorie, item.nom_categorie])} /></>}
    <Choice label="Statut" value={row.statut} onChange={(v) => update("statut", v)} options={[["ACTIF", "Actif"], ["INACTIF", "Inactif"]]} />
  </div>
}

function Field({ label, value = "", onChange, disabled, type = "text", required = false }: { label: string; value?: string; onChange: (value: string) => void; disabled?: boolean; type?: string; required?: boolean }) { return <div className="space-y-2"><Label>{label}{required && <span className="text-destructive"> *</span>}</Label><Input type={type} value={value} disabled={disabled} required={required} onChange={(event) => onChange(event.target.value)} /></div> }
function Choice({ label, value = "", onChange, options, required = false, clearable = false }: { label: string; value?: string; onChange: (value: string) => void; options: string[][]; required?: boolean; clearable?: boolean }) { return <div className="space-y-2"><Label>{label}{required && <span className="text-destructive"> *</span>}</Label><Select value={value || (clearable ? "__none__" : "")} onValueChange={(next) => onChange(next === "__none__" ? "" : next)} required={required}><SelectTrigger className="w-full"><SelectValue placeholder="Sélectionner" /></SelectTrigger><SelectContent>{clearable && <SelectItem value="__none__">Aucune</SelectItem>}{options.filter(([id]) => id).map(([id, name]) => <SelectItem key={id} value={id}>{name}</SelectItem>)}</SelectContent></Select></div> }
function FeedbackAlert({ feedback }: { feedback: NonNullable<Feedback> }) { const success = feedback.type === "success"; const Icon = success ? CheckCircle2 : AlertCircle; return <Alert variant={success ? "default" : "destructive"} className={success ? "border-green-300 bg-green-50 text-green-800" : ""}><Icon className="h-4 w-4" /><AlertDescription>{feedback.text}</AlertDescription></Alert> }
function RequiredHint() { return <div className="sm:col-span-2 rounded-md bg-muted/50 px-3 py-2 text-sm text-muted-foreground"><span className="font-medium text-destructive">*</span> Champs obligatoires. Les autres informations sont facultatives.</div> }
function validateEditor(editor: NonNullable<Editor>, data: FederationData) {
  const row = editor.row
  const parent=configuredParent(editor.resource,data,row.id_federation)
  if(parent.error)return parent.error
  if(parent.kind && editor.resource!=="equipes" && !row.id_structure_parent_coc?.trim())return `Sélectionnez le parent ${label(parent.kind).toLowerCase()}.`
  if (editor.resource === "hierarchie" && (!row.id_type_structure?.trim() || !row.niveau?.trim())) return "Renseignez la structure et son niveau."
  if (editor.resource === "ligues" && (!row.nom_ligue?.trim() || !row.id_province?.trim())) return "Renseignez le nom de la ligue et sa province."
  if (editor.resource === "ententes" && !row.nom_entente?.trim()) return "Renseignez le nom de l’entente et sa ligue parente. Les autres champs sont facultatifs."
  if (editor.resource === "cercles" && !row.nom_cercle?.trim()) return "Renseignez le nom du cercle et son parent territorial."
  if (editor.resource === "clubs" && !row.nom_club?.trim()) return "Renseignez le nom du club."
  if (editor.resource === "equipes" && (!row.nom_equipe?.trim() || !row.id_club_coc?.trim())) return "Renseignez le nom de l’équipe et son club parent."
  if (editor.resource === "equipes") {
    const current = data.equipes.find(team => team.id_equipe_coc === editor.id)
    try {
      trainingPatch(Object.fromEntries(trainingFields.filter(field => field in row).map(field => [field, row[field]])), current)
    } catch (error) { return error instanceof Error ? error.message : "Planning d’entraînement invalide." }
  }
  const email = editor.resource === "ligues" ? row.email_ligue : editor.resource === "ententes" ? row.email_entente : ""
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "L’adresse e-mail saisie n’est pas valide."
  return ""
}
function idColumn(resource: Resource) { return resource === "identification" ? "id_federation" : resource === "hierarchie" ? "id_hierarchie" : resource === "zones" ? "id_zone_coc" : resource === "ligues" ? "id_ligue_coc" : resource === "ententes" ? "id_entente_coc" : resource === "cercles" ? "id_cercle_coc" : resource === "clubs" ? "id_club_coc" : "id_equipe_coc" }
function label(resource: Resource) { return resource === "identification" ? "Identification" : resource === "hierarchie" ? "Niveau de structure" : resource === "zones" ? "Zone" : resource === "ligues" ? "Ligue" : resource === "ententes" ? "Entente" : resource === "cercles" ? "Cercle" : resource === "clubs" ? "Club" : "Équipe" }

function configuredParent(resource:Resource,data:FederationData,federationId:string){
 if(resource==="identification" || resource==="hierarchie")return {}
 try{return {kind:parentKind(resource as TerritorialKind,federationId,{HIERARCHIE:data.hierarchie.map(item=>({id_federation:item.id_federation,id_type_structure:item.id_type_structure,niveau_hierarchique:item.niveau}))},{TYPES_STRUCTURE:data.typesStructure.map(item=>({id_type_structure:item.id_type_structure,nom_type_structure:item.nom_structure}))})}}
 catch(error){return {error:error instanceof Error?error.message:"Parent territorial non pris en charge."}}
}
