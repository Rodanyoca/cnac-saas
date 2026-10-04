import { revalidatePath } from "next/cache"
import { NextResponse } from "next/server"
import { createOfficialAffiliation, updateOfficialAffiliation } from "@/lib/acteurs/official-affiliations"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try { const body = await request.json(); const row = await createOfficialAffiliation(body.row ?? {}); revalidatePath(`/dashboard/acteurs/officiels/${row.id_officiel_coc}`); return NextResponse.json({ ok: true, row }) }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 400 }) }
}

export async function PUT(request: Request) {
  try { const body = await request.json(); const id = String(body.id ?? "").trim(); if (!id) throw new Error("Affiliation introuvable."); const row = await updateOfficialAffiliation(id, body.row ?? {}); revalidatePath(`/dashboard/acteurs/officiels/${row.id_officiel_coc}`); return NextResponse.json({ ok: true, row }) }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 400 }) }
}
