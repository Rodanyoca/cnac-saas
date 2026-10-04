import Link from "next/link"
import { ArrowRight, Building2, CalendarDays, FileText, GalleryHorizontalEnd, History, Images, Landmark, Megaphone, Newspaper, Trophy, Users } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Header } from "@/components/dashboard/header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const sections: readonly { name: string; description: string; href: string; icon: LucideIcon; available?: boolean }[] = [
  { name: "Sliders", description: "Gérer les visuels, les messages et leur ordre d’affichage sur la page d’accueil.", href: "/dashboard/site-web/sliders", icon: GalleryHorizontalEnd, available: true },
  { name: "Communiqués", description: "Publier les annonces et les communications officielles du COC.", href: "/dashboard/site-web/communiques", icon: Megaphone },
  { name: "Actualités", description: "Créer et organiser les articles d’actualité destinés au public.", href: "/dashboard/site-web/actualites", icon: Newspaper },
  { name: "Galeries", description: "Administrer les albums photos et les contenus visuels du site.", href: "/dashboard/site-web/galeries", icon: Images },
  { name: "Historique", description: "Mettre en valeur l’histoire, les dates clés et la mémoire du COC.", href: "/dashboard/site-web/historique", icon: History },
  { name: "Gouvernance", description: "Présenter les instances, les responsables et l’organisation institutionnelle.", href: "/dashboard/site-web/gouvernance", icon: Landmark },
  { name: "Jeux", description: "Gérer les contenus consacrés aux Jeux et aux grandes compétitions.", href: "/dashboard/site-web/jeux", icon: Trophy },
  { name: "Athlètes", description: "Sélectionner et présenter les profils d’athlètes mis en avant.", href: "/dashboard/site-web/athletes", icon: Users },
  { name: "Entités", description: "Administrer les contenus publics des fédérations et entités partenaires.", href: "/dashboard/site-web/entites", icon: Building2 },
  { name: "Événements", description: "Planifier et publier les rendez-vous visibles sur le site web.", href: "/dashboard/site-web/evenements", icon: CalendarDays },
  { name: "Documents", description: "Mettre à disposition les documents et ressources destinés au public.", href: "/dashboard/site-web/documents", icon: FileText },
] as const

export default function SiteWebAdministrationPage() {
  return <div className="min-h-screen min-w-0 overflow-x-hidden">
    <Header title="Administration du site web" subtitle="Pilotez les contenus publics du Comité Olympique Congolais depuis un espace unique" />
    <main className="min-w-0 p-4 sm:p-6">
      <section aria-label="Rubriques du site web">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sections.map((section) => {
            const Icon = section.icon
            return <Link key={section.href} href={section.href} className="group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <Card className="h-full border-border/70 bg-card/80 transition duration-200 group-hover:-translate-y-0.5 group-hover:border-primary/40 group-hover:shadow-lg">
                <CardContent className="flex h-full min-h-48 flex-col p-5">
                  <div className="flex items-start justify-between gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15"><Icon className="h-5 w-5" aria-hidden="true" /></span><Badge variant={section.available ? "default" : "outline"}>{section.available ? "Disponible" : "À configurer"}</Badge></div>
                  <h3 className="mt-5 text-lg font-semibold">{section.name}</h3>
                  <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">{section.description}</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">Ouvrir la rubrique <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" /></span>
                </CardContent>
              </Card>
            </Link>
          })}
        </div>
      </section>
    </main>
  </div>
}
