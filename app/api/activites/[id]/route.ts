import { NextResponse } from "next/server"
import { getActivity } from "@/lib/activites/data"
export const runtime = "nodejs"
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) { const { id } = await params; const row = await getActivity(id); return row ? NextResponse.json({ row }) : NextResponse.json({ error: "Activité introuvable." }, { status: 404 }) }
