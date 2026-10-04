import "server-only"
import { canAccess } from "@/lib/auth"

export async function canReadDocuments() {
  return canAccess("AUT-ADM", "READ")
}

export async function canWriteDocuments() {
  return canAccess("AUT-ADM", "WRITE")
}
