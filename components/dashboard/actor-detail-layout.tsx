"use client"
import { useCnacActorReferences } from "@/components/dashboard/cnac-actor-references"
import { displayCivilDate } from "@/lib/cnac/model"

import { Header } from "@/components/dashboard/header"
import { MediaUploadDialog } from "@/components/dashboard/media-upload-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Camera, Contact, ExternalLink, FileText, Fingerprint, Info, Upload, User } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ReactNode, useState } from "react"

interface InfoField {
  label: string
  value: string | ReactNode
  icon?: ReactNode
}

interface ActorDetailLayoutProps {
  backHref: string
  backLabel: string
  title: string
  subtitle?: string
  avatarInitials: string
  avatarColorClass: string
  avatarUrl?: string | null
  urlPasseport?: string | null
  passportInfo?: { label: string; value: string }[]
  actorType?: string
  actorId?: string
  showActorId?: boolean
  profileActions?: ReactNode
  canManageMedia?: boolean
  actorDateNaissance?: string
  actorSexe?: string
  status?: string
  mainInfo: InfoField[]
  showDocuments?: boolean
  observations?: string
  generalTabLabel?: string
  contactInfo?: InfoField[]
  additionalSections?: {
    id: string
    label: string
    content: ReactNode
  }[]
  documents?: {
    name: string
    type: string
    date: string
    url?: string | null
  }[]
  children?: ReactNode
}

function ProfileAvatarImage({ src, alt, onError }: { src: string; alt: string; onError: () => void }) {
  return <Image src={src} alt={alt} fill sizes="80px" className="object-cover" referrerPolicy="no-referrer" unoptimized onError={onError} />
}

function ageFromBirthDate(value?: string) {
  if (!value) return null
  const normalized = value.trim()
  const iso = normalized.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  const local = normalized.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})$/)
  const parts = iso ? [Number(iso[1]), Number(iso[2]), Number(iso[3])] : local ? [Number(local[3]), Number(local[2]), Number(local[1])] : null
  if (!parts) return null
  const [year, month, day] = parts
  const birthDate = new Date(year, month - 1, day)
  if (birthDate.getFullYear() !== year || birthDate.getMonth() !== month - 1 || birthDate.getDate() !== day) return null
  const today = new Date()
  let age = today.getFullYear() - year
  if (today.getMonth() < month - 1 || (today.getMonth() === month - 1 && today.getDate() < day)) age--
  return age >= 0 && age <= 130 ? age : null
}

