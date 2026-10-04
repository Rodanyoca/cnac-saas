# Cartographie COC → CNAC

## EQUIPES — correction du contrat Sheets, 4 octobre 2026

L'erreur MAPPING_COLUMNS au chargement des affiliations Athlète était causée par CNAC_HEADERS.EQUIPES, qui exigeait encore trois champs supprimés : id_type_structure_sportive, id_structure_sportive_cnac et id_division. Le contrat Équipe comporte désormais les onze colonnes existantes, de id_equipe_cnac à observations. Les anciennes colonnes sont ignorées à la lecture et refusées à l'écriture, même si un ancien classeur les contient encore. Les créations restent bornées à A:K.

Le modèle et le mapper Equipe ainsi que l'état d'édition territorial ne transportent plus ces anciens champs. ATHLETES retrouve id_division dans son contrat, conformément au formulaire et au service existants : aucune division n'est déduite de l'équipe. Le chargement des paramètres Fédération inclut CATEGORIES_AGE afin de résoudre les libellés des catégories équipe.

Régression reproduite avant correction avec les onze en-têtes littéraux d'EQUIPES. Après correction : 31 tests unitaires ciblés réussis et 16 tests d'intégration réussis, dont loadAffiliationReferences utilisant le transport Sheets simulé et les onze colonnes réelles. Les tests couvrent aussi création/modification/rechargement, anciennes colonnes rejetées, catégorie affichée et division Athlète en Y. Aucun classeur connecté, secret ou configuration de déploiement n'a été modifié.

Fichiers : lib/cnac/schema.ts ; lib/federations/schema.ts, types.ts, mappers.ts ; app/dashboard/federations/[id]/parametres/parametres-client.tsx ; tests/unit/cnac-affiliation.test.ts ; tests/integration/cnac-territorial-divisions.test.ts.

Validation finale : build complet et TypeScript réussis ; lint sans erreur avec les deux avertissements connus. Vérification du chargement et des écritures uniquement avec des fixtures et un transport simulé, sans lecture des lignes de production.

## Correction des exports territoriaux — 4 octobre 2026

Le build échouait au chargement de territorial-model.ts : sportingFields et validateTeamAttachment étaient importés depuis affiliation-model.ts sans y être exportés. Les deux exports sont restaurés pour le contrat Équipe : validation obligatoire de l'identifiant de catégorie dans CATEGORIES_AGE à la création et lors du changement de rattachement. Le contrôle territorial existant conserve la validation du club et des propriétaires des références. Une modification indépendante du rattachement reste possible pour une ancienne équipe sans catégorie.

Le type Equipe déclare maintenant observations et nom_categorie_age, déjà utilisés dans le parcours de chargement ; le mapper conserve observations. Régression ajoutée dans tests/unit/cnac-affiliation.test.ts : renommage d'une ancienne équipe, changement de club sans catégorie refusé, catégorie inconnue refusée et changement avec catégorie valide accepté.

Le build complet, TypeScript et le test de régression réussissent ; lint ne présente aucune erreur (deux avertissements existants). Les autres tests d'affiliation révèlent des divergences indépendantes dans le schéma actuel : ATHLETES sans id_division et EQUIPES avec les anciens champs. Le test d'intégration du libellé de catégorie échoue également (Non renseignée au lieu de Seniors). Ces divergences ne sont pas masquées par cette correction d'import ; aucun classeur connecté n'a été modifié.

## Fiches acteurs — disposition FEBACO, 4 octobre 2026

À la demande explicite de l'utilisateur, les six fiches utilisant ActorDetailLayout reprennent la disposition des fiches détaillées basket FEBACO : bandeau horizontal, onglets sur toute la largeur, cartes Identité/Contact/Identifiants/Passeport. Les sections métier CNAC restent disponibles. Le rapport d'écarts a été préparé avant la modification : [analyse et validation](implementation/cnac-details-basket-ecarts.md).

Rendus locaux du composant avec fixtures inspectés à 390 et 1440 px, sans débordement. Lint sans erreur et cinq tests ciblés réussis. Le build, TypeScript et le test d'affiliation restent bloqués par des imports manquants dans le module territorial et des types Equipe incohérents, hors des fichiers modifiés. Aucune écriture Sheets ni aucun déploiement effectué.

