import { Skeleton } from "@/components/ui/skeleton"

export default function CompetitionDetailLoading() {
  return <main className="min-h-screen space-y-6 p-4 md:p-6" aria-label="Chargement de la compétition">
    <Skeleton className="h-9 w-64"/>
    <div className="rounded-xl border p-5">
      <div className="mb-6 flex gap-2">{Array.from({ length: 5 }, (_, index) => <Skeleton key={index} className="h-9 w-28"/>)}</div>
      <div className="overflow-hidden rounded-lg border">
        <div className="grid grid-cols-[minmax(13rem,17rem)_1fr] border-b bg-muted/30 p-3"><Skeleton className="h-10 w-40"/><Skeleton className="h-10 w-full"/></div>
        {Array.from({ length: 4 }, (_, index) => <div key={index} className="grid min-h-20 grid-cols-[minmax(13rem,17rem)_1fr] items-center gap-4 border-b p-3 last:border-b-0"><div className="space-y-2"><Skeleton className="h-4 w-40"/><Skeleton className="h-3 w-28"/></div><Skeleton className="h-7 w-2/3"/></div>)}
      </div>
    </div>
  </main>
}
