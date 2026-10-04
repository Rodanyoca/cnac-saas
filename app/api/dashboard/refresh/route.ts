import { revalidatePath } from "next/cache"
import { NextResponse } from "next/server"
import { clearSheetCache } from "@/lib/google/sheets"
import { canAccess } from "@/lib/auth"

export const runtime = "nodejs"

export async function POST() {
  if (!(await Promise.all((["AUT-ADM", "AUT-SPT", "AUT-COM"] as const).map(block => canAccess(block, "WRITE")))).some(Boolean)) return NextResponse.json({ error: "Accès refusé." }, { status: 403 })
  clearSheetCache()
  revalidatePath("/dashboard")
  return NextResponse.json({ ok: true })
}
