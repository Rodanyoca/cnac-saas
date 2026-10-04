import { notFound } from "next/navigation"
import { Header } from "@/components/dashboard/header"
import { canAccess } from "@/lib/auth"
import { getDocument, getDocumentReferences } from "@/lib/documents/data"
import DocumentDetailClient from "./document-detail-client"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [result, canEdit] = await Promise.all([Promise.all([getDocument(id), getDocumentReferences()]).then(([document, references]) => ({ document, references, error: false as const })).catch((error) => { console.error("Document detail page error", error); return { document: null, references: null, error: true as const } }), canAccess("AUT-ADM", "WRITE")])
  if (result.error) return <div className="min-h-screen"><Header title="Document" subtitle="Fiche documentaire" /><main className="p-6"><p className="rounded-lg border border-destructive/30 p-4 text-destructive">Impossible de charger le document.</p></main></div>
  const document = result.document
  if (!document) notFound()
  const linked = document.type_entite_liee ? result.references.entities[document.type_entite_liee as keyof typeof result.references.entities]?.find((option) => option.id === document.id_entite_liee) : undefined
  const typeLabel = result.references.documentTypes.find((type) => type.id === document.id_type_document)?.label || document.id_type_document
  return <DocumentDetailClient document={document} references={result.references} typeLabel={typeLabel} linkedLabel={linked?.label || document.id_entite_liee} canEdit={canEdit} />
}
