import { CnacSourceError } from "@/components/dashboard/cnac-source-error"
import { cnacError } from "@/lib/cnac/errors"
import { getSheetsRows } from "@/lib/cnac/sheets"
import { getActeursSpreadsheetId } from "@/lib/acteurs/config"
import { CNAC_KEYS } from "@/lib/cnac/schema"
import { Header } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Medal, Stethoscope, Scale, UserCog } from "lucide-react"
import Link from "next/link"

const categories = [
  {
    title: "Athlètes",
    sheet: "ATHLETES" as const,
    description: "Gestion des athlètes enregistrés",
        icon: Medal,
    href: "/dashboard/acteurs/athletes",
    color: "bg-chart-1/10 text-chart-1",
  },
  {
    title: "Officiels",
    sheet: "OFFICIELS" as const,
    description: "Officiels des entités suivies",
        icon: UserCog,
    href: "/dashboard/acteurs/officiels",
    color: "bg-chart-2/10 text-chart-2",
  },
  {
    title: "Entraîneurs",
    sheet: "COACHS" as const,
    description: "Coachs et préparateurs",
        icon: Users,
    href: "/dashboard/acteurs/entraineurs",
    color: "bg-chart-3/10 text-chart-3",
  },
  {
    title: "Médecins",
    sheet: "MEDECINS" as const,
    description: "Personnel médical sportif",
        icon: Stethoscope,
    href: "/dashboard/acteurs/medecins",
    color: "bg-chart-4/10 text-chart-4",
  },
  {
    title: "Arbitres",
    sheet: "ARBITRES" as const,
    description: "Arbitres et juges officiels",
        icon: Scale,
    href: "/dashboard/acteurs/arbitres",
    color: "bg-chart-5/10 text-chart-5",
  },
]

async function ActeursPage() {
  const rows=await getSheetsRows({sheetNames:categories.map(category=>category.sheet),spreadsheetId:getActeursSpreadsheetId()})
  return (
    <div className="min-h-screen">
      <Header 
        title="Acteurs" 
        subtitle="Acteurs sportifs suivis par le CNAC"
      />
      
      <div className="p-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Link key={category.title} href={category.href}>
              <Card className="border-border/50 transition-all hover:shadow-md hover:border-primary/30 cursor-pointer h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className={`rounded-lg p-3 ${category.color}`}>
                      <category.icon className="h-6 w-6" />
                    </div>
                    <span className="text-3xl font-bold">{rows[category.sheet].filter(row=>row[CNAC_KEYS[category.sheet]]).length}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-lg mb-1">{category.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

export default async function ConnectedPage(){try{return await ActeursPage()}catch(error){return <CnacSourceError message={cnacError(error).message}/>}}
