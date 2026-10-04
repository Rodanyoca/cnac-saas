import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { canWriteDocuments } from "@/lib/documents/auth"
import { replaceDocumentFile } from "@/lib/documents/data"
import { validatePdf } from "@/lib/documents/validation"

export const runtime = "nodejs"

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await canWriteDocuments())) return NextResponse.json({ error: "Accès non autorisé." }, { status: 403 })
  try {
    const form = await request.formData()
    const file = form.get("file")
    if (!(file instanceof File)) return NextResponse.json({ error: "Aucun fichier fourni." }, { status: 400 })
    validatePdf(file)
    const { id } = await params
    const row = await replaceDocumentFile(id, Buffer.from(await file.arrayBuffer()))
    revalidatePath("/dashboard/documents"); revalidatePath(`/dashboard/documents/${id}`)
    return NextResponse.json({ ok: true, row })
  } catch (error) { console.error("Document file replacement error", error); return NextResponse.json({ error: error instanceof Error ? error.message : "Le fichier n’a pas pu être remplacé." }, { status: 400 }) }
}
