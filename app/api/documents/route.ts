import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { canReadDocuments, canWriteDocuments } from "@/lib/documents/auth"
import { createDocument, getDocuments } from "@/lib/documents/data"
import { validatePdf } from "@/lib/documents/validation"

export const runtime = "nodejs"

export async function GET() {
  if (!(await canReadDocuments())) return NextResponse.json({ error: "Accès non autorisé." }, { status: 403 })
  try { return NextResponse.json({ rows: await getDocuments() }) }
  catch (error) { console.error("Documents list error", error); return NextResponse.json({ error: "Impossible de charger les documents." }, { status: 500 }) }
}

export async function POST(request: Request) {
  if (!(await canWriteDocuments())) return NextResponse.json({ error: "Accès non autorisé." }, { status: 403 })
  try {
    const contentType = request.headers.get("content-type") || ""
    let metadata: Record<string, unknown>
    let buffer: Buffer | undefined
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData()
      metadata = JSON.parse(String(form.get("metadata") || "{}"))
      const file = form.get("file")
      if (file instanceof File && file.size) { validatePdf(file); buffer = Buffer.from(await file.arrayBuffer()) }
    } else metadata = await request.json()
    const row = await createDocument(metadata, buffer)
    revalidatePath("/dashboard/documents")
    return NextResponse.json({ ok: true, row }, { status: 201 })
  } catch (error) {
    console.error("Document creation error", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Le document n’a pas pu être créé." }, { status: 400 })
  }
}
