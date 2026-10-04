import { NextResponse } from "next/server"
import { canReadDocuments } from "@/lib/documents/auth"
import { getDocument } from "@/lib/documents/data"
import { downloadDriveFile } from "@/lib/google/drive"

export const runtime = "nodejs"

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await canReadDocuments())) return NextResponse.json({ error: "Accès non autorisé." }, { status: 403 })
  try {
    const document = await getDocument((await params).id)
    if (!document?.drive_document_id) return NextResponse.json({ error: "Fichier non disponible." }, { status: 404 })
    const file = await downloadDriveFile(document.drive_document_id)
    const name = file.name.replace(/[\r\n"]/g, "_")
    return new Response(new Uint8Array(file.buffer), { headers: { "Content-Type": file.mimeType, "Content-Disposition": `attachment; filename="${name}"`, "Cache-Control": "private, no-store" } })
  } catch (error) { console.error("Document download error", error); return NextResponse.json({ error: "Le fichier n’a pas pu être téléchargé." }, { status: 503 }) }
}
