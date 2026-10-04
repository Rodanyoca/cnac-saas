import { randomUUID } from "node:crypto"
import { NextResponse } from "next/server"
import { canAccess } from "@/lib/auth"
import { apiErrorPayload } from "@/lib/api/errors"
import { SliderInputError, updateSlider } from "@/lib/site-web/sliders"

export const runtime = "nodejs"
export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) { const requestId = request.headers.get("x-request-id")?.trim() || randomUUID(); if (!(await canAccess("AUT-COM", "WRITE"))) return NextResponse.json({ error: "Accès refusé.", request_id: requestId }, { status: 403 }); try { const form = await request.formData(), input = JSON.parse(String(form.get("data") || "{}")), image = form.get("image"), slider = await updateSlider((await context.params).id, input, image instanceof File ? image : undefined); return NextResponse.json({ slider, request_id: requestId }) } catch (error) { const known = error instanceof SliderInputError; const result = apiErrorPayload(error, requestId, known ? 400 : undefined, { field: known ? error.field : undefined }); return NextResponse.json(result.payload, { status: result.status }) } }
