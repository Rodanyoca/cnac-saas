import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { TerritorialDashboardStats } from "@/lib/federations/dashboard"

const number = new Intl.NumberFormat("fr-FR")

export function TerritorialStructureSection({ stats }: { stats: TerritorialDashboardStats }) {
  return <section aria-labelledby="territorial-title" className="space-y-4 rounded-2xl border border-border/80 bg-card/60 p-4 shadow-[0_10px_30px_rgba(7,25,54,0.12)] sm:p-5">
    <div className="space-y-2"><h2 id="territorial-title" className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[.16em] text-primary/80 before:h-0.5 before:w-8 before:bg-primary/80">Structure territoriale</h2><p className="text-sm text-muted-foreground">État des structures enregistrées</p></div>
    <div className="overflow-x-auto rounded-xl border border-border/70 bg-card/80 shadow-[0_10px_28px_rgba(7,25,54,.04)]"><Table><TableHeader><TableRow className="bg-secondary/80 hover:bg-secondary/80"><TableHead>Niveau territorial</TableHead><TableHead className="text-right">Total</TableHead><TableHead className="text-right">Actif</TableHead><TableHead className="text-right">Inactif</TableHead><TableHead className="text-right">Non renseigné</TableHead><TableHead className="text-right">Part du total</TableHead></TableRow></TableHeader><TableBody>
      {stats.levels.map((level) => <TableRow key={level.key}><TableCell className="font-medium text-foreground">{level.label}</TableCell><TableCell className="text-right tabular-nums text-foreground">{number.format(level.total)}</TableCell><TableCell className="text-right tabular-nums text-foreground">{number.format(level.actif)}</TableCell><TableCell className="text-right tabular-nums text-foreground">{number.format(level.inactif)}</TableCell><TableCell className="text-right tabular-nums text-foreground">{number.format(level.nonRenseigne)}</TableCell><TableCell className="text-right tabular-nums text-foreground">{level.part} %</TableCell></TableRow>)}
      <TableRow className="border-t-2 bg-secondary/40 font-semibold hover:bg-secondary/40"><TableCell className="text-foreground">Total</TableCell><TableCell className="text-right tabular-nums text-foreground">{number.format(stats.totalStructures)}</TableCell><TableCell className="text-right tabular-nums text-foreground">{number.format(stats.actif)}</TableCell><TableCell className="text-right tabular-nums text-foreground">{number.format(stats.inactif)}</TableCell><TableCell className="text-right tabular-nums text-foreground">{number.format(stats.nonRenseigne)}</TableCell><TableCell className="text-right tabular-nums text-foreground">{stats.totalStructures ? "100 %" : "0 %"}</TableCell></TableRow>
    </TableBody></Table></div>
  </section>
}
