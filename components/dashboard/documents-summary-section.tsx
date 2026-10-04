import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { DocumentsDashboardStats } from "@/lib/documents/dashboard"

const number = new Intl.NumberFormat("fr-FR")
const formatSize = (bytes: number) => bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} Mo` : bytes > 0 ? `${Math.ceil(bytes / 1024)} Ko` : "0 Ko"

export function DocumentsSummarySection({ stats }: { stats: DocumentsDashboardStats }) {
  return <section aria-labelledby="documents-title" className="space-y-4">
    <div className="space-y-2"><h2 id="documents-title" className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[.16em] text-primary/80 before:h-0.5 before:w-8 before:bg-primary/80">Documents</h2><p className="text-sm text-muted-foreground">Disponibilité des fichiers par type de rattachement</p></div>
    <div className="overflow-x-auto rounded-xl border border-border/70 bg-card/80 shadow-[0_10px_28px_rgba(7,25,54,.04)]"><Table>
      <TableHeader><TableRow className="bg-secondary/80 hover:bg-secondary/80"><TableHead>Rattachement</TableHead><TableHead className="text-right">Total</TableHead><TableHead className="text-right">Avec fichier</TableHead><TableHead className="text-right">Sans fichier</TableHead><TableHead className="text-right">Stockage</TableHead><TableHead className="text-right">Part du total</TableHead></TableRow></TableHeader>
      <TableBody>
        {stats.rattachements.map((item) => <TableRow key={item.key}><TableCell className="font-medium">{item.label}</TableCell><TableCell className="text-right tabular-nums">{number.format(item.total)}</TableCell><TableCell className="text-right tabular-nums">{number.format(item.avecFichier)}</TableCell><TableCell className="text-right tabular-nums">{number.format(item.sansFichier)}</TableCell><TableCell className="text-right tabular-nums">{formatSize(item.stockageOctets)}</TableCell><TableCell className="text-right tabular-nums">{stats.totalDocuments ? Math.round(item.total / stats.totalDocuments * 100) : 0} %</TableCell></TableRow>)}
        {!stats.rattachements.length && <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">Aucun document enregistré.</TableCell></TableRow>}
        <TableRow className="border-t-2 bg-secondary/40 font-semibold hover:bg-secondary/40"><TableCell>Total</TableCell><TableCell className="text-right tabular-nums">{number.format(stats.totalDocuments)}</TableCell><TableCell className="text-right tabular-nums">{number.format(stats.avecFichier)}</TableCell><TableCell className="text-right tabular-nums">{number.format(stats.sansFichier)}</TableCell><TableCell className="text-right tabular-nums">{formatSize(stats.stockageOctets)}</TableCell><TableCell className="text-right tabular-nums">{stats.totalDocuments ? "100 %" : "0 %"}</TableCell></TableRow>
      </TableBody>
    </Table></div>
  </section>
}
