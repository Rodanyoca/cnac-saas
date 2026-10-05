"use client"
import { AthleteAffiliationFields } from "@/components/dashboard/athlete-affiliation"
import { updateAffiliation, type AffiliationReferences } from "@/lib/cnac/affiliation-model"
import { civilDate } from "@/lib/cnac/model"
import { sexCode as displaySexe } from "@/lib/cnac/display"
import { useCnacActorReferences, PersonSexOptions } from "@/components/dashboard/cnac-actor-references"

import { confirmedSave } from "@/lib/api/confirmed-save"
import { ImageSelection } from "@/components/dashboard/image-selection"

import Link from "next/link"
import { Eye, Plus, Search } from "lucide-react"
import { useRouter } from "next/navigation"
import { useMemo, useRef, useState } from "react"
import { toast } from "sonner"

import { Header } from "@/components/dashboard/header"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export type AthleteListItem = {
  affiliationActive: string
  id: string
  idNational: string
  idFederal: string
  nomComplet: string
  sexe: string
  dateNaissance: string
  federation: string
  federationId: string
  statut: string
  avatar: string | null
}

export type FederationOption = {
  id: string
  sigle: string
  nom: string
}

type AthleteForm = {
  id_club_cnac: string
  id_equipe_cnac: string
  id_national: string
  id_athlete_federation: string
  id_federation_internationale: string
  nom_complet: string
  date_de_naissance: string
  lieu_de_naissance: string
  id_federation: string
  id_sexe: string
  statut: string
  telephone: string
  email: string
  adresse: string
}

const emptyForm: AthleteForm = {
  id_club_cnac: "",
  id_equipe_cnac: "",
  id_national: "",
  id_athlete_federation: "",
  id_federation_internationale: "",
  nom_complet: "",
  date_de_naissance: "",
  lieu_de_naissance: "",
  id_federation: "",
  id_sexe: "",
  statut: "ACTIF",
  telephone: "",
  email: "",
  adresse: "",
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}

function ageLabel(value: string) {
  try {
    const birthDate = civilDate(value)
    if (!birthDate) return "—"
    const [year, month, day] = birthDate.split("-").map(Number)
    const today = new Date()
    let age = today.getFullYear() - year
    if (today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day)) age--
    return age >= 0 ? `${age} ans` : "—"
  } catch {
    return "—"
  }
}


