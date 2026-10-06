import type { ReactNode } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export function DashboardSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  const id = `section-${title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-").toLowerCase()}`
  return <section className="min-w-0 space-y-4 border-t border-border pt-6" aria-labelledby={id}><div><h2 id={id} className="text-lg font-semibold">{title}</h2>{description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}</div>{children}</section>
}
export function StatGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-px overflow-hidden rounded-xl border border-border/80 bg-border shadow-[0_12px_30px_rgba(1,10,20,0.12)] sm:grid-cols-2 xl:grid-cols-4">{children}</div>
}
export function StatValue({ label, value, detail }: { label: string; value: string | number | undefined; detail?: string }) {
  return <div className="relative min-h-32 min-w-0 bg-card p-5 before:absolute before:inset-y-5 before:left-0 before:w-0.5 before:rounded-full before:bg-primary/70"><p className="text-sm font-medium text-muted-foreground">{label}</p><p className="mt-3 break-words text-3xl font-bold tracking-[-0.04em] tabular-nums">{value === undefined ? "Indisponible" : typeof value === "number" ? value.toLocaleString("fr-FR") : value}</p>{detail && <p className="mt-2 text-xs text-muted-foreground">{detail}</p>}</div>
}
export type AnalyticsColumn<T> = { key: keyof T; label: string; align?: "right"; render?: (row: T) => ReactNode }
export function AnalyticsTable<T extends object>({ columns, rows }: { columns: AnalyticsColumn<T>[]; rows: T[] }) {
  return <div className="min-w-0 overflow-x-auto rounded-lg border"><Table><TableHeader><TableRow>{columns.map(column => <TableHead key={String(column.key)} className={column.align === "right" ? "text-right" : undefined}>{column.label}</TableHead>)}</TableRow></TableHeader><TableBody>{rows.length ? rows.map((row, index) => <TableRow key={index}>{columns.map(column => <TableCell key={String(column.key)} className={column.align === "right" ? "text-right tabular-nums" : undefined}>{column.render ? column.render(row) : row[column.key] === undefined ? "Indisponible" : String(row[column.key])}</TableCell>)}</TableRow>) : <TableRow><TableCell colSpan={columns.length} className="h-20 text-center text-muted-foreground">Aucune donnée enregistrée.</TableCell></TableRow>}</TableBody></Table></div>
}
