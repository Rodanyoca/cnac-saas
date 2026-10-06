import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { ServiceUnavailable } from "@/components/dashboard/service-unavailable"

export default function ServiceUnavailablePage() {
  return <DashboardShell unavailable><ServiceUnavailable /></DashboardShell>
}