Ce premier lot reproduit l’interface et les fonctions du COC. L’adaptation métier antidopage interviendra dans des lots distincts.

| Écran CNAC | Route | Dupliqué | Identité CNAC | Métier à adapter |
|---|---|---:|---:|---:|
| Connexion | `/login` | Oui | Oui | Oui |
| Activation, compte, indisponibilité | `/activation`, `/mon-compte`, `/service-indisponible` | Oui | Globale | Oui |
| Tableau de bord | `/dashboard` | Oui | Oui | Oui |
| Entités et détail | `/dashboard/federations` et sous-routes | Oui | Globale | Oui |
| Acteurs | `/dashboard/acteurs` | Oui | Globale | Oui |
| Athlètes | `/dashboard/acteurs/athletes` et détail | Oui | Globale | Oui |
| Officiels | `/dashboard/acteurs/officiels` et détail | Oui | Globale | Oui |
| Entraîneurs | `/dashboard/acteurs/entraineurs` et détail | Oui | Globale | Oui |
| Médecins | `/dashboard/acteurs/medecins` et détail | Oui | Globale | Oui |
| Arbitres | `/dashboard/acteurs/arbitres` et détail | Oui | Globale | Oui |
| Autres acteurs | `/dashboard/acteurs/autres` et sous-routes | Oui | Globale | Oui |
| Compétitions | `/dashboard/competitions` et sous-routes | Oui | Globale | Oui |
| Équipes nationales | `/dashboard/equipes-nationales` et sous-routes | Oui | Globale | Oui |
| Activités | `/dashboard/activites` et détail | Oui | Globale | Oui |
| Documents | `/dashboard/documents` et détail | Oui | Globale | Oui |
| Administration du site | `/dashboard/site-web` et sous-routes | Oui | Globale | Oui |
| Utilisateurs | `/dashboard/utilisateurs` et sous-routes | Oui | Globale | Oui |

## Médias hors schéma CNAC

Les colonnes de logo, avatar et passeport héritées du classeur COC ne font pas partie du schéma CNAC : elles ne sont pas exposées aux écrans et leurs uploads restent désactivés. Les cellules déjà présentes dans Sheets ne sont ni supprimées ni modifiées par les mises à jour métier.

Les API `auth`, `dashboard`, `federations`, `athletes`, `officiels`, `coachs`, `medecins`, `arbitres`, `autres`, `competitions`, `equipes-nationales`, `activites`, `documents`, `site-web`, `users` et `upload-media` sont présentes. En démonstration, les lectures Sheets sont neutralisées ; les écritures externes restent à connecter à des ressources CNAC dédiées.

## Vérification visuelle

La structure, les styles, les composants et les interactions proviennent directement du COC. Après installation, vérifier la connexion, le tableau de bord, les listes, les fiches, les panneaux latéraux et la navigation en desktop et mobile.

## Divisions des Zones et Ententes

L'affectation unique n'était pas implémentée dans les formulaires, types et vues. Le référentiel `DIVISIONS` et la configuration `division_applicable` restent conservés ; cette configuration ne génère aucun champ Division. Les formulaires de création/modification et les détails territoriaux ne chargent plus `DIVISIONS`, et les mutations ne le consultent plus.

Les anciens champs `id_division` et `idDivision` sont ignorés conformément à la liste des colonnes autorisées côté serveur et retirés des états/payloads et réponses Zone/Entente. Les créations écrivent exactement les sept colonnes de `ZONES` (A:G) et les treize de `ENTENTES` (A:M), sans remplacer les colonnes supprimées. Les mises à jour restent partielles et préservent les autres cellules et le parent direct. L'invalidation existante couvre les paramètres et détails de la fédération ; aucune purge utilisateur ni modification du schéma Google Sheets n'est effectuée.

Fichiers modifiés pour cette correction :

