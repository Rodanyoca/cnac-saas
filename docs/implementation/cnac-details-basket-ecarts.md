# Fiches détaillées CNAC — référence FEBACO

Analyse effectuée le 4 octobre 2026, avant modification. Référence : fiches acteurs FEBACO, notamment app/dashboard/athletes/[id]/page.tsx et components/dashboard/detail-card.tsx. Cible : ActorDetailLayout et ses six fiches Athlète, Entraîneur, Arbitre, Officiel, Médecin et Autres acteurs.

| Élément | FEBACO basket | CNAC avant modification | Adaptation prévue |
| --- | --- | --- | --- |
| Profil | Bandeau horizontal, avatar 80 px, nom 24 px | Colonne gauche, avatar 96 px, nom centré | Bandeau horizontal sur toute la largeur |
| Navigation | Retour encadré et modification au-dessus du profil | Retour discret et modification | Retour encadré, actions conservées |
| Onglets | Toute la largeur sous le profil | Dans la carte de droite | Toute la largeur, adaptation mobile |
| Général | Cartes Identité, Contact, Identifiants ; lignes libellé/valeur | Tuiles de champs et coordonnées dans la colonne gauche | Cartes en deux colonnes sur ordinateur, une sur mobile |
| Passeport | Fonction différente selon les acteurs | Métadonnées dans le profil, fichier dans Documents | Métadonnées regroupées, accès au fichier conservé |
| Métier | Affiliations et licences basket | Affiliations CNAC, parcours, équipes nationales, sélections | Conserver les sections et services CNAC existants |

La demande utilisateur désigne explicitement FEBACO pour cette adaptation et prime sur la référence COC habituelle indiquée dans AGENTS.md. L'analyse est fondée sur les sources, sans comparaison initiale de captures authentifiées. Aucun champ FIBA ou historique de licences basket ne doit être inventé dans le modèle CNAC.

## Résultat et vérifications

La disposition prévue est appliquée dans components/dashboard/actor-detail-layout.tsx. Les informations existantes sont réparties entre Identité, Contact, Identifiants et Passeport. Les identifiants masqués restent masqués ; une carte sans identifiant n'est pas affichée. Les onglets propres aux acteurs et les contenus enfants restent accessibles. Le bouton photo utilise le dialogue et les restrictions CNAC existants ; une photo envoyée est affichée immédiatement, avec repli si l'image est inaccessible.

Vérification locale du composant réel avec données fictives et CSS du projet : rendu Chromium à 390 et 1440 px, absence de débordement horizontal, captures inspectées dans .cache/details-basket-390.png et .cache/details-basket-1440.png. Les cartes passent d'une à deux colonnes, les onglets se répartissent sur plusieurs lignes sur mobile. Script reproductible : node .cache/check-details-basket.mjs. Ce contrôle utilise un rendu serveur et ne valide pas une session authentifiée ni un envoi de média réel.

Lint : aucune erreur, deux avertissements dans des fichiers non modifiés. Cinq tests ciblés réussis (complétude acteur et édition des affiliations officielles). Le test cnac-affiliation, TypeScript et le build sont bloqués par des incohérences hors de ce lot : territorial-model.ts importe sportingFields et validateTeamAttachment, absents de affiliation-model.ts ; deux assertions d'intégration attendent observations et nom_categorie_age sur Equipe. Aucun de ces fichiers métier n'a été modifié pour cette adaptation visuelle.
