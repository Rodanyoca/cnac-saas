"use client"
import { useEffect,useState } from "react"
import { apiFetch } from "@/lib/api/client"
import { Button } from "@/components/ui/button"

export function AthleteClubCoaches({athleteId,clubId}:{athleteId:string;clubId?:string}) {
  const [coaches,setCoaches]=useState<{id:string;nom:string}[]|null>(null),[error,setError]=useState(""),[revision,setRevision]=useState(0)
  useEffect(()=>{if(!clubId)return;let active=true;apiFetch(`/api/athletes/${encodeURIComponent(athleteId)}/club-coachs`).then(async res=>{const data=await res.json();if(!res.ok)throw new Error(data.error||"Entraîneurs indisponibles.");if(active){setCoaches(data.coaches);setError("")}}).catch(e=>{if(active)setError(e instanceof Error?e.message:"Entraîneurs indisponibles.")});return()=>{active=false}},[athleteId,clubId,revision])
  return <section className="space-y-2" aria-label="Entraîneurs du club"><h3 className="text-base font-semibold">Entraîneurs du club</h3>{!clubId?<p className="text-sm text-muted-foreground">Aucun club renseigné pour cet athlète.</p>:error?<div role="alert"><p className="text-sm text-destructive">{error}</p><Button variant="outline" onClick={()=>setRevision(value=>value+1)}>Réessayer</Button></div>:coaches===null?<p className="text-sm text-muted-foreground">Chargement des entraîneurs…</p>:!coaches.length?<p className="text-sm text-muted-foreground">Aucun entraîneur rattaché activement à ce club.</p>:<ul className="flex flex-wrap gap-2">{coaches.map(coach=><li key={coach.id} className="rounded-md border px-3 py-2 text-sm">{coach.nom}</li>)}</ul>}</section>
}