- `app/dashboard/federations/[id]/parametres/parametres-client.tsx` : nettoyage des états initiaux et des payloads pour les quatre formulaires.
- `app/dashboard/federations/[id]/parametres/page.tsx` : chargement sans DIVISIONS et typage explicite de l'éditeur initial.
- `app/dashboard/federations/[id]/structures/[typeId]/[structureId]/page.tsx` : détails sans chargement de DIVISIONS.
- `lib/federations/data.ts` : option de chargement conservant le référentiel par défaut.
- `lib/federations/structure.ts` : listes territoriales indépendantes de DIVISIONS.
- `lib/federations/structure-model.ts` : retrait des anciennes affectations dans les enregistrements transmis aux éditeurs.
- `lib/cnac/territorial-model.ts` : nettoyage des anciennes propriétés Zone/Entente.
- `lib/cnac/territorial-handler.ts` : service de `/api/federations/[resource]`, références sans DIVISIONS, réponse nettoyée et revalidation des pages de la fédération.
- `lib/cnac/model.ts` : sérialisation bornée à sept/treize colonnes, avec contrôles des identifiants et des en-têtes.
- `lib/cnac/sheets.ts` : utilisation du sérialiseur et plages d'ajout A:G/A:M.
- `components/dashboard/federation-structure-section.tsx` : imports des icônes Pencil/Plus manquants, qui bloquaient lint et build, et retrait d'une variable inutilisée.
- `tests/integration/cnac-territorial-divisions.test.ts` : transport Google Sheets simulé, créations/modifications, droits, parent, dates, caches, référentiel D1–D4 et rendus des quatre formulaires et des deux fiches.
- `docs/CNAC_ROUTE_MAPPING.md` : état et bilan de la correction.

Vérifications exécutées : TypeScript (`tsc --noEmit`) et build réussis ; lint sans erreur (deux avertissements hors périmètre) ; 31 tests ciblés et 22 tests d'intégration réussis. La suite unitaire générale donne 323 réussites et 7 échecs hors périmètre : `competitions-final-interfaces.test.ts` (2), `competitions-t12.test.ts` (1), `login-navigation.test.ts` (1), `login-submission-lock.test.ts` (1), `national-team-season.test.ts` (1), `performance-paths.test.ts` (1).

Les vérifications de cette correction utilisent exclusivement des fixtures locales et un transport Sheets simulé. Les rendus des formulaires et fiches sont vérifiés côté serveur ; aucun parcours interactif desktop/mobile ni enregistrement dans les classeurs de production n'a été effectué.

## Correction des modifications locales

Le refus `CNAC_DEMO_READ_ONLY` a été reproduit sur `PUT /api/federations/zones` et `PUT /api/federations/identification` avec une requête locale de même origine. Le serveur de développement conservait un ancien module sans l'autorisation Zone ; le contrôle local excluait également l'identification de la fédération.

`lib/demo-mode.ts` autorise maintenant la modification de l'identification (`PUT` uniquement), avec les mêmes restrictions que les structures : mode démo explicite, environnement de développement, hôte loopback et origine correspondant exactement à l'hôte. Les accès distants, de production, sans origine et les suppressions restent refusés. Les comptes réels conservent les contrôles habituels. Le serveur CNAC sur le port 3000 a été relancé pour charger la correction.

`tests/unit/cnac-local-edit-access.test.ts`, le test d'accès existant dans `cnac-connection.test.ts` et l'intégration territoriale couvrent les autorisations et le parcours d'écriture simulé des Zones, Ententes et de l'identification. La route `app/api/federations/[resource]/route.ts` rappelle la centralisation des contrôles dans le service.

Après relance, les cinq routes de modification testées sur le serveur local atteignent la validation métier (`400 INVALID_BODY` pour le JSON volontairement invalide utilisé comme sonde), au lieu d'un refus d'accès. Une origine externe reçoit toujours `403 CNAC_DEMO_READ_ONLY`. Ces sondes n'ont écrit aucune donnée dans Sheets ; les modifications réussies sont vérifiées avec le transport simulé.

## Fédérations et identifiants CNAC courts

Dans l'onglet Structure de la fiche Fédération, toutes les sections territoriales affichent une seule colonne « Sigle » avec le sigle/pseudo de la structure, à la place de « Parent direct ». Les cartes mobiles utilisent le même champ. Les relations parentales restent conservées pour les formulaires et les fiches individuelles.

Les tableaux et cartes de l'onglet « Éléments de la structure » du paramétrage territorial utilisent également « Sigle » et la valeur du sigle de la structure. Un test de rendu vérifie l'absence d'en-tête « Parent direct » sur cet écran.

Les actions d'ouverture des fiches dans ces tableaux et dans l'onglet Structure de la Fédération utilisent une icône œil (`Eye`), sur ordinateur et mobile.

