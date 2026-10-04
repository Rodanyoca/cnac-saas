"use client"
import { useEffect, useId, useRef, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FEDERATION_LOGO_ACCEPT, validateFederationLogo } from "@/lib/federations/logo"

export function ImageSelection({ label, file, onChange, existingUrl = "", disabled = false }: { label: string; file: File | null; onChange: (file: File | null) => void; existingUrl?: string; disabled?: boolean }) {
  const id = useId(), [preview, setPreview] = useState<{ file: File; url: string } | null>(null), [error, setError] = useState("")
  const input = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setPreview({ file, url: String(reader.result || "") })
    reader.readAsDataURL(file)
    return () => { reader.onload = null; if (reader.readyState === FileReader.LOADING) reader.abort() }
  }, [file])
  const source = file && preview?.file === file ? preview.url : existingUrl
  return <div className="space-y-2">
    <Label htmlFor={id}>{label} <span className="font-normal text-muted-foreground">(facultatif)</span></Label>
    <Avatar className="h-24 w-24 rounded-lg border bg-muted"><AvatarImage key={source} src={source || undefined} alt={file ? `Aperçu : ${label}` : label} className="object-contain" /><AvatarFallback className="rounded-lg text-xs">Aucune image</AvatarFallback></Avatar>
    <Input ref={input} id={id} type="file" accept={FEDERATION_LOGO_ACCEPT} disabled={disabled} onChange={event => {
      const selected = event.target.files?.[0]; if (!selected) return
      const valid = validateFederationLogo(selected)
      if (!valid.ok) { event.target.value = ""; setError(valid.error); return }
      setError(""); onChange(selected)
    }} />
    <p className="text-xs text-muted-foreground">PNG, JPEG ou WebP · 4 Mo maximum.{disabled ? " Stockage CNAC indisponible ou sauvegarde en cours." : ""}</p>
    {file && <div className="flex flex-wrap items-center gap-2"><span className="break-all text-xs">{file.name}</span><Button type="button" size="sm" variant="outline" disabled={disabled} onClick={() => { if (input.current) input.current.value = ""; onChange(null); setError("") }}>Annuler la sélection</Button></div>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
  </div>
}
