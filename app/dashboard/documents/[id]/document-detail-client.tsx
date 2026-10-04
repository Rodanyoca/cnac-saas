"use client"

import { apiFetch } from "@/lib/api/client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Download, Pencil, Upload } from "lucide-react"
import { toast } from "sonner"
import { DocumentForm } from "@/components/dashboard/document-form"
import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import type { DocumentRecord, DocumentReferences } from "@/lib/documents/types"

const formatSize = (value: string) => { const bytes = Number(value); if (!Number.isFinite(bytes) || bytes <= 0) return "—"; return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} Mo` : `${Math.ceil(bytes / 1024)} Ko` }

export default function DocumentDetailClient({ document, references, typeLabel, linkedLabel, canEdit }: { document: DocumentRecord; references: DocumentReferences; typeLabel: string; linkedLabel: string; canEdit: boolean }) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  async function replaceFile() {
    if (!file) return
    setUploading(true)
    try {
      const body = new FormData(); body.append("file", file)
      const response = await apiFetch(`/api/documents/${encodeURIComponent(document.id_document)}/file`, { method: "PUT", body })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Le fichier n’a pas pu être remplacé.")
      toast.success(document.drive_document_id ? "Fichier remplacé." : "Fichier ajouté."); setFile(null); router.refresh()
    } catch (error) { toast.error(error instanceof Error ? error.message : String(error)) }
    finally { setUploading(false) }
  }
  const fields = [
    ["ID document", document.id_document], ["Nom", document.nom_document], ["Type", typeLabel || "—"],
    ["Rattachement", document.type_entite_liee ? `${document.type_entite_liee} · ${linkedLabel || document.id_entite_liee}` : "Aucun"],
    ["Taille", formatSize(document.taille)], ["Fichier", document.drive_document_id ? "Disponible" : "Non disponible"],
  ]
  return <div className="min-h-screen min-w-0 overflow-x-hidden"><Header title={document.nom_document} subtitle="Fiche documentaire" /><main className="min-w-0 space-y-6 p-4 sm:p-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><Button asChild variant="ghost"><Link href="/dashboard/documents"><ArrowLeft className="h-4 w-4" />Retour</Link></Button>{canEdit && <Button onClick={() => setEditOpen(true)}><Pencil className="h-4 w-4" />Modifier</Button>}</div>
    <div className="grid min-w-0 gap-6 lg:grid-cols-3"><Card className="min-w-0 lg:col-span-2"><CardHeader><CardTitle>Aperçu</CardTitle></CardHeader><CardContent>{document.drive_document_id ? <iframe title={`Aperçu PDF — ${document.nom_document}`} src={`/api/documents/${encodeURIComponent(document.id_document)}/preview`} className="h-[70vh] min-h-[520px] w-full rounded-lg border" /> : <div className="flex h-64 items-center justify-center rounded-lg border bg-muted/20 text-sm text-muted-foreground">Fichier non disponible</div>}{canEdit && <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center"><Input type="file" accept="application/pdf,.pdf" onChange={(event) => setFile(event.target.files?.[0] || null)} /><Button disabled={!file || uploading} onClick={replaceFile}><Upload className="h-4 w-4" />{uploading ? "Envoi…" : document.drive_document_id ? "Remplacer le fichier" : "Ajouter le fichier"}</Button></div>}{document.drive_document_id && <Button asChild variant="outline" className="mt-3"><a href={`/api/documents/${encodeURIComponent(document.id_document)}/download`}><Download className="h-4 w-4" />Télécharger</a></Button>}</CardContent></Card>
      <div className="space-y-6"><Card><CardHeader><CardTitle>Informations</CardTitle></CardHeader><CardContent className="space-y-4">{fields.map(([label, value]) => <div key={label}><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-sm font-medium">{value}</p></div>)}</CardContent></Card><Card><CardHeader><CardTitle>Note et observations</CardTitle></CardHeader><CardContent className="space-y-4"><div><p className="text-xs text-muted-foreground">Note</p><p className="mt-1 whitespace-pre-wrap text-sm">{document.note || "—"}</p></div><div><p className="text-xs text-muted-foreground">Observations</p><p className="mt-1 whitespace-pre-wrap text-sm">{document.observations || "—"}</p></div></CardContent></Card></div>
    </div>
  </main><Sheet open={editOpen} onOpenChange={setEditOpen}><SheetContent className="w-full overflow-y-auto sm:max-w-xl"><SheetHeader><SheetTitle>Modifier le document</SheetTitle><SheetDescription>L’identifiant et le fichier restent inchangés.</SheetDescription></SheetHeader><div className="px-4"><DocumentForm references={references} documentId={document.id_document} initial={{ nom_document: document.nom_document, id_type_document: document.id_type_document, type_entite_liee: document.type_entite_liee, id_entite_liee: document.id_entite_liee, note: document.note, observations: document.observations }} onSaved={() => setEditOpen(false)} /></div></SheetContent></Sheet></div>
}