La navigation affiche désormais « Fédérations ». Les libellés de création, de catégorie, de rattachement et de contact utilisent « Fédération » dans les pages concernées, tout en conservant les colonnes métier existantes.

Les nouvelles structures et les nouveaux acteurs utilisent un préfixe de type suivi d'une séquence sur au moins quatre chiffres : `ZON-0001`, `LIG-0001`, `ENT-0001`, `CER-0001`, `CLB-0001`, `EQP-0001`, `ATH-0001`, etc. Les niveaux de hiérarchie utilisent `HIE-0001`. Les créations sont sérialisées par ressource pour éviter que deux demandes simultanées choisissent la même séquence. Les identifiants restent non éditables depuis les formulaires.

La migration demandée a été appliquée le 2 octobre 2026 aux classeurs vérifiés CNAC : six identifiants de hiérarchie et les identifiants d'une Zone, d'une Ligue et d'une Entente, soit neuf identifiants et onze cellules avec les deux références parentales. Les identifiants déjà courts sont conservés. Aucune colonne ni donnée non concernée n'a été remplacée. La relecture après écriture confirme les nouveaux identifiants et leurs relations.

Le script `scripts/compact-cnac-ids.ts` prépare un plan sans écrire par défaut ; `--apply` applique les changements après une nouvelle vérification de l'état des classeurs. La sauvegarde des anciennes/nouvelles valeurs et positions est `.cache/cnac-id-migration-2026-10-02T21-21-16-609Z.json`. Le modèle `lib/cnac/id-migration.ts` refuse les identifiants dupliqués, les dépendances de formule littérales et les références non prises en charge. Les tests `cnac-identifiers.test.ts` couvrent séquences, concurrence, relations et migration répétable sans nouveau changement.

La page locale `/dashboard/federations/FED007/parametres` a été relue après migration : réponse 200 et présence des identifiants `ZON-0001`, `LIG-0001`, `ENT-0001`. Revenir à la liste des structures pour ouvrir les fiches avec leurs nouveaux identifiants. TypeScript, build, tests ciblés et lint passent (deux avertissements de lint déjà présents).

## Affiliation active et rattachement sportif — 3 octobre 2026

Les drawers de création et modification Athlète contiennent « Affiliation active » : club filtré par fédération, équipe filtrée par club, libellé sportif résolu depuis EQUIPES. La fiche affiche la même affiliation. Les références introuvables restent visibles ; changer de club/fédération efface les sélections incompatibles. Ouvrir la modification restaure les valeurs enregistrées.

Les formulaires Équipe chargent leurs références à l'ouverture via GET /api/federations/equipes. Le type filtre les structures de la fédération. Division est facultative et visible uniquement pour Zone/Entente lorsque division_applicable vaut OUI ; les options viennent de DIVISIONS. La fiche Équipe distingue son rattachement sportif actuel de son club propriétaire. Aucun changement de parent territorial, d'historique ou de règle d'âge.

Les schémas, mappings et routes valident les relations avant écriture. Les plages A:AZ couvrent N et X ; les positions sont résolues depuis les en-têtes physiques : affiliation W/X, rattachement L/M/N. Les champs omis sont conservés ; les chaînes vides effacent explicitement. Une modification d'équipe revalide aussi les fiches Athlète. L'exception locale de même origine couvre les athlètes en développement ; les autres environnements conservent les droits réels.

Limite constatée en lecture seule : SPORTS contient seulement id_sport, nom_sport, description, sport_olympique, statut. La configuration d'usage des équipes n'est pas présente ; clarification demandée. Aucune liste de sports n'est inventée. L'équipe reste facultative avec indication de configuration manquante. Le lecteur accepte le champ optionnel utilise_equipes (OUI/NON) si cette configuration est fournie ; il ne crée aucune colonne.

Fichiers : lib/cnac/affiliation-model.ts, affiliation-data.ts, schema.ts, model.ts, actors-model.ts, actor-handler.ts, territorial-model.ts, territorial-handler.ts ; lib/federations/types.ts et mappers.ts ; components/dashboard/athlete-affiliation.tsx et team-sporting-fields.tsx ; pages et clients Athlète, parametres-client.tsx, fiche Structure ; route API territoriale ; lib/demo-mode.ts. Tests : cnac-affiliation.test.ts et cnac-territorial-divisions.test.ts.

