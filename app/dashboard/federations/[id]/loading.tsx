import { Header } from "@/components/dashboard/header"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return <div className="min-h-screen"><Header title="Fédération" subtitle="Chargement…" /><main className="mx-auto max-w-5xl space-y-5 p-4 md:p-6"><Skeleton className="h-10 w-36 bg-slate-200/80 dark:bg-slate-800" /><Skeleton className="h-32 w-full bg-slate-200/80 dark:bg-slate-800" /><div className="grid gap-5 lg:grid-cols-2"><Skeleton className="h-72 w-full bg-slate-200/80 dark:bg-slate-800" /><Skeleton className="h-72 w-full bg-slate-200/80 dark:bg-slate-800" /></div></main></div>
}