export function ActorDetailLayout({
  backHref,
  backLabel,
  title,
  subtitle,
  avatarInitials,
  avatarColorClass,
  avatarUrl,
  urlPasseport,
  passportInfo,
  actorType,
  actorId,
  showActorId = true,
  profileActions,
  canManageMedia = true,
  actorDateNaissance,
  actorSexe,
  status,
  mainInfo,
  showDocuments = true,
  observations,
  generalTabLabel = "Général",
  contactInfo,
  additionalSections = [],
  documents = [],
  children,
}: ActorDetailLayoutProps) {
  const router = useRouter()
  const [uploadedPasseportUrl, setUploadedPasseportUrl] = useState<string | null>(null)
  const [uploadedAvatarUrl, setUploadedAvatarUrl] = useState<string | null>(null)
  const [failedAvatarUrl, setFailedAvatarUrl] = useState<string | null>(null)

  const currentAvatarUrl = uploadedAvatarUrl || avatarUrl || null
  const currentPasseportUrl = uploadedPasseportUrl || urlPasseport || null
  const {scoped}=useCnacActorReferences()
  const actorDateLabel=scoped?displayCivilDate(actorDateNaissance||""):actorDateNaissance||"-"
  const actorAge = ageFromBirthDate(actorDateNaissance)

  const identityFields = [
    ...(actorId && showActorId ? [{ label: "ID", value: actorId }] : []),
    { label: "Nom", value: title },
    { label: "Date de naissance", value: actorDateLabel },
    ...(actorSexe
      ? [{ label: "Sexe", value: actorSexe === "M" ? "Homme" : actorSexe === "F" ? "Femme" : actorSexe }]
      : []),
  ]

  const identifierFields = mainInfo.filter((field) => /^ID(?:\s|$)/i.test(field.label))
  const generalFields = mainInfo.filter((field) => !/^ID(?:\s|$)/i.test(field.label))

  function fieldCard(label: string, icon: ReactNode, fields: InfoField[]) {
    return (
      <Card className="min-w-0">
        <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-lg">{icon}{label}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {fields.length ? fields.map((field, index) => (
            <div key={index} className="flex items-start justify-between gap-3">
              <span className="max-w-[45%] text-sm text-muted-foreground">{field.label}</span>
              <div className="min-w-0 max-w-[70%] break-words text-right text-sm font-medium">{field.value || "—"}</div>
            </div>
          )) : <p className="text-sm text-muted-foreground">Non renseigné</p>}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex min-w-0 flex-col">
      <Header title={title} subtitle={subtitle} />
      <div className="flex-1 space-y-6 p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="outline" asChild><Link href={backHref}><ArrowLeft className="mr-2 h-4 w-4" />{backLabel}</Link></Button>
          {profileActions}
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-4">
                <Avatar className="size-20 shrink-0">
                  {currentAvatarUrl && currentAvatarUrl !== failedAvatarUrl ? <ProfileAvatarImage key={currentAvatarUrl} src={currentAvatarUrl} alt={title} onError={() => setFailedAvatarUrl(currentAvatarUrl)} /> : <AvatarFallback className={`${avatarColorClass} text-lg`}>{avatarInitials}</AvatarFallback>}
                </Avatar>
                <div className="min-w-0">
                  <h2 className="break-words text-2xl font-bold">{title}</h2>
                  {subtitle && <p className="break-words text-muted-foreground">{subtitle}</p>}
                  {status && <Badge variant="secondary" className="mt-2">{status === "actif" ? "Actif" : status === "inactif" ? "Inactif" : status}</Badge>}
                  {actorDateNaissance && <p className="mt-2 text-sm text-muted-foreground">{actorDateLabel}{actorAge !== null && ` (${actorAge} ans)`}</p>}
                </div>
              </div>
              {canManageMedia && <MediaUploadDialog mediaType="avatar" title="Ajouter la photo" actorType={actorType} actorId={actorId} identityFields={identityFields} trigger={<Button variant="outline" size="sm"><Camera className="mr-2 h-4 w-4" />Ajouter la photo</Button>} onSuccess={({ url }) => { setUploadedAvatarUrl(url); router.refresh() }} />}
            </div>
          </CardContent>
        </Card>
        <Tabs defaultValue="infos" className="w-full min-w-0 gap-4">
          <TabsList className="h-auto w-full flex-wrap gap-1">
            <TabsTrigger value="infos" className="h-auto min-w-0 basis-[calc(50%-0.25rem)] flex-none whitespace-normal sm:basis-[calc(33.333%-0.25rem)] xl:basis-auto xl:flex-1">{generalTabLabel}</TabsTrigger>
            {additionalSections.map((section) => <TabsTrigger key={section.id} value={section.id} className="h-auto min-w-0 basis-[calc(50%-0.25rem)] flex-none whitespace-normal sm:basis-[calc(33.333%-0.25rem)] xl:basis-auto xl:flex-1">{section.label}</TabsTrigger>)}
            {showDocuments && <TabsTrigger value="documents" className="h-auto min-w-0 basis-[calc(50%-0.25rem)] flex-none whitespace-normal sm:basis-[calc(33.333%-0.25rem)] xl:basis-auto xl:flex-1">Documents</TabsTrigger>}
          </TabsList>
          <TabsContent value="infos" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {fieldCard("Identité", <User className="h-5 w-5 text-primary" />, generalFields)}
              {fieldCard("Contact", <Contact className="h-5 w-5 text-primary" />, contactInfo || [])}
              {(identifierFields.length > 0 || (actorId && showActorId)) && fieldCard("Identifiants", <Fingerprint className="h-5 w-5 text-primary" />, [...(actorId && showActorId ? [{label: "ID", value: actorId}] : []), ...identifierFields])}
              {observations !== undefined && fieldCard("Observations", <Info className="h-5 w-5 text-primary" />, [{ label: "Observations", value: <span className="whitespace-pre-wrap">{observations || "Aucune observation enregistrée"}</span> }])}
              {passportInfo?.length ? fieldCard("Passeport", <FileText className="h-5 w-5 text-primary" />, passportInfo) : null}
            </div>
            {children}
          </TabsContent>

                {showDocuments && <TabsContent value="documents" className="mt-0">
                  <div className="space-y-4">
                    {/* Passeport section */}
                    <div className="rounded-xl border border-border/70 bg-background/35 p-4 shadow-[0_10px_24px_rgba(7,25,54,.03)]">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg bg-destructive/10 p-2.5">
                            <FileText className="h-4 w-4 text-destructive" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Passeport</p>
                            <p className="text-xs text-muted-foreground">
                              {currentPasseportUrl ? "PDF attaché" : "Aucun fichier"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {currentPasseportUrl && (
                            <Button variant="ghost" size="sm" asChild>
                              <a href={currentPasseportUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4 mr-1" />
                                Ouvrir
                              </a>
                            </Button>
                          )}
                          {canManageMedia && <MediaUploadDialog
                            mediaType="passeport"
                            title="Passeport / Pièce d'identité"
                            actorType={actorType}
                            actorId={actorId}
                            identityFields={identityFields}
                            trigger={
                              <Button variant="outline" size="sm" className="gap-1">
                                <Upload className="h-3 w-3" />
                                {currentPasseportUrl ? "Remplacer" : "Ajouter"}
                              </Button>
                            }
                            onSuccess={({ url }) => {
                              setUploadedPasseportUrl(url)
                              router.refresh()
                            }}
                          />}
                        </div>
                      </div>
                    </div>

                    {/* Other documents */}
                    {documents.length > 0 ? (
                      documents.map((doc, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background/35 p-3 transition-colors hover:bg-primary/[.025]"
                        >
                          <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-primary/10 p-2.5">
                              <FileText className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{doc.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {doc.type} - {doc.date}
                              </p>
                            </div>
                          </div>
                          {doc.url && (
                            <Button variant="ghost" size="icon" asChild>
                              <a href={doc.url} target="_blank" rel="noopener noreferrer" aria-label={`Voir ${doc.name}`} title="Voir">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                        </div>
                      ))
                    ) : null}
                  </div>
                </TabsContent>}

                {additionalSections.map((section) => (
                  <TabsContent key={section.id} value={section.id} className="mt-0">
                    {section.content}
                  </TabsContent>
                ))}
        </Tabs>
      </div>
    </div>
  )
}