58 tests ciblés et d'intégration passent avec des fixtures et un transport Sheets en mémoire : enregistrement/rechargement, positions physiques, contrôle club/équipe/fédération, suppression explicite, données incomplètes, libellés, accès locaux et erreurs backend. Aucun classeur n'a été modifié pour ce lot. Les composants adaptatifs existants sont conservés ; les rendus ont été vérifiés côté serveur, sans validation visuelle interactive desktop/mobile. Lint sans erreur (deux avertissements préexistants), TypeScript et build réussis.

Le serveur CNAC et ses anciens workers ont été arrêtés puis un seul serveur a été relancé sur http://127.0.0.1:3000. GET /api/federations/equipes renvoie 200 avec les onze feuilles de références attendues ; cette vérification réelle est en lecture seule.

## Équipes — 3 octobre 2026

Création et modification utilisent le même formulaire : Fédération, Club, Sport, Discipline, Nom de l’équipe, Catégorie équipe, Sexe, Division, Statut, Observations. Catégorie équipe est obligatoire et provient exclusivement de CATEGORIES_AGE : nom_categorie_age affiché, id_categorie_age enregistré. Chargement, erreur et référentiel vide bloquent l’enregistrement. Les anciennes équipes sans catégorie restent consultables avec « Non renseignée ».

La feuille EQUIPES du classeur connecté 01_CNAC_STRUCTURE_TERRITORIALE a été migrée et vérifiée : aucune ligne existante, deux colonnes obsolètes vides retirées, toutes les autres colonnes conservées.

En-têtes actuels : id_equipe_cnac, id_equipe_federation, id_federation, id_club_cnac, id_sport, id_discipline, id_categorie_age, id_sexe, nom_equipe, statut, observations, id_division.

Les anciens champs de structure sportive sont ignorés à la lecture et exclus des écritures, types et interfaces Équipe. TYPES_STRUCTURE reste utilisé pour la hiérarchie territoriale. Le script scripts/migrate-team-columns.ts analyse sans écrire par défaut et applique la migration avec --apply, puis compare toutes les valeurs conservées.

Fichiers modifiés pour ce lot :

- lib/cnac/schema.ts, territorial-model.ts, affiliation-model.ts, affiliation-data.ts
- lib/federations/types.ts, schema.ts, mappers.ts, data.ts, structure-model.ts
- components/dashboard/team-sporting-fields.tsx, athlete-affiliation.tsx, federation-structure-section.tsx
- app/dashboard/federations/[id]/parametres/parametres-client.tsx
- app/dashboard/federations/[id]/structures/[typeId]/[structureId]/page.tsx
- tests/unit/cnac-affiliation.test.ts
- tests/integration/cnac-territorial-divisions.test.ts
- scripts/migrate-team-columns.ts (nouveau)
- docs/CNAC_ROUTE_MAPPING.md

Validation : 15 tests ciblés réussis ; suite d’intégration 27/27 réussie ; suite unitaire globale 332/339, sept échecs dans competitions-final-interfaces (deux), competitions-t12, login-navigation, login-submission-lock, national-team-season et performance-paths. Ces assertions portent sur des fichiers hors du lot Équipes. Lint : aucune erreur, deux avertissements dans arbitres-client et athlete-sport-history. Build et contrôle TypeScript réussis. Absence de métadonnées Git dans ce dossier : branche et diff initial non vérifiables. Vérification des composants par rendus serveur ; validation visuelle interactive desktop/mobile et tests E2E non réalisés. Aucun dépôt de référence, secret ou configuration de déploiement modifié.

## Équipes — correction des textes longs, 4 octobre 2026

Le composant AffiliationChoice utilisait un bouton SelectTrigger de largeur intrinsèque (w-fit). Un libellé long produisait un bouton de 490 px dans une colonne de 255 px, provoquant un chevauchement sur ordinateur et un débordement sur mobile. Correction dans components/dashboard/athlete-affiliation.tsx : conteneur min-w-0, bouton w-full/min-w-0/max-w-full, valeur sélectionnée contenue dans l’espace disponible et texte complet accessible par title et par les options. La grille, les espacements et la typographie de référence COC sont conservés.

