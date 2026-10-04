import "server-only"
import { saveExistingImage } from "@/lib/cnac/media-handler"

// Point d'entree conserve pour les integrations CNAC : backend prive et confirme.
export function replaceFederationLogoInGoogle(request: Request, federationId: string) {
  return saveExistingImage(request, "logo", federationId)
}
