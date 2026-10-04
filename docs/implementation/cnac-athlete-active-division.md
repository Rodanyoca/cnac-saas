> DOCUMENT HISTORIQUE : remplace le 4 octobre 2026 par la suppression complete des divisions CNAC. Le contrat courant est ATHLETES A:X (Club W, Equipe X), sans DIVISIONS ni division_applicable. Voir docs/CNAC_ROUTE_MAPPING.md.

# Division sportive de l’affiliation active CNAC

Adaptation du 4 octobre 2026, limitée au dépôt CNAC. Les métadonnées Git ne sont pas présentes : branche et diff initial non vérifiables.

## Contrat métier

La catégorie équipe reste dans EQUIPES.id_categorie_age. La division sportive facultative est enregistrée exclusivement dans ATHLETES.id_division. Les seules valeurs non vides autorisées sont D1, D2, D3 et D4, et chacune doit exister dans DIVISIONS. Les libellés du formulaire viennent de DIVISIONS.nom. Une absence de division produit une cellule vide, sans valeur fictive.

L’affiliation active comporte Fédération, Club, Équipe et Division sportive. Les changements de fédération, club ou équipe vident la sélection de division dans le formulaire. Le serveur vide également la division d’un athlète existant si le rattachement change sans qu’une nouvelle division soit explicitement transmise. Il valide toute nouvelle division et refuse les équipes incompatibles avec le club ou la fédération.

Correction du blocage en création : la division est disponible dès la sélection d’une fédération valide, si DIVISIONS contient des valeurs autorisées. Club et équipe restent facultatifs ; lorsqu’ils sont renseignés, leur cohérence avec la fédération est contrôlée dans le formulaire et au serveur. Le type ou l’absence de parent territorial du club ne désactive plus ce champ propre à l’athlète. Le parent sert uniquement au libellé de rattachement.

Le rattachement affiché est calculé à partir des références : Club X – Équipe Senior Messieurs – D1, Entente Kinshasa – D1, Zone Est – D2, Cercle de Matadi. Aucun séparateur final n’est ajouté en l’absence de division. Les fiches et listes Athlètes affichent ce rattachement ; la liste dispose aussi d’un filtre Division sportive et la recherche prend en compte le rattachement. Ce libellé n’est jamais envoyé vers Sheets.

## Nettoyage Équipe

Suppression de id_division du schéma, du type Equipe, des mappers et des formulaires Équipe. Suppression de la validation et du libellé de division provenant d’une équipe. Le service des références Équipe et les fiches Équipe ne demandent plus DIVISIONS.

Les anciennes colonnes d’une feuille EQUIPES sont ignorées à la lecture ; les valeurs périmées d’un éditeur sont filtrées. Une création écrit uniquement A:K, soit les onze colonnes actuelles. Les helpers Sheets refusent une écriture explicite de id_division dans EQUIPES, même si un ancien en-tête est encore présent.

## Vérification des classeurs

Lecture distante limitée aux en-têtes EQUIPES et ATHLETES, ainsi qu’aux identifiants du référentiel DIVISIONS. Aucun classeur ni donnée n’a été modifié par cette adaptation. Contrat connecté confirmé :

- EQUIPES : id_equipe_cnac, id_equipe_federation, id_federation, id_club_cnac, id_sport, id_discipline, id_categorie_age, id_sexe, nom_equipe, statut, observations.
- ATHLETES : id_division présent en colonne Y ; les autres colonnes et les positions des affiliations W/X restent intactes.
- DIVISIONS : D1, D2, D3, D4.

Les fixtures d’intégration utilisent les vrais handlers et un transport Sheets en mémoire pour vérifier les écritures dans Y, sans écriture de données personnelles réelles.

## Vérifications

- 43 tests ciblés réussis (cnac-affiliation, cnac-connection, cnac-territorial-divisions).
- Suite d’intégration complète : 31/31 réussis.
- Suite unitaire complète : 335/342 réussis. Sept échecs connus hors périmètre : competitions-final-interfaces (deux), competitions-t12, login-navigation, login-submission-lock, national-team-season, performance-paths.
- Lint sans erreur ; deux avertissements existants dans arbitres-client et athlete-sport-history.
- Build Next.js et compilation TypeScript réussis.
- Rendus Chromium des composants réels avec les CSS compilés, en création et modification Athlète/Équipe, à 390 px et 1024 px : huit cas sans débordement. Captures conservées sous .cache/active-division-*.png. La disposition et les styles de base hérités du COC restent conservés. Cette vérification porte sur les composants rendus, pas sur une session utilisateur authentifiée complète.

Les tests couvrent : création avec équipe/division et sans division, deux athlètes de la même équipe ayant des divisions différentes, modification et retrait de division, changement d’équipe, division invalide, contexte incompatible, ancienne cellule vide, formulaire Équipe sans Division en création/modification, et exclusion de toute écriture de division dans EQUIPES.

## Fichiers modifiés

- lib/cnac/schema.ts
- lib/cnac/model.ts
- lib/cnac/sheets.ts
- lib/cnac/affiliation-model.ts
- lib/cnac/affiliation-data.ts
- lib/cnac/actors-model.ts
- lib/cnac/territorial-model.ts
- lib/cnac/territorial-handler.ts
- lib/federations/schema.ts
- lib/federations/types.ts
- lib/federations/mappers.ts
- components/dashboard/team-sporting-fields.tsx
- components/dashboard/athlete-affiliation.tsx
- app/api/federations/[resource]/route.ts
- app/dashboard/federations/[id]/structures/[typeId]/[structureId]/page.tsx
- app/dashboard/acteurs/athletes/page.tsx
- app/dashboard/acteurs/athletes/athletes-client.tsx
- app/dashboard/acteurs/athletes/[id]/page.tsx
- app/dashboard/acteurs/athletes/[id]/athlete-detail-client.tsx
- tests/unit/cnac-affiliation.test.ts
- tests/integration/cnac-territorial-divisions.test.ts
- docs/implementation/cnac-athlete-active-division.md (nouveau)
- docs/CNAC_ROUTE_MAPPING.md
