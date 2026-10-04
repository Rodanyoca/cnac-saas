import type { Metadata } from "next"
import { LegalDocument } from "@/components/legal/legal-document"
import { termsDocument } from "@/lib/legal/content"

export const metadata: Metadata = {
  title: "Conditions d’utilisation — CNAC",
  description: termsDocument.description,
}

export default function TermsPage() {
  return <LegalDocument document={termsDocument} />
}