Reproduction et vérification Chromium sur les composants réels avec les CSS compilés, hors données connectées : contrôle avant correction en échec à 1024 px ; après correction, aucun débordement à 390 px (champs de 308 px) et 1024 px (champs de 255 px). Captures inspectées visuellement dans .cache/equipes-layout-390.png et .cache/equipes-layout-1024.png. Les 15 tests ciblés passent, lint sans erreur (deux avertissements existants), build réussi.

## Paramètres CNAC — compatibilité CATEGORIES_AGE, 4 octobre 2026

Cause de l’erreur [CNAC Sheets] lors du chargement de ParametresPage : validation trop stricte du référentiel CATEGORIES_AGE. Les en-têtes connectés sont id_categorie_age, nom_categorie_age, âge_min, âge_max, observations. La feuille globale n’a pas de colonnes id_federation, id_sport ou id_discipline.

Correction dans lib/cnac/model.ts : identifiant et libellé restent obligatoires ; les colonnes complémentaires sont facultatives uniquement pour CATEGORIES_AGE ; âge_min/âge_max sont lus comme age_min/age_max et leurs positions physiques sont conservées pour les écritures. Les versions enrichies avec fédération/sport/discipline restent compatibles, et les doublons de noms canoniques sont refusés. Aucun classeur ni donnée connecté n’a été modifié.

lib/cnac/sheets.ts journalise désormais un message texte contenant code, message métier et noms des feuilles, au lieu d’un objet pouvant apparaître vide dans la console Next.js. Aucune erreur Google brute ni secret n’est journalisé.

Tests ajoutés dans tests/unit/cnac-connection.test.ts et tests/integration/cnac-territorial-divisions.test.ts : reproduction initiale de deux échecs MAPPING_COLUMNS avec les vrais en-têtes, puis 39 tests ciblés réussis et 28 tests d’intégration réussis. Build et TypeScript réussis ; lint sans erreur, deux avertissements existants. Les en-têtes de toutes les feuilles des deux classeurs CNAC sont acceptés en lecture réelle. La revue automatique a refusé un contrôle supplémentaire de toutes les lignes, car ce périmètre pouvait inclure des données personnelles ; la vérification distante a été limitée aux en-têtes.

## Division sportive de l’affiliation active — 4 octobre 2026

La division facultative appartient désormais exclusivement à ATHLETES.id_division (colonne Y du classeur connecté). Elle est retirée du modèle, des formulaires, des services de référence et des fiches Équipe. EQUIPES conserve onze colonnes et les créations sont limitées à A:K ; les anciens champs de division restent ignorés et ne sont jamais utilisés pour les nouvelles écritures.

Les formulaires Athlète présentent Fédération, Club, Équipe, Division sportive. Les options proviennent de DIVISIONS ; seules D1 à D4 sont autorisées. Changer le rattachement vide la division, sans jamais la déduire d’une équipe. La disponibilité reprend la configuration existante du parent direct du club : Zone ou Entente avec division_applicable activé. La fiche et la liste affichent le rattachement actif calculé, sans enregistrer ce libellé. Recherche et filtre de division sont disponibles dans la liste.

En-têtes EQUIPES et ATHLETES vérifiés en lecture seule, ainsi que les identifiants de DIVISIONS ; aucun classeur modifié. 43 tests ciblés et 31 tests d’intégration réussis ; TypeScript/build réussis ; lint sans erreur, deux avertissements existants. La suite unitaire complète compte 335 réussites sur 342, avec les sept échecs connus hors périmètre. Huit rendus Chromium desktop/mobile des composants de création/modification sont sans débordement. Les métadonnées Git sont absentes ; aucune session authentifiée complète n’a été testée.

Compte rendu et liste des fichiers : [cnac-athlete-active-division.md](implementation/cnac-athlete-active-division.md).

### Correction de la sélection Division sportive en création

Le contrôle du parent territorial désactivait à tort le champ de l’athlète. La sélection est désormais disponible dès le choix d’une fédération valide et avec un référentiel DIVISIONS disponible. Club et équipe restent facultatifs ; leurs liens sont vérifiés lorsqu’ils sont renseignés. La validation serveur suit cette même règle. Les options restent issues de DIVISIONS et la valeur est écrite dans ATHLETES.id_division. Le composant commun applique la correction en création et en modification, sans changement de disposition.

