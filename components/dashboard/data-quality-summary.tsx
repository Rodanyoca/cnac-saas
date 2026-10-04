"use client"

import { AlertTriangle, CheckCircle2, DatabaseZap, RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { DataQualityReport, DataQualityState } from "@/lib/competitions/quality"

const labels: Record<DataQualityState, string> = { ABSENT: "Absent", INCONNU: "Inconnu", NON_APPLICABLE: "Non applicable", NON_RENSEIGNE: "Non renseigné", SOURCE_INDISPONIBLE: "Source indisponible", ORPHELIN: "Relation orpheline", SCHEMA_INVALIDE: "Schéma invalide" }

export function DataQualitySummary({ report }: { report: DataQualityReport }) {
  const router=useRouter()
  const blocking = report.issues.filter((item) => item.blockingWrite).length
  return <Card className="border-dashed"><CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base">{report.issues.length ? <AlertTriangle className="h-4 w-4 text-amber-600" /> : <CheckCircle2 className="h-4 w-4 text-emerald-600" />}Qualité de la fiche</CardTitle></CardHeader><CardContent className="space-y-4"><div className="grid gap-3 sm:grid-cols-3"><Metric label="Complétude" value={`${report.completeness}%`} /><Metric label="Provenance" value={`${report.provenance}%`} /><Metric label="Écritures à vérifier" value={String(blocking)} /></div>{report.issues.length ? <div className="space-y-2">{report.issues.map((item, index) => <div key={`${item.code}:${item.scope}:${index}`} className="flex min-w-0 items-start gap-3 rounded-md border p-3"><DatabaseZap className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><Badge variant={item.blockingWrite ? "destructive" : "outline"}>{labels[item.state]}</Badge><span className="text-xs text-muted-foreground">{item.scope}</span></div><p className="mt-1 break-words text-sm font-medium">{item.message}</p><p className="break-words text-xs text-muted-foreground">Action : {item.action}</p></div></div>)}</div> : <p className="text-sm text-muted-foreground">Aucune anomalie détectée dans les données actuellement chargées.</p>}{report.issues.some(item=>item.state==="SOURCE_INDISPONIBLE")&&<Button type="button" variant="outline" size="sm" onClick={()=>router.refresh()}><RefreshCw className="mr-2 h-4 w-4"/>Réessayer</Button>}</CardContent></Card>
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-md bg-muted/40 p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="text-lg font-semibold tabular-nums">{value}</p></div> }
