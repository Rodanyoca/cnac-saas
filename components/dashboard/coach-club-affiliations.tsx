"use client"

import { useEffect, useRef, useState } from "react"
import { Eye, Loader2, Pencil, Plus, RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"
import { apiFetch } from "@/lib/api/client"
import type { CoachClubDraft, CoachClubAffiliation } from "@/lib/cnac/coach-affiliations-model"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type Data = { affiliations: CoachClubAffiliation[]; clubs: { id:string;nom:string;federationId:string }[]; sexes:Record<string,string>[]; canWrite:boolean }
export const affiliationDrafts = (rows: CoachClubAffiliation[]): CoachClubDraft[] => rows.map(({id_affiliation_coach,id_club_cnac,statut,observations})=>({id_affiliation_coach,id_club_cnac,statut,observations}))
export function useCoachClubData(coachId?: string, enabled = true) {
  const [data,setData] = useState<Data | null>(null), [error,setError] = useState(""), [revision,setRevision] = useState(0)
  useEffect(()=>{
    if (!enabled) return
    let active=true
    apiFetch(`/api/coachs/affiliations${coachId?`?coachId=${encodeURIComponent(coachId)}`:""}`).then(async res=>{const body=await res.json();if(!res.ok)throw new Error(body.error||"Affiliations indisponibles.");if(active){setData(body);setError("")}}).catch(e=>{if(active)setError(e instanceof Error?e.message:"Affiliations indisponibles.")})
    const refresh=()=>setRevision(value=>value+1)
    window.addEventListener("cnac-coach-affiliations",refresh)
    return ()=>{active=false;window.removeEventListener("cnac-coach-affiliations",refresh)}
  },[coachId,enabled,revision])
  return {data,error,reload:()=>setRevision(value=>value+1)}
}

export function CoachAffiliationFields({ federationId, value, onChange, data, error, disabled = false, retry }: { federationId:string;value:CoachClubDraft[];onChange:(value:CoachClubDraft[])=>void;data:Data|null;error:string;disabled?:boolean;retry?:()=>void }) {
  const [club,setClub]=useState("")
  const clubs=data?.clubs.filter(item=>item.federationId===federationId && !value.some(row=>row.id_club_cnac===item.id))||[]
  const selected=clubs.some(item=>item.id===club)?club:""
  return <section className="space-y-3 sm:col-span-2" aria-label="Affiliations aux clubs">
    <h3 className="font-semibold">Affiliations aux clubs</h3>
    {error?<div role="alert" className="space-y-2 text-sm text-destructive"><p>{error}</p>{retry&&<Button variant="outline" type="button" onClick={retry}>Réessayer</Button>}</div>:!data?<p className="text-sm text-muted-foreground">Chargement des clubs…</p>:<>
      {!federationId && <p className="text-sm text-muted-foreground">Sélectionnez d’abord la fédération du coach.</p>}
      <div className="flex flex-wrap gap-2"><Select value={selected} onValueChange={setClub} disabled={disabled||!federationId||!data.canWrite}><SelectTrigger aria-label="Club à rattacher" className="min-w-0 flex-1"><SelectValue placeholder="Sélectionner un club" /></SelectTrigger><SelectContent>{clubs.map(item=><SelectItem key={item.id} value={item.id}>{item.nom}</SelectItem>)}</SelectContent></Select><Button type="button" variant="outline" disabled={disabled||!selected||!data.canWrite} onClick={()=>{onChange([...value,{id_club_cnac:selected,statut:"ACTIF",observations:""}]);setClub("")}}>Ajouter le rattachement</Button></div>
      {federationId && !clubs.length && <p className="text-sm text-muted-foreground">Aucun autre club disponible dans cette fédération.</p>}
      {!value.length && <p className="text-sm text-muted-foreground">Aucune affiliation à un club.</p>}
      {value.map((row,index)=><div key={row.id_club_cnac} className="space-y-3 rounded-lg border p-3">
        <p className="font-medium">{data.clubs.find(item=>item.id===row.id_club_cnac)?.nom||row.id_club_cnac}</p>
        <div className="space-y-2"><Label>Statut du rattachement</Label><Select value={row.statut} disabled={disabled||!data.canWrite} onValueChange={statut=>onChange(value.map((item,i)=>i===index?{...item,statut:statut as CoachClubDraft["statut"]}:item))}><SelectTrigger aria-label={`Statut du rattachement ${index+1}`}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ACTIF">Actif</SelectItem><SelectItem value="INACTIF">Inactif</SelectItem></SelectContent></Select></div>
        <div className="space-y-2"><Label>Observations du rattachement</Label><Textarea aria-label={`Observations du rattachement ${index+1}`} value={row.observations} disabled={disabled||!data.canWrite} onChange={event=>onChange(value.map((item,i)=>i===index?{...item,observations:event.target.value}:item))} /></div>
        {!row.id_affiliation_coach && <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={()=>onChange(value.filter((_,i)=>i!==index))}>Retirer du formulaire</Button>}
      </div>)}
    </>}
  </section>
}

export function CoachClubAffiliations({coachId,federationId}:{coachId:string;federationId:string}) {
  const {data,error,reload}=useCoachClubData(coachId)
  const [open,setOpen]=useState(false),[viewing,setViewing]=useState(false),[draft,setDraft]=useState<CoachClubDraft>({id_club_cnac:"",statut:"ACTIF",observations:""}),[saving,setSaving]=useState(false),[saveError,setSaveError]=useState("")
  const guard=useRef(false)
  const router=useRouter()
  const clubs=data?.clubs.filter(club=>club.federationId===federationId && !data.affiliations.some(row=>row.id_club_cnac===club.id))||[]
  const locked=saving||viewing||!data?.canWrite
  function start(row?:CoachClubAffiliation,readOnly=false) {
    setDraft(row?affiliationDrafts([row])[0]:{id_club_cnac:"",statut:"ACTIF",observations:""})
    setViewing(readOnly);setSaveError("");setOpen(true)
  }
  async function persist(value:CoachClubDraft[]) {
    if(guard.current||!data?.canWrite)return
    guard.current=true
    setSaving(true);setSaveError("")
    try {const res=await apiFetch("/api/coachs/affiliations",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({coachId,affiliations:value}),timeoutMs:60000});const body=await res.json();if(!res.ok||!body.ok)throw new Error(body.error||"Enregistrement impossible.");setOpen(false);window.dispatchEvent(new Event("cnac-coach-affiliations"));router.refresh()}
    catch(e){setSaveError(e instanceof Error?e.message:"Enregistrement impossible.");reload()}
    finally{guard.current=false;setSaving(false)}
  }
  function actions(row:CoachClubAffiliation) {
    return <div className="flex flex-wrap items-center justify-end gap-1">
      <Button variant="ghost" size="icon" onClick={()=>start(row,true)} aria-label={`Consulter l’affiliation à ${row.nom_club}`}><Eye className="size-4" /></Button>
      {data?.canWrite&&<><Button variant="ghost" size="icon" disabled={saving} onClick={()=>start(row)} aria-label={`Modifier l’affiliation à ${row.nom_club}`}><Pencil className="size-4" /></Button><Button size="sm" variant="outline" disabled={saving} onClick={()=>void persist([{...affiliationDrafts([row])[0],statut:row.statut==="ACTIF"?"INACTIF":"ACTIF"}])}>{row.statut==="ACTIF"?"Désactiver le rattachement":"Réactiver le rattachement"}</Button></>}
    </div>
  }
  return <Card className="min-w-0">
    <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <CardTitle><h3>Affiliations aux clubs</h3></CardTitle>
      <div className="flex flex-wrap gap-2"><Button variant="outline" size="icon" onClick={reload} disabled={saving} aria-label="Actualiser les affiliations"><RefreshCw className="size-4" /></Button>{data?.canWrite&&<Button disabled={saving||!!error} onClick={()=>start()}><Plus className="size-4" />Ajouter une affiliation</Button>}</div>
    </CardHeader>
    <CardContent>
      {error?<div role="alert" className="space-y-3 rounded-lg border border-destructive/30 p-4"><p className="text-sm text-destructive">{error}</p><Button variant="outline" onClick={reload}>Réessayer</Button></div>:!data?<p className="text-sm text-muted-foreground"><Loader2 className="mr-2 inline size-4 animate-spin" />Chargement des affiliations…</p>:!data.affiliations.length?<p className="text-sm text-muted-foreground">Aucune affiliation à un club.</p>:<>
        <div className="grid gap-3 md:hidden">{data.affiliations.map(row=><article key={row.id_affiliation_coach} className="space-y-3 rounded-lg border p-4"><div className="flex items-start justify-between gap-3"><p className="min-w-0 break-words font-medium">{row.nom_club}</p><Badge variant="outline">{row.statut}</Badge></div><div className="space-y-1 text-sm"><p className="text-muted-foreground">Observations</p><p className="whitespace-pre-wrap break-words">{row.observations||"Non renseignées"}</p></div>{actions(row)}</article>)}</div>
        <div className="hidden md:block"><Table><TableHeader><TableRow><TableHead>Club</TableHead><TableHead>Statut</TableHead><TableHead>Observations</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{data.affiliations.map(row=><TableRow key={row.id_affiliation_coach}><TableCell className="max-w-64 whitespace-normal break-words font-medium">{row.nom_club}</TableCell><TableCell><Badge variant="outline">{row.statut}</Badge></TableCell><TableCell className="max-w-80 whitespace-pre-wrap break-words">{row.observations||"Non renseignées"}</TableCell><TableCell>{actions(row)}</TableCell></TableRow>)}</TableBody></Table></div>
      </>}
      {saveError&&!open&&<p role="alert" className="mt-4 text-sm text-destructive">{saveError}</p>}
    </CardContent>
    <Sheet open={open} onOpenChange={next=>{if(!saving)setOpen(next)}}><SheetContent className="w-full overflow-y-auto sm:max-w-md" onEscapeKeyDown={event=>{if(saving)event.preventDefault()}} onInteractOutside={event=>{if(saving)event.preventDefault()}}>
      <form className="flex min-h-full flex-col" onSubmit={event=>{event.preventDefault();if(!locked&&draft.id_club_cnac)void persist([draft])}}>
        <SheetHeader className="pr-12"><SheetTitle>{viewing?"Consulter":draft.id_affiliation_coach?"Modifier":"Ajouter"} une affiliation</SheetTitle><SheetDescription>Rattachement de l’entraîneur à un club de sa fédération.</SheetDescription></SheetHeader>
        <div className="flex-1 space-y-5 px-4 py-2">
          <div className="space-y-2"><Label htmlFor="coach-affiliation-club">Club *</Label>{draft.id_affiliation_coach?<p id="coach-affiliation-club" className="rounded-md border bg-muted/50 px-3 py-2 text-sm">{data?.affiliations.find(row=>row.id_affiliation_coach===draft.id_affiliation_coach)?.nom_club||draft.id_club_cnac}</p>:<Select value={draft.id_club_cnac} onValueChange={id_club_cnac=>setDraft({...draft,id_club_cnac})} disabled={locked||!federationId}><SelectTrigger id="coach-affiliation-club" className="w-full"><SelectValue placeholder="Sélectionner un club" /></SelectTrigger><SelectContent>{clubs.map(club=><SelectItem key={club.id} value={club.id}>{club.nom}</SelectItem>)}</SelectContent></Select>}{!draft.id_affiliation_coach&&!clubs.length&&<p className="text-sm text-muted-foreground">Aucun autre club disponible dans cette fédération.</p>}</div>
          <div className="space-y-2"><Label htmlFor="coach-affiliation-status">Statut</Label><Select value={draft.statut} disabled={locked} onValueChange={statut=>setDraft({...draft,statut:statut as CoachClubDraft["statut"]})}><SelectTrigger id="coach-affiliation-status" className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ACTIF">Actif</SelectItem><SelectItem value="INACTIF">Inactif</SelectItem></SelectContent></Select></div>
          <div className="space-y-2"><Label htmlFor="coach-affiliation-observations">Observations</Label><Textarea id="coach-affiliation-observations" className="min-h-28" placeholder="Ajouter une observation (facultatif)" value={draft.observations} disabled={locked} onChange={event=>setDraft({...draft,observations:event.target.value})} /></div>
          {saveError&&<p role="alert" className="text-sm text-destructive">{saveError}</p>}
        </div>
        <SheetFooter className="mt-6 border-t">{!viewing&&<Button type="submit" disabled={locked||!draft.id_club_cnac||!!error}>{saving&&<Loader2 className="size-4 animate-spin" />}{draft.id_affiliation_coach?"Enregistrer":"Créer"}</Button>}<Button type="button" variant="outline" disabled={saving} onClick={()=>setOpen(false)}>Fermer</Button></SheetFooter>
      </form>
    </SheetContent></Sheet>
  </Card>
}
