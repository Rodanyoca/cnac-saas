import { revalidatePath } from "next/cache"
import { NextResponse } from "next/server"
import { clearSheetCache } from "@/lib/google/sheets"

export const runtime = "nodejs"

export async function POST() {
  clearSheetCache()
  revalidatePath("/dashboard")
  return NextResponse.json({ ok: true })
}
