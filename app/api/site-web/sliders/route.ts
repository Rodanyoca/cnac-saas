import { randomUUID } from "node:crypto"
import { NextResponse } from "next/server"
import { canAccess } from "@/lib/auth"
import { apiErrorPayload } from "@/lib/api/errors"
import { createSlider, getPublicationStatuses, getSliders, SliderInputError } from "@/lib/site-web/sliders"

export const runtime = "nodejs"
const requestId = (request: Request) => request.headers.get("x-request-id")?.trim() || randomUUID()
const denied = (id: string) => NextResponse.json({ error: "Accès refusé.", request_id: id }, { status: 403 })
export async function GET(request: Request) { const id = requestId(request); if (!(await canAccess("AUT-COM", "READ"))) return denied(id); try { const [sliders, statuses] = await Promise.all([getSliders(), getPublicationStatuses()]); return NextResponse.json({ sliders, statuses, request_id: id }) } catch (error) { const result = apiErrorPayload(error, id); return NextResponse.json(result.payload, { status: result.status }) } }
export async function POST(request: Request) { const id = requestId(request); if (!(await canAccess("AUT-COM", "WRITE"))) return denied(id); try { const form = await request.formData(), input = JSON.parse(String(form.get("data") || "{}")), image = form.get("image"), slider = await createSlider(input, image instanceof File ? image : undefined); return NextResponse.json({ slider, request_id: id }, { status: 201 }) } catch (error) { const known = error instanceof SliderInputError; const result = apiErrorPayload(error, id, known ? 400 : undefined, { field: known ? error.field : undefined }); return NextResponse.json(result.payload, { status: result.status }) } }
