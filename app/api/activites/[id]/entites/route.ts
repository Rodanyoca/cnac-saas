import { revalidatePath } from "next/cache"
import { NextResponse } from "next/server"
import { deleteActivityEntity, getActivityEntities, saveActivityEntity } from "@/lib/activites/data"
export const runtime = "nodejs"
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) { try { const { id } = await params; return NextResponse.json({ rows: await getActivityEntities(id) }) } catch { return NextResponse.json({ error: "Impossible de charger les entités participantes." }, { status: 500 }) } }
async function write(request: Request, params: Promise<{ id: string }>, update = false) { try { const { id } = await params; const body = await request.json(); const row = await saveActivityEntity({ ...body.row, id_activite: id }, update ? String(body.id ?? "") : undefined); revalidatePath(`/dashboard/activites/${id}`); return NextResponse.json({ ok: true, row }) } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 400 }) } }
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) { return write(request, params) }
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) { return write(request, params, true) }
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) { try { const { id } = await params; const body = await request.json(); const row = await deleteActivityEntity(id, String(body.id ?? "")); revalidatePath(`/dashboard/activites/${id}`); return NextResponse.json({ ok: true, row }) } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 400 }) } }
