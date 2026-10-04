import { redirect } from "next/navigation"

export default function Page() {
  redirect("/dashboard/equipes-nationales?nouveau=1")
}
