import { revalidatePath } from "next/cache"
import { NextResponse } from "next/server"
import { getActivities, getActivityReferences, saveActivity } from "@/lib/activites/data"
export const runtime = "nodejs"
export async function GET() { try { return NextResponse.json({ rows: await getActivities(), references: await getActivityReferences() }) } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 }) } }
async function write(request: Request, update = false) { try { const body = await request.json(); const row = await saveActivity(body.row ?? {}, update ? String(body.id ?? "") : undefined); revalidatePath("/dashboard/activites"); if (update) revalidatePath(`/dashboard/activites/${body.id}`); return NextResponse.json({ ok: true, row }) } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 400 }) } }
export async function POST(request: Request) { return write(request) }
export async function PUT(request: Request) { return write(request, true) }
