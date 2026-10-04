import { getDocuments } from "./data"

export const DOCUMENTS_DASHBOARD_CACHE_TAG = "documents-dashboard"

export type DocumentLinkStats = {
  key: string
  label: string
  total: number
  avecFichier: number
  sansFichier: number
  stockageOctets: number
}

export type DocumentsDashboardStats = {
  totalDocuments: number
  documentsLies: number
  documentsNonLies: number
  avecFichier: number
  sansFichier: number
  stockageOctets: number
  rattachements: DocumentLinkStats[]
}

const labels: Record<string, string> = {
  ACTIVITE: "Activités",
  COMPETITION: "Compétitions",
  EQUIPE_NATIONALE: "Équipes nationales",
  OFFICIEL: "Officiels",
  FEDERATION: "Fédérations",
  ENTITE: "Entités",
  NON_LIE: "Sans rattachement",
}

async function aggregateDocumentsDashboardStats(): Promise<DocumentsDashboardStats> {
  const documents = await getDocuments()
  const keys = [...new Set(documents.map((document) => document.type_entite_liee || "NON_LIE"))]
  const rattachements = keys.map((key) => {
    const rows = documents.filter((document) => (document.type_entite_liee || "NON_LIE") === key)
    return {
      key,
      label: labels[key] || key,
      total: rows.length,
      avecFichier: rows.filter((document) => document.drive_document_id).length,
      sansFichier: rows.filter((document) => !document.drive_document_id).length,
      stockageOctets: rows.reduce((sum, document) => sum + (Number(document.taille) || 0), 0),
    }
  }).sort((a, b) => a.label.localeCompare(b.label, "fr", { sensitivity: "base" }))

  const avecFichier = documents.filter((document) => document.drive_document_id).length
  const documentsLies = documents.filter((document) => document.type_entite_liee && document.id_entite_liee).length
  return {
    totalDocuments: documents.length,
    documentsLies,
    documentsNonLies: documents.length - documentsLies,
    avecFichier,
    sansFichier: documents.length - avecFichier,
    stockageOctets: documents.reduce((sum, document) => sum + (Number(document.taille) || 0), 0),
    rattachements,
  }
}

export const loadDocumentsDashboardStats = aggregateDocumentsDashboardStats