export function AthletesClient({
  athletes,
  federations,
  affiliationRefs,
}: {
  athletes: AthleteListItem[]
  federations: FederationOption[]
  affiliationRefs: AffiliationReferences
}) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [federationFilter, setFederationFilter] = useState("TOUTES")
  const [sexFilter, setSexFilter] = useState("TOUS")
  const [statusFilter, setStatusFilter] = useState("TOUS")
  const [editorOpen, setEditorOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState("")
  const [form, setForm] = useState<AthleteForm>(emptyForm)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const saveTicket = useRef("")
  const [pendingSave, setPendingSave] = useState(false)
  const { uploads } = useCnacActorReferences()

  const filteredAthletes = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase("fr")
    const federationRows = federationFilter === "TOUTES" ? athletes : athletes.filter((athlete) => athlete.federationId === federationFilter)
    const sexRows = sexFilter === "TOUS" ? federationRows : federationRows.filter((athlete) => displaySexe(athlete.sexe) === sexFilter)
    const statusRows = statusFilter === "TOUS" ? sexRows : sexRows.filter((athlete) => athlete.statut.trim().toLocaleUpperCase("fr") === statusFilter)
    const matchingAthletes = query
      ? statusRows.filter((athlete) =>
          [
            athlete.idNational,
            athlete.idFederal,
            athlete.nomComplet,
            athlete.sexe,
            athlete.dateNaissance,
            athlete.federation,
            athlete.statut,
            athlete.affiliationActive,
          ].some((value) => value.toLocaleLowerCase("fr").includes(query))
        )
      : statusRows

    return [...matchingAthletes].sort((first, second) =>
      first.nomComplet.localeCompare(second.nomComplet, "fr", {
        sensitivity: "base",
      })
    )
  }, [athletes, federationFilter, searchQuery, sexFilter, statusFilter])

  function update<K extends keyof AthleteForm>(key: K, value: AthleteForm[K]) {
    setForm((current) => updateAffiliation(current, key, value))
  }

  function closeEditor() {
    if (saveTicket.current) return
    setEditorOpen(false)
    setForm(emptyForm)
    setAvatarFile(null)
    saveTicket.current = ""
  }

  async function save() {
    const required: Array<[keyof AthleteForm, string]> = [
      ["nom_complet", "Nom complet"],
      ["id_federation", "Fédération"],
      ["id_sexe", "Sexe"],
    ]
    const missing = required.find(([key]) => !form[key].trim())
    if (missing) {
      toast.error(`Le champ « ${missing[1]} » est obligatoire.`)
      return
    }

    setSaving(true); setSaveError("")
    try {
      await confirmedSave("/api/athletes", "POST", { row: form }, avatarFile, "avatar", saveTicket)
      toast.success("Athlète ajouté avec succès.")
      closeEditor()
      router.refresh()
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Enregistrement impossible.")
      toast.error(error instanceof Error ? error.message : String(error))
    } finally {
      setPendingSave(Boolean(saveTicket.current))
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen">
      <Header title="Athlètes" subtitle="Liste des athlètes enregistrés" />

      <div className="space-y-6 p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row">
          <div className="grid w-full gap-3 sm:grid-cols-2 lg:max-w-5xl xl:grid-cols-[minmax(16rem,1.5fr)_repeat(3,minmax(0,1fr))]"><div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher un athlète..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="pl-9"
            />
          </div><Select value={federationFilter} onValueChange={setFederationFilter}><SelectTrigger className="w-full" aria-label="Filtrer par fédération"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="TOUTES">Toutes les fédérations</SelectItem>{federations.map((item) => <SelectItem key={item.id} value={item.id}>{item.sigle || item.nom}</SelectItem>)}</SelectContent></Select><Select value={sexFilter} onValueChange={setSexFilter}><SelectTrigger className="w-full" aria-label="Filtrer par sexe"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="TOUS">Tous les sexes</SelectItem><SelectItem value="H">Hommes</SelectItem><SelectItem value="F">Femmes</SelectItem></SelectContent></Select><Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-full" aria-label="Filtrer par statut"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="TOUS">Tous les statuts</SelectItem><SelectItem value="ACTIF">Actifs</SelectItem><SelectItem value="INACTIF">Inactifs</SelectItem></SelectContent></Select></div>
          <Button onClick={() => setEditorOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un athlète
          </Button>
        </div>

        <Card className="border-border/50">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>ID national</TableHead>
                    <TableHead>ID fédéral</TableHead>
                    <TableHead>Avatar</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead className="text-center">Sexe / Âge</TableHead>
                    <TableHead>Fédération</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAthletes.map((athlete) => (
                    <TableRow key={athlete.id} className="hover:bg-muted/30">
                      <TableCell>{athlete.idNational || "—"}</TableCell>
                      <TableCell>{athlete.idFederal || "—"}</TableCell>
                      <TableCell>
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={athlete.avatar || undefined} alt={athlete.nomComplet} />
                          <AvatarFallback className="bg-primary/10 text-sm text-primary">
                            {initials(athlete.nomComplet)}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium">{athlete.nomComplet || "—"}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center justify-center gap-1">
                          <span>{displaySexe(athlete.sexe)}</span>
                          <span className="text-xs text-muted-foreground">{ageLabel(athlete.dateNaissance)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {athlete.federation ? <Badge variant="outline">{athlete.federation}</Badge> : "—"}
                      </TableCell>
                      <TableCell>
                        {athlete.statut ? <Badge variant="secondary">{athlete.statut}</Badge> : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/dashboard/acteurs/athletes/${athlete.id}`} prefetch={false}>
                          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Voir l'athlète">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredAthletes.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                        Aucun athlète trouvé.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <p className="text-sm text-muted-foreground">
          Affichage de {filteredAthletes.length} sur {athletes.length} athlètes
        </p>
      </div>

      <Sheet open={editorOpen} onOpenChange={(open) => { if (!saving) { if (open) setEditorOpen(true); else closeEditor() } }}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>Ajouter un athlète</SheetTitle>
            <SheetDescription>
              Renseignez l’identité, la fédération et les informations utiles à la fiche détaillée.
            </SheetDescription>
          </SheetHeader>

          <fieldset disabled={saving || pendingSave} className="min-w-0 space-y-6 px-4">
            <AthleteAffiliationFields value={form} refs={affiliationRefs} update={update} />
            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Identité</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="nom_complet">Nom complet *</Label>
                  <Input id="nom_complet" value={form.nom_complet} onChange={(event) => update("nom_complet", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date_de_naissance">Date de naissance</Label>
                  <Input id="date_de_naissance" type="date" value={form.date_de_naissance} onChange={(event) => update("date_de_naissance", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lieu_de_naissance">Lieu de naissance</Label>
                  <Input id="lieu_de_naissance" value={form.lieu_de_naissance} onChange={(event) => update("lieu_de_naissance", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="id_sexe">Sexe *</Label>
                  <Select value={form.id_sexe} onValueChange={(value) => update("id_sexe", value)}>
                    <SelectTrigger id="id_sexe"><SelectValue placeholder="Sélectionner le sexe" /></SelectTrigger>
                    <SelectContent>
                      <PersonSexOptions rows={affiliationRefs.SEXES || []} />
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="statut">Statut</Label>
                  <Select value={form.statut} onValueChange={(value) => update("statut", value)}>
                    <SelectTrigger id="statut"><SelectValue placeholder="Sélectionner le statut" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIF">Actif</SelectItem>
                      <SelectItem value="INACTIF">Inactif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Identifiants</h3>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="id_national">ID national</Label>
                  <Input id="id_national" value={form.id_national} onChange={(event) => update("id_national", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="id_athlete_federation">ID fédéral</Label>
                  <Input id="id_athlete_federation" value={form.id_athlete_federation} onChange={(event) => update("id_athlete_federation", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="id_federation_internationale">ID international</Label>
                  <Input id="id_federation_internationale" value={form.id_federation_internationale} onChange={(event) => update("id_federation_internationale", event.target.value)} />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Coordonnées</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="telephone">Téléphone</Label>
                  <Input id="telephone" type="tel" value={form.telephone} onChange={(event) => update("telephone", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" type="email" value={form.email} onChange={(event) => update("email", event.target.value)} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="adresse">Adresse</Label>
                  <Input id="adresse" value={form.adresse} onChange={(event) => update("adresse", event.target.value)} />
                </div>
              </div>
            </section>



            <section className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Fichiers</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Les fichiers seront renommés automatiquement avec l’ID CNAC généré.
                </p>
              </div>
              <ImageSelection label="Photo de profil" file={avatarFile} onChange={setAvatarFile} disabled={saving || pendingSave || !uploads.avatar} />
            </section>
          </fieldset>

          <SheetFooter>
            {saveError && <p role="alert" className="text-sm text-destructive">{saveError}</p>}
            <Button variant="outline" disabled={saving || pendingSave} onClick={closeEditor}>Annuler</Button>
            <Button onClick={save} disabled={saving}>{saving ? "Enregistrement..." : "Enregistrer"}</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
