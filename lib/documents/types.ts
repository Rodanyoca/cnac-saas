export const DOCUMENT_HEADERS = ["id_document", "nom_document", "id_entite_liee", "type_entite_liee", "id_type_document", "taille", "note", "drive_document_id", "drive_document_url", "observations"] as const
export type DocumentRecord = Record<(typeof DOCUMENT_HEADERS)[number], string>
export const DOCUMENT_ENTITY_TYPES = ["ACTIVITE", "COMPETITION", "EQUIPE_NATIONALE", "OFFICIEL", "FEDERATION", "ENTITE"] as const
export type DocumentEntityType = (typeof DOCUMENT_ENTITY_TYPES)[number]
export type DocumentOption = { id: string; label: string; secondary?: string }
export type DocumentReferences = {
  documentTypes: DocumentOption[]
  hasDocumentTypeReferential: boolean
  entityTypes: { id: DocumentEntityType; label: string }[]
  entities: Record<DocumentEntityType, DocumentOption[]>
}
