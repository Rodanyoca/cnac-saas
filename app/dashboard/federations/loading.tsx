import { Header } from "@/components/dashboard/header"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return <div className="min-h-screen"><Header title="Fédérations" subtitle="Chargement…" /><main className="space-y-5 p-4 md:p-6"><Skeleton className="h-10 w-full max-w-xl bg-slate-200/80 dark:bg-slate-800" /><Card><CardContent className="space-y-4 p-5">{Array.from({ length: 5 }, (_, index) => <Skeleton key={index} className="h-10 w-full bg-slate-200/80 dark:bg-slate-800" />)}</CardContent></Card></main></div>
}
