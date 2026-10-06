import { CalendarClock, FileText, FlaskConical, Gavel, Shield, Trophy, Users } from "lucide-react"
import { Header } from "./header"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

const icons = { competitions: Trophy, equipes: Users, activites: CalendarClock, documents: FileText, antidopage: Shield, controles: FlaskConical, aut: Shield, sanctions: Gavel }

export function ComingSoon({ title, icon }: { title: string; icon: keyof typeof icons }) {
  const Icon = icons[icon]
  return <div className="flex min-h-full min-w-0 flex-col">
    <Header title={title} />
    <div className="flex flex-1 items-center justify-center p-4 sm:p-6">
      <Card className="w-full max-w-2xl">
        <CardContent className="flex flex-col items-center gap-5 px-6 py-14 text-center sm:py-20">
          <div className="flex size-20 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10"><Icon className="size-9 text-primary" strokeWidth={1.5} aria-hidden="true" /></div>
          <Badge variant="outline" className="border-primary/30 text-primary">Coming soon</Badge>
          <div className="space-y-3"><h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2><p className="max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">Cette section sera disponible prochainement.</p></div>
        </CardContent>
      </Card>
    </div>
  </div>
}
