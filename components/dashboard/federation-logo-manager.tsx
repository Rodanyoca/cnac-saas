"use client"

import { apiFetch } from "@/lib/api/client"

import { useEffect, useReducer, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { CheckCircle2, Loader2, Pencil, Upload } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { FEDERATION_LOGO_ACCEPT, logoDialogReducer, validateFederationLogo } from "@/lib/federations/logo"

export function FederationLogoManager({ federationId, federationName, initials, initialUrl, canEdit }: {
  federationId: string; federationName: string; initials: string; initialUrl: string; canEdit: boolean
}) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [state, dispatch] = useReducer(logoDialogReducer, { open: false, phase: "selection", error: null })
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState("")
  const [logoUrl, setLogoUrl] = useState(initialUrl)

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl) }, [previewUrl])

  function resetFile() {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl("")
    setFile(null)
    if (inputRef.current) inputRef.current.value = ""
  }

  function close() { resetFile(); dispatch({ type: "close" }) }

  function selectFile(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0]
    if (!selected) return
    const validation = validateFederationLogo(selected)
    if (!validation.ok) { resetFile(); dispatch({ type: "failure", error: validation.error }); return }
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(selected)
    setPreviewUrl(URL.createObjectURL(selected))
  }

  async function upload() {
    if (!file) return
    dispatch({ type: "upload" })
    try {
      const formData = new FormData()
      formData.append("file", file)
      const response = await apiFetch(`/api/federations/logo/${encodeURIComponent(federationId)}`, { method: "POST", body: formData })
      const result = await response.json().catch(() => null)
      if (!response.ok) throw new Error(result?.error || "Le logo n’a pas pu être envoyé.")
      setLogoUrl(result.url)
      dispatch({ type: "success" })
      router.refresh()
    } catch (error) {
      dispatch({ type: "failure", error: error instanceof Error ? error.message : "Échec de l’envoi du logo." })
    }
  }

  return <div className="flex flex-col items-center">
    <Avatar className="h-24 w-24 border border-border/60 bg-muted">
      {logoUrl && <AvatarImage key={logoUrl} src={logoUrl} alt={`Logo de ${federationName}`} className="object-contain p-1" />}
      <AvatarFallback className="bg-primary/10 text-2xl text-primary">{initials}</AvatarFallback>
    </Avatar>
    {canEdit && <Dialog open={state.open} onOpenChange={(open) => open ? dispatch({ type: "open" }) : close()}>
      <DialogTrigger asChild><Button type="button" variant="ghost" className="mt-1 h-6 px-2 text-[11px] text-muted-foreground"><Pencil className="h-3 w-3" aria-hidden="true" />Modifier le logo</Button></DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto p-4 sm:max-w-sm sm:p-5">
        <DialogHeader><DialogTitle>Modifier le logo</DialogTitle><DialogDescription>PNG, JPG, JPEG ou WebP · 4 Mo maximum.</DialogDescription></DialogHeader>
        {state.phase === "success" ? <div role="status" className="flex flex-col items-center gap-2 py-6 text-center"><CheckCircle2 className="h-8 w-8 text-emerald-600" aria-hidden="true" /><p className="font-medium">Logo enregistré avec succès.</p><Button type="button" size="sm" onClick={close}>Fermer</Button></div>
          : state.phase === "uploading" ? <div role="status" aria-live="polite" className="flex flex-col items-center gap-2 py-8 text-center"><Loader2 className="h-7 w-7 animate-spin text-muted-foreground" aria-hidden="true" /><p className="font-medium">Envoi du logo…</p></div>
          : state.phase === "confirmation" ? <div className="space-y-4"><div className="overflow-hidden rounded-lg border bg-muted/20 p-2"><Image src={previewUrl} alt="Aperçu du nouveau logo" width={320} height={192} unoptimized className="mx-auto max-h-48 w-full object-contain" /></div><p className="text-sm">Confirmez-vous le remplacement du logo actuel de <strong>{federationName}</strong> ?</p><DialogFooter><Button type="button" variant="outline" onClick={() => dispatch({ type: "open" })}>Retour</Button><Button type="button" onClick={upload}>Confirmer l’envoi</Button></DialogFooter></div>
          : <div className="space-y-4"><button type="button" onClick={() => inputRef.current?.click()} className="flex min-h-32 w-full flex-col items-center justify-center rounded-lg border border-dashed p-4 text-center transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Upload className="mb-2 h-6 w-6 text-muted-foreground" aria-hidden="true" /><span className="text-sm font-medium">Sélectionner une image</span></button>{previewUrl && <div className="overflow-hidden rounded-lg border bg-muted/20 p-2"><Image src={previewUrl} alt="Aperçu du logo sélectionné" width={320} height={192} unoptimized className="mx-auto max-h-48 w-full object-contain" /></div>}<input ref={inputRef} className="sr-only" type="file" accept={FEDERATION_LOGO_ACCEPT} onChange={selectFile} />{state.error && <p role="alert" className="text-sm text-destructive">{state.error}</p>}<DialogFooter><Button type="button" variant="outline" onClick={close}>Annuler</Button><Button type="button" disabled={!file} onClick={() => dispatch({ type: "confirm" })}>Continuer</Button></DialogFooter></div>}
      </DialogContent>
    </Dialog>}
  </div>
}
