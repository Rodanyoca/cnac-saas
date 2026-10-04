"use client"

import { apiFetch } from "@/lib/api/client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { DocumentEntityType, DocumentRecord, DocumentReferences } from "@/lib/documents/types"
import { DOCUMENT_PDF_MAX_SIZE_BYTES, DOCUMENT_PDF_MAX_SIZE_MB } from "@/lib/documents/limits"

type FormValue = Pick<DocumentRecord, "nom_document" | "id_type_document" | "type_entite_liee" | "id_entite_liee" | "note" | "observations">
const empty: FormValue = { nom_document: "", id_type_document: "", type_entite_liee: "", id_entite_liee: "", note: "", observations: "" }

export function DocumentForm({ references, initial, documentId, onSaved }: { references: DocumentReferences; initial?: FormValue; documentId?: string; onSaved?: () => void }) {
  const router = useRouter()
  const [form, setForm] = useState<FormValue>(initial || empty)
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const entityOptions = form.type_entite_liee ? references.entities[form.type_entite_liee as DocumentEntityType] || [] : []
  const linkedActivity = form.type_entite_liee === "ACTIVITE"
    ? entityOptions.find((option) => option.id.toLocaleLowerCase("fr") === form.id_entite_liee.trim().toLocaleLowerCase("fr"))
    : undefined
  const set = (key: keyof FormValue, value: string) => setForm((current) => ({ ...current, [key]: value }))

  function selectFile(next: File | null) {
    if (next && next.size > DOCUMENT_PDF_MAX_SIZE_BYTES) {
      setFile(null)
      toast.error(`Le fichier dépasse la taille maximale de ${DOCUMENT_PDF_MAX_SIZE_MB} Mo.`)
      return
    }
    setFile(next)
  }

  async function save() {
    setSaving(true)
    try {
      let response: Response
      if (documentId) response = await apiFetch(`/api/documents/${encodeURIComponent(documentId)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
      else {
        const body = new FormData(); body.append("metadata", JSON.stringify(form)); if (file) body.append("file", file)
        response = await apiFetch("/api/documents", { method: "POST", body })
      }
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Enregistrement impossible.")
      toast.success(documentId ? "Document modifié." : "Document créé.")
      if (documentId) { onSaved?.(); router.refresh() } else router.push(`/dashboard/documents/${result.row.id_document}`)
    } catch (error) { toast.error(error instanceof Error ? error.message : String(error)) }
    finally { setSaving(false) }
  }

  return <div className="space-y-5 rounded-2xl border border-border/80 bg-card/60 p-4 shadow-[0_10px_30px_rgba(7,25,54,0.12)] sm:p-5">
    {!references.hasDocumentTypeReferential && <Alert><AlertDescription>La feuille TYPES_DOCUMENT n’existe pas encore dans le référentiel. Saisissez provisoirement un identifiant de type cohérent.</AlertDescription></Alert>}
    <div className="space-y-2"><Label className="text-sm font-medium text-muted-foreground">Nom du document *</Label><Input value={form.nom_document} onChange={(event) => set("nom_document", event.target.value)} /></div>
    <div className="space-y-2"><Label className="text-sm font-medium text-muted-foreground">Type de document *</Label>{references.hasDocumentTypeReferential ? <Select value={form.id_type_document} onValueChange={(value) => set("id_type_document", value)}><SelectTrigger className="w-full"><SelectValue placeholder="Sélectionner" /></SelectTrigger><SelectContent>{references.documentTypes.map((type) => <SelectItem key={type.id} value={type.id}>{type.label}</SelectItem>)}</SelectContent></Select> : <Input value={form.id_type_document} onChange={(event) => set("id_type_document", event.target.value.toUpperCase())} placeholder="Ex. PV" />}</div>
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2"><Label className="text-sm font-medium text-muted-foreground">Type de rattachement</Label><Select value={form.type_entite_liee || "__NONE__"} onValueChange={(value) => setForm((current) => ({ ...current, type_entite_liee: value === "__NONE__" ? "" : value, id_entite_liee: "" }))}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="__NONE__">Aucun rattachement</SelectItem>{references.entityTypes.map((type) => <SelectItem key={type.id} value={type.id}>{type.label}</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-2"><Label className="text-sm font-medium text-muted-foreground">{form.type_entite_liee === "ACTIVITE" ? "ID de l’activité" : "Objet lié"}</Label>{form.type_entite_liee === "ACTIVITE" ? <><Input value={form.id_entite_liee} onChange={(event) => set("id_entite_liee", event.target.value.toUpperCase())} placeholder="Ex. ACT0001" autoComplete="off" />{form.id_entite_liee && <div className={`rounded-md border px-3 py-2 text-sm ${linkedActivity ? "border-primary/30 bg-primary/5 text-foreground" : "border-destructive/30 bg-destructive/5 text-destructive"}`}>{linkedActivity ? <><span className="text-muted-foreground">Activité trouvée :</span> <span className="font-medium">{linkedActivity.label}</span></> : "Aucune activité ne correspond à cet ID."}</div>}</> : <Select disabled={!form.type_entite_liee} value={form.id_entite_liee} onValueChange={(value) => set("id_entite_liee", value)}><SelectTrigger className="w-full"><SelectValue placeholder="Sélectionner" /></SelectTrigger><SelectContent>{entityOptions.map((option) => <SelectItem key={option.id} value={option.id}>{option.secondary ? `${option.secondary} — ` : ""}{option.label}</SelectItem>)}</SelectContent></Select>}</div>
    </div>
    <div className="space-y-2"><Label className="text-sm font-medium text-muted-foreground">Note</Label><Textarea value={form.note} onChange={(event) => set("note", event.target.value)} /></div>
    <div className="space-y-2"><Label className="text-sm font-medium text-muted-foreground">Observations</Label><Textarea value={form.observations} onChange={(event) => set("observations", event.target.value)} /></div>
    {!documentId && <div className="space-y-2"><Label className="text-sm font-medium text-muted-foreground">Fichier PDF (facultatif, {DOCUMENT_PDF_MAX_SIZE_MB} Mo maximum)</Label><Input type="file" accept="application/pdf,.pdf" onChange={(event) => selectFile(event.target.files?.[0] || null)} /></div>}
    <div className="flex justify-end"><Button disabled={saving} onClick={save}>{saving ? "Enregistrement…" : "Enregistrer"}</Button></div>
  </div>
}
