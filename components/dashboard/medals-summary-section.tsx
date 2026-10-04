import { Medal } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { MedalDashboardStats } from "@/lib/competitions/dashboard"

const number = new Intl.NumberFormat("fr-FR")
const items = [
  { key: "or", label: "Or", marker: "bg-amber-400" },
  { key: "argent", label: "Argent", marker: "bg-slate-400" },
  { key: "bronze", label: "Bronze", marker: "bg-orange-700" },
] as const

export function MedalsSummarySection({ stats }: { stats: MedalDashboardStats }) {
  return <section aria-labelledby="medals-dashboard-title" className="min-w-0 space-y-4">
    <div className="space-y-2">
      <h2 id="medals-dashboard-title" className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[.16em] text-primary/80 before:h-0.5 before:w-8 before:bg-primary/80"><Medal className="h-4 w-4" />Médailles</h2>
      <p className="text-sm text-muted-foreground">Récompenses obtenues dans les compétitions</p>
    </div>
    <div className="min-w-0 overflow-hidden rounded-xl border border-border/70 bg-card/80 shadow-[0_10px_28px_rgba(7,25,54,.04)]">
      <Table>
        <TableHeader><TableRow className="bg-secondary/80 hover:bg-secondary/80"><TableHead>Distinction</TableHead><TableHead className="text-right">Effectif</TableHead><TableHead className="text-right">Part du total</TableHead></TableRow></TableHeader>
        <TableBody>
          {items.map((item) => {
            const count = stats[item.key]
            const share = stats.total ? Math.round((count / stats.total) * 100) : 0
            return <TableRow key={item.key}><TableCell className="font-medium"><span className="inline-flex items-center gap-2"><span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${item.marker}`} />{item.label}</span></TableCell><TableCell className="text-right tabular-nums">{number.format(count)}</TableCell><TableCell className="text-right tabular-nums">{share}%</TableCell></TableRow>
          })}
          <TableRow className="border-t-2 bg-secondary/40 font-semibold hover:bg-secondary/40"><TableCell>Total</TableCell><TableCell className="text-right tabular-nums">{number.format(stats.total)}</TableCell><TableCell className="text-right tabular-nums">100%</TableCell></TableRow>
        </TableBody>
      </Table>
    </div>
  </section>
}
