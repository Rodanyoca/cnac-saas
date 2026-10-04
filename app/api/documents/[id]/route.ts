import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { canReadDocuments, canWriteDocuments } from "@/lib/documents/auth"
import { getDocument, updateDocument } from "@/lib/documents/data"

export const runtime = "nodejs"

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await canReadDocuments())) return NextResponse.json({ error: "Accès non autorisé." }, { status: 403 })
  try { const row = await getDocument((await params).id); return row ? NextResponse.json({ row }) : NextResponse.json({ error: "Document introuvable." }, { status: 404 }) }
  catch (error) { console.error("Document detail error", error); return NextResponse.json({ error: "Impossible de charger le document." }, { status: 500 }) }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await canWriteDocuments())) return NextResponse.json({ error: "Accès non autorisé." }, { status: 403 })
  try {
    const { id } = await params
    const row = await updateDocument(id, await request.json())
    revalidatePath("/dashboard/documents"); revalidatePath(`/dashboard/documents/${id}`)
    return NextResponse.json({ ok: true, row })
  } catch (error) { console.error("Document update error", error); return NextResponse.json({ error: error instanceof Error ? error.message : "Le document n’a pas pu être modifié." }, { status: 400 }) }
}
