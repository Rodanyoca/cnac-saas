"use client"

import { ServiceUnavailable } from "@/components/dashboard/service-unavailable"

export default function DashboardError({ retry }: { retry: () => void }) {
  return <ServiceUnavailable retry={retry} />
}