Régression couverte : création avec fédération sans club, club sans parent territorial, champ actif au rendu, sauvegarde de D1 et blocage des rattachements incohérents. 21 tests ciblés réussis.


## Fiche et liste des athletes - 4 octobre 2026

Routes CNAC : /dashboard/acteurs/athletes et /dashboard/acteurs/athletes/[id]. Sexe et age sont empiles et centres. La fiche conserve quatre onglets : General, Affiliations, Controles et AUT. General contient Identite, Contact, Identifiants et Observations. Les cartes Passeport et les onglets Documents, Equipes nationales et Selections sont retires de cette fiche uniquement. Controles et AUT affichent Coming soon.

Affiliations regroupe federation, sport, discipline, zone, ligue, entente, cercle, club, equipe, categorie et division. La hierarchie remonte depuis le club, au sein de sa federation, avec arret en cas d'ambiguite ou de cycle. Aucune donnee connectee modifiee.

Diagnostic : localhost:3000 sert CNAC ; les modifications initialement appliquees a FEBACO ont ete annulees. Verification du HTML et des clics Chromium sur localhost pour ATH-0001 : quatre onglets et quatre sections, affiliations, Coming soon et centrage de la liste valides a 1280 et 390 px. La barre laterale existante occupe encore 256 px sur mobile et reduit la largeur du contenu ; hors perimetre de ce changement. Les tests avec 127.0.0.1 ne terminaient pas l'hydratation React ; les interactions sont validees sur localhost, adresse utilisee par l'utilisateur.

Build reussi, lint sans erreur (deux avertissements preexistants), douze tests cibles reussis. Captures locales dans .cache/athlete-general-1280.png et .cache/athlete-affiliations-390.png.


## Suppression complete des divisions CNAC - 4 octobre 2026

Cette instruction remplace les descriptions precedentes de la division sportive. DIVISIONS, TYPES_STRUCTURE.division_applicable et ATHLETES.id_division sont retires du contrat CNAC. Le code des formulaires, types, filtres, recherches, resumes, schemas, mappers et services ne les utilise plus. Les charges de referentiels Athletes et Federations ne demandent aucune feuille DIVISIONS. La structure territoriale existante reste conservee.

ATHLETES contient exactement 24 colonnes : identite A:Q, medias R:U, observations V, club W et equipe X. Lectures et ajouts bornes a A:X ; les mises a jour suivent les positions physiques validees. Une ancienne colonne supplementaire n'est ni mappee ni ecrite. Les colonnes media font partie du contrat et restent conservees durant les changements d'identite. Aucun champ de remplacement ajoute.

Affiliation active conserve Federation, Club, puis Equipe pour les sports utilisant des equipes. Filtrage par federation/club, effacement de l'equipe lors du changement de club et prechargement en modification sont conserves. Le filtre Division est retire de la liste, avec redistribution des controles existants.

Verification : creation, modification d'identite, changement d'affiliation et rechargement avec les vrais handlers et un transport Sheets simule sans DIVISIONS ; ecritures W/X, aucune ecriture Y, conservation des autres valeurs. Verification navigateur sur localhost:3000 en 1280 et 390 px : formulaires sans Division, affiliation conservee apres rechargement et aucune erreur JavaScript. Aucune creation ni modification distante de donnees pendant ces controles. Captures dans .cache/athlete-no-divisions-create-1280.png et .cache/athlete-no-divisions-edit-390.png.

Build et TypeScript reussis ; lint sans erreur avec les deux avertissements preexistants. Suite integration : 33/33. Suite unitaire : 342/349 ; les sept echecs preexistants concernent les ceremonies/actions de competition, l'enveloppe d'acces T12, deux attentes de connexion, le formulaire des saisons et les couleurs de chargement. Aucun echec lie a la suppression des divisions.

FEBACO et les autres depots restent inchanges.


## Onglet Localisation de la fiche athlete - 4 octobre 2026

La fiche CNAC propose General, Affiliations, Localisation, Controles et AUT. Localisation affiche Coming soon dans la meme carte que Controles et AUT. Aucune section supplementaire dans General, aucun champ ni stockage ajoute. Adresse conservee dans Contact. Serveurs de developpement non relances.
