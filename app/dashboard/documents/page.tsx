import { Header } from "@/components/dashboard/header"
import { canAccess } from "@/lib/auth"
import { getDocumentReferences, getDocuments } from "@/lib/documents/data"
import DocumentsClient from "./documents-client"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function DocumentsPage({ searchParams }: { searchParams: Promise<{ nouveau?: string }> }) {
  const [{ nouveau }, canEdit] = await Promise.all([searchParams, canAccess("AUT-ADM", "WRITE")])
  const result = await Promise.all([getDocuments(), getDocumentReferences()]).then(([documents, references]) => ({ documents, references, error: false as const })).catch((error) => { console.error("Documents page error", error); return { documents: [], references: null, error: true as const } })
  if (result.error) return <div className="min-h-screen"><Header title="Documents" subtitle="Référentiel documentaire" /><main className="p-6"><p className="rounded-lg border border-destructive/30 p-4 text-destructive">Impossible de charger les documents.</p></main></div>
  const items = result.documents.map((document) => {
      const options = document.type_entite_liee ? result.references.entities[document.type_entite_liee as keyof typeof result.references.entities] || [] : []
      const linked = options.find((option) => option.id === document.id_entite_liee)
      const type = result.references.documentTypes.find((option) => option.id === document.id_type_document)
      return { ...document, typeLabel: type?.label || document.id_type_document, linkedLabel: linked?.label || document.id_entite_liee }
    })
  return <DocumentsClient items={items} references={result.references} canEdit={canEdit} initialCreate={nouveau === "1"} />
}
