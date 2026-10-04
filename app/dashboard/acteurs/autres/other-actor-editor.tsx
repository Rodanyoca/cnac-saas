"use client"

import { apiFetch } from "@/lib/api/client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Header } from "@/components/dashboard/header"
import { OtherActorForm, type OtherActorFormValue } from "@/components/dashboard/other-actor-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import type { OtherActorReferences } from "@/lib/acteurs/autres-model"

type EditorProps = { initialValue: OtherActorFormValue; references: OtherActorReferences; actorId?: string; presentation?: "page" | "sheet"; trigger?: React.ReactNode }

export function OtherActorEditor({ initialValue, references, actorId, presentation = "page", trigger }: EditorProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(initialValue)
  const [saving, setSaving] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [passportFile, setPassportFile] = useState<File | null>(null)
  const editing = Boolean(actorId)

  function selectFile(file: File | undefined, mediaType: "avatar" | "passeport") {
    if (!file) return
    const accepted = mediaType === "avatar" ? ["image/png", "image/jpeg", "image/jpg", "image/webp"] : ["application/pdf"]
    if (!accepted.includes(file.type) || file.size > 4 * 1024 * 1024) {
      toast.error(mediaType === "avatar" ? "Avatar invalide ou supérieur à 4 Mo." : "Passeport PDF invalide ou supérieur à 4 Mo.")
      return
    }
    if (mediaType === "avatar") setAvatarFile(file)
    else setPassportFile(file)
  }

  async function uploadMedia(file: File, mediaType: "avatar" | "passeport", savedId: string) {
    const data = new FormData()
    data.append("file", file)
    data.append("mediaType", mediaType)
    data.append("actorType", "autres")
    data.append("actorId", savedId)
    const response = await apiFetch("/api/upload-media", { method: "POST", body: data })
    const result = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(result.error || `Envoi du fichier ${mediaType} impossible.`)
  }

  async function save() {
    if (!form.nom_complet.trim()) {
      toast.error("Le nom complet est obligatoire.")
      return
    }
    setSaving(true)
    try {
      const response = await apiFetch("/api/autres", { method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: actorId, row: form }) })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.error || "Enregistrement impossible.")
      const savedId = String(actorId || result.row?.id_autre_acteur_coc || "")
      if (!savedId) throw new Error("L’identifiant de l’acteur enregistré est introuvable.")
      const uploads = [
        avatarFile ? uploadMedia(avatarFile, "avatar", savedId) : null,
        passportFile ? uploadMedia(passportFile, "passeport", savedId) : null,
      ].filter(Boolean) as Promise<void>[]
      const uploadResults = await Promise.allSettled(uploads)
      const failedUploads = uploadResults.filter((item) => item.status === "rejected")
      if (failedUploads.length) toast.warning(`Acteur enregistré, mais ${failedUploads.length} fichier(s) n’ont pas pu être envoyés.`)
      else toast.success(editing ? "Acteur modifié." : "Autre acteur ajouté.")
      setAvatarFile(null)
      setPassportFile(null)
      if (!editing) setForm(initialValue)
      if (presentation === "page") router.push(`/dashboard/acteurs/autres/${encodeURIComponent(savedId)}`)
      else setOpen(false)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error))
    } finally {
      setSaving(false)
    }
  }

  const fields = <OtherActorForm value={form} onChange={setForm} references={references} avatarFile={avatarFile} passportFile={passportFile} onAvatarChange={(file) => selectFile(file, "avatar")} onPassportChange={(file) => selectFile(file, "passeport")} />
  if (presentation === "sheet") return <Sheet open={open} onOpenChange={setOpen}><SheetTrigger asChild>{trigger || <Button>{editing ? "Modifier" : "Ajouter un autre acteur"}</Button>}</SheetTrigger><SheetContent className="w-full overflow-y-auto sm:max-w-2xl"><SheetHeader><SheetTitle>{editing ? "Modifier l’autre acteur" : "Ajouter un autre acteur"}</SheetTitle><SheetDescription>Renseignez l’identité, la fonction, le rattachement institutionnel et les médias.</SheetDescription></SheetHeader>{fields}<SheetFooter><Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button><Button disabled={saving} onClick={save}>{saving ? "Enregistrement…" : "Enregistrer"}</Button></SheetFooter></SheetContent></Sheet>
  return <div className="min-h-screen min-w-0 overflow-x-hidden"><Header title={editing ? "Modifier un autre acteur" : "Ajouter un autre acteur"} subtitle="Identité, fonction et rattachement institutionnel" /><main className="p-4 md:p-6"><Card className="mx-auto max-w-4xl"><CardHeader><CardTitle>{editing ? "Informations modifiables" : "Nouvelle fiche"}</CardTitle></CardHeader><CardContent>{fields}</CardContent><CardFooter className="justify-end gap-2"><Button variant="outline" onClick={() => router.back()}>Annuler</Button><Button disabled={saving} onClick={save}>{saving ? "Enregistrement…" : "Enregistrer"}</Button></CardFooter></Card></main></div>
}
