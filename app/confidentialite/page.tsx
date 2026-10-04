import type { Metadata } from "next"
import { LegalDocument } from "@/components/legal/legal-document"
import { privacyDocument } from "@/lib/legal/content"

export const metadata: Metadata = {
  title: "Politique de confidentialité — CNAC",
  description: privacyDocument.description,
}

export default function PrivacyPage() {
  return <LegalDocument document={privacyDocument} />
}
