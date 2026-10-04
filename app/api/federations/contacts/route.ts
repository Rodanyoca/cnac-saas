import { writeAccess,errorResponse } from "@/lib/cnac/actor-handler"
import { revalidatePath } from "next/cache"
import { NextResponse } from "next/server"
import { canAccess } from "@/lib/auth"
import { createEntityContact, getEntityContactData, updateEntityContact } from "@/lib/federations/entity-contacts"

const denied = () => NextResponse.json({ error: "Accès refusé." }, { status: 403 })
export async function GET(request: Request) {
  if (!(await canAccess("AUT-SPT", "READ"))) return denied()
  try { const id = new URL(request.url).searchParams.get("entityId")?.trim() || ""; return NextResponse.json(await getEntityContactData(id)) }
  catch (error) { return errorResponse(error) }
}
export async function POST(request: Request) {
  const accessDenial=await writeAccess();if(accessDenial)return accessDenial
  if (!(await canAccess("AUT-SPT", "WRITE"))) return denied()
  try { const body = await request.json(); const data = await createEntityContact(body.row || {}); revalidatePath("/dashboard/federations"); return NextResponse.json(data) }
  catch (error) { return errorResponse(error) }
}
export async function PUT(request: Request) {
  const accessDenial=await writeAccess();if(accessDenial)return accessDenial
  if (!(await canAccess("AUT-SPT", "WRITE"))) return denied()
  try { const body = await request.json(); const data = await updateEntityContact(String(body.id || "").trim(), body.row || {}); revalidatePath("/dashboard/federations"); return NextResponse.json(data) }
  catch (error) { return errorResponse(error) }
}
