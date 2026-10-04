"use client"

import { apiFetch } from "@/lib/api/client"

import Link from "next/link"
import { useState } from "react"
import { AlertCircle, ArrowLeft, Check, Copy, ShieldCheck, UserPlus } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

const blocks = [
  { id: "AUT-ADM", title: "Administration", description: "Gestion administrative et des utilisateurs." },
  { id: "AUT-SPT", title: "Sport et territoires", description: "Entités, acteurs, compétitions et activités sportives." },
  { id: "AUT-COM", title: "Communication", description: "Documents et contenus de communication." },
] as const

export default function NewUserClient() {
  const [form, setForm] = useState({ nomComplet: "", email: "", typeUser: "VIEWER", estSuperAdmin: false, dateDebut: new Date().toISOString().slice(0, 10) })
  const [selected, setSelected] = useState<string[]>([])
  const [secret, setSecret] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setError("")
    setSubmitting(true)
    try {
      const response = await apiFetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, requestId: crypto.randomUUID(), authorizations: selected.map((block) => ({ block, dateDebut: form.dateDebut })) }) })
      const result = await response.json()
      if (!response.ok) {
        setError(result.existingUserId ? `${result.error} Compte : ${result.existingUserId}` : result.error || "La création du compte a échoué.")
        return
      }
      setSecret(result.temporaryAccess)
    } catch {
      setError("Le serveur est momentanément inaccessible. Réessayez dans quelques instants.")
    } finally {
      setSubmitting(false)
    }
  }

  function toggleBlock(block: string) {
    setSelected((current) => current.includes(block) ? current.filter((item) => item !== block) : [...current, block])
  }

  async function copySecret() {
    if (!secret) return
    await navigator.clipboard.writeText(secret)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return <main className="min-w-0 space-y-5 p-4 md:p-6"><div className="mx-auto max-w-4xl space-y-5">
    <Button asChild variant="ghost" size="sm" className="-ml-2"><Link href="/dashboard/utilisateurs"><ArrowLeft className="h-4 w-4" />Retour aux utilisateurs</Link></Button>
    <div><h1 className="flex items-center gap-3 text-2xl font-semibold tracking-tight"><UserPlus className="h-6 w-6 text-primary" />Créer un utilisateur</h1><p className="mt-1 text-sm text-muted-foreground">Renseignez son identité, son niveau d’accès et ses autorisations initiales.</p></div>

    <form onSubmit={submit} className="space-y-5">
      <Card><CardHeader><CardTitle className="text-lg">Informations du compte</CardTitle><CardDescription>Ces informations permettront d’identifier l’utilisateur et de lui transmettre son accès.</CardDescription></CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2"><Label htmlFor="nomComplet">Nom complet <span className="text-destructive">*</span></Label><Input id="nomComplet" autoComplete="name" placeholder="Ex. Marie Dupont" value={form.nomComplet} onChange={(event) => setForm({ ...form, nomComplet: event.target.value })} disabled={submitting} required /></div>
          <div className="space-y-2"><Label htmlFor="email">Adresse e-mail <span className="text-destructive">*</span></Label><Input id="email" type="email" autoComplete="email" placeholder="nom@organisation.org" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} disabled={submitting} required /></div>
          <div className="space-y-2"><Label htmlFor="typeUser">Type d’utilisateur</Label><Select value={form.typeUser} onValueChange={(typeUser) => setForm({ ...form, typeUser })} disabled={submitting}><SelectTrigger id="typeUser" className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="VIEWER">Consultation</SelectItem><SelectItem value="ADMIN">Administrateur</SelectItem></SelectContent></Select><p className="text-xs text-muted-foreground">Le type définit les actions possibles dans les blocs autorisés.</p></div>
          <div className="flex items-start justify-between gap-4 rounded-lg border p-4"><div className="space-y-1"><Label htmlFor="super-admin" className="cursor-pointer">Super-administrateur</Label><p className="text-xs leading-relaxed text-muted-foreground">Accès complet à l’administration des comptes.</p></div><Switch id="super-admin" checked={form.estSuperAdmin} onCheckedChange={(estSuperAdmin) => setForm({ ...form, estSuperAdmin })} disabled={submitting} /></div>
        </CardContent>
      </Card>

      <Card><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><ShieldCheck className="h-5 w-5 text-primary" />Autorisations initiales</CardTitle><CardDescription>Sélectionnez les espaces accessibles dès l’activation du compte.</CardDescription></CardHeader>
        <CardContent className="space-y-5"><div className="max-w-sm space-y-2"><Label htmlFor="dateDebut">Date de début</Label><Input id="dateDebut" type="date" value={form.dateDebut} onChange={(event) => setForm({ ...form, dateDebut: event.target.value })} disabled={submitting} /></div>
          <fieldset><legend className="mb-3 text-sm font-medium">Blocs fonctionnels</legend><div className="grid gap-3 md:grid-cols-3">{blocks.map((block) => { const checked = selected.includes(block.id); return <Label key={block.id} htmlFor={block.id} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50 ${checked ? "border-primary bg-primary/5" : ""}`}><Checkbox id={block.id} checked={checked} onCheckedChange={() => toggleBlock(block.id)} disabled={submitting} className="mt-0.5" /><span className="min-w-0"><span className="block font-medium">{block.title}</span><span className="mt-1 block text-xs font-normal leading-relaxed text-muted-foreground">{block.description}</span><span className="mt-2 block font-mono text-[11px] font-normal text-muted-foreground">{block.id}</span></span></Label> })}</div></fieldset>
        </CardContent>
        <CardFooter className="flex-col items-stretch gap-4 border-t sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-muted-foreground"><span className="text-destructive">*</span> Champs obligatoires</p><div className="flex flex-col-reverse gap-2 sm:flex-row"><Button asChild type="button" variant="outline"><Link href="/dashboard/utilisateurs">Annuler</Link></Button><Button type="submit" disabled={submitting}>{submitting ? "Création en cours…" : "Créer le compte"}</Button></div></CardFooter>
      </Card>
      {error && <Alert variant="destructive"><AlertCircle /><AlertTitle>Création impossible</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
    </form>

    {secret && <section role="dialog" aria-labelledby="temporary-title" className="rounded-xl border border-amber-500/60 bg-amber-50 p-5 text-amber-950 shadow-sm dark:bg-amber-950/20 dark:text-amber-100"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><h2 id="temporary-title" className="font-semibold">Accès temporaire — affichage unique</h2><p className="mt-1 text-sm opacity-80">Copiez cet accès et transmettez-le de manière sécurisée à l’utilisateur.</p><code className="mt-4 block break-all rounded-lg border border-amber-500/40 bg-background/70 px-4 py-3 text-base font-semibold tracking-wide">{secret}</code></div><Button type="button" variant="outline" onClick={copySecret} className="shrink-0">{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{copied ? "Copié" : "Copier"}</Button></div><div className="mt-4 flex justify-end"><Button asChild><Link href="/dashboard/utilisateurs">J’ai enregistré cet accès</Link></Button></div></section>}
  </div></main>
}
