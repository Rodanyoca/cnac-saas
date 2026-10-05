# Cartographie COC → CNAC

## Chargement territorial — 5 octobre 2026

La fiche Fédération et les écritures territoriales ne chargent plus DIVISIONS ni CATEGORIES_CLUB. TYPES_STRUCTURE ne requiert plus division_applicable. Le formulaire Club retire sa catégorie ; les anciens champs de catégorie de club sont ignorés à l'enregistrement et id_categorie_club est facultatif à la lecture. Les équipes conservent la catégorie d'âge. Aucun classeur réel ni en-tête Google n'a été modifié.

Validation : huit tests d'intégration territoriale et trois tests unitaires ciblés réussissent. Lint sans erreur (deux avertissements existants). Turbopack compile ; le build complet reste bloqué par trois erreurs TypeScript des tests d'entraînement d'équipe, qui référencent des champs absents du type Equipe.

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

Les API `auth`, `dashboard`, `federations`, `athletes`, `officiels`, `coachs`, `medecins`, `arbitres`, `autres`, `competitions`, `equipes-nationales`, `activites`, `documents`, `site-web`, `users` et `upload-media` sont présentes. Elles exigent une session USERS CNAC valide et les autorisations serveur du bloc concerné. Les ressources externes doivent être propres au CNAC.

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


### 2026-10-04 - Acces administrateur CNAC local (historique, supprimé)

- Connexion email/mot de passe fixe, puis cookie de session signe de 8 heures, comme le parcours FEBACO.
- Activation explicite via `CNAC_LOCAL_AUTH=true`; identifiants et secret uniquement dans `.env.local`, ignore par Git.
- Aucun compte FEBACO/COC ni appel au classeur USERS pour cet acces.
- La connexion locale prend priorite sur le passage automatique du mode demonstration; les routes protegees exigent le cookie et la deconnexion le supprime.
- La connexion ouvre le tableau de bord et donne les droits administrateur CNAC. Les adaptateurs metier et classeurs CNAC restent inchanges.
- `NEXT_PUBLIC_CNAC_LOCAL_AUTH=true` masque le bouton de demonstration sur la page de connexion.


### 2026-10-04 - Image de connexion CNAC

- La page `/login` utilise la nouvelle photographie `public/education-antidopage-06.jpeg`.
- Texte alternatif adapte a la rencontre d’education antidopage ; disposition et styles conserves.
- Ancienne image `public/images/login/delegation-rdc.jpeg` supprimee apres verification de ses usages.


### 2026-10-04 - Confidentialite et conditions d’utilisation CNAC

- Deux pages publiques avant connexion : `/confidentialite` et `/conditions-utilisation`, avec liens sur le login, navigation croisee, sommaire et mise en page responsive.
- Textes institutionnels en version de relecture, dedies aux utilisateurs habilites du CNAC : finalites, categories de donnees, destinataires, droits, securite, usages autorises/interdits et gestion des acces.
- Les modules Controles, AUT et Localisation sont presentes comme a venir ; aucune collecte de donnees medicales ou de localisation deja operationnelle n’est revendiquee.
- Analyse du code : Google Sheets/Drive, hebergement prevu Vercel, cookie de session 8 heures, composant Web Analytics. Aucune region de stockage exclusivement nationale, purge automatique active ou garantie absolue de securite n’est affirmee.
- Contacts officiels confirmes par l’utilisateur : contact@cnac-onadrdc.com et cnac2006.rdcongo@gmail.com, affiches sur les deux pages. Les fondements precis par traitement, les durees exactes, les destinataires et garanties de transfert restent a valider par le CNAC avant adoption des textes.
- Aucune acceptation des conditions n’est enregistree par ces pages ; son integration au parcours d’authentification reste un lot ulterieur.
- Sources consultees le 4 octobre 2026 : Code du numerique RDC (https://are.gouv.cd/download/ordonnance-loi-23-010-du-13-mars-portant-code-du-numerique/), standard AMA en vigueur (https://www.wada-ama.org/en/resources/world-anti-doping-code-and-international-standards/international-standard-protection), Vercel Web Analytics (https://vercel.com/docs/analytics/privacy-policy). Le standard AMA 2027 annonce pour le 1er janvier 2027 n’est pas presente comme deja en vigueur.

- Ajustement login : liens Politique de confidentialite et Conditions d’utilisation places directement sous le formulaire, soulignes et plus contrastes.

### 2026-10-04 — Authentification réelle CNAC

Les anciens accès locaux et démonstration décrits plus haut sont supprimés. Login, activation obligatoire, compte et déconnexion utilisent exclusivement USERS CNAC, des mots de passe hachés et le cookie `cnac_session`. Les pages et API appliquent les permissions réelles et le contrôle d’origine des mutations. La déconnexion révoque les anciennes versions de session. Le premier administrateur est créé uniquement par le CLI, avec une identité fournie par le responsable et aucun mot de passe par défaut.

Les quatre feuilles d’authentification ont des en-têtes conformes, contrôlés en lecture seule. La clé de télémétrie locale a ensuite été configurée dans `.env.local`, sans versionnement ; la configuration est valide. Le contrôle à blanc du premier administrateur a réussi, sans création de compte par l’agent. Le guide [Authentification réelle CNAC](implementation/cnac-authentification-reelle.md) détaille les variables, commandes, contrôles et limites. COC et FEBACO restent inchangés.

### Formulaire Équipe : suppression des champs en double

Le dialogue d’ajout et de modification d’une équipe affiche les champs du composant `TeamSportingFields` une seule fois. L’éditeur conserve uniquement les identifiants CNAC et fédéral autour de ce composant ; il ne répète plus Nom, Club et Statut. Le club reste obligatoire, avec les mêmes valeurs et mappings d’enregistrement. Un test du dialogue complet contrôle l’unicité des champs dans les deux modes et la conservation des valeurs en modification.

### 2026-10-05 — Médias CNAC : logos et photos de profil

- Fédération : sélection facultative du logo en création et dans l’éditeur Identification ; logo conservé en l’absence de remplacement, aperçu et annulation de sélection. Les listes, fiches et paramètres affichent une image privée ou leur placeholder.
- Athlète : sélection facultative de la photo de profil dans les deux formulaires ; identité, Club/Équipe et structure territoriale préservés. Les uploads de passeports et des autres acteurs restent désactivés.
- Les colonnes existantes `logo_drive_id` / `logo_drive_url` de FEDERATIONS sont reconnues. ATHLETES reste strictement A:X (24 colonnes), Club en W et Équipe en X ; aucune colonne créée.
- Routes privées : `/api/federations/logo/[id]` et `/api/athletes/[id]/avatar`. Session et droits AUT-SPT requis, contrôle du dossier CNAC avant lecture, aucune permission publique Drive créée ; URL de page Drive jamais utilisée comme image.
- PNG, JPEG et WebP : limite de 4 Mo, signatures et décodage réel, refus des contenus endommagés et dimensions excessives. OAuth demeure exclusivement côté serveur, erreurs Google brutes exclues des réponses et logs.
- Sauvegarde en deux étapes : préparation sans écriture avec ticket signé lié à l’utilisateur et au contenu, puis commit privé avec relecture de confirmation. Création ENTITES/FEDERATIONS et champs métier/média regroupés dans un batch Sheets atomique. Une reprise vérifie le même identifiant et le même fichier réservé avant toute nouvelle création ; conserver le formulaire ouvert en cas de confirmation indisponible.
- Un ancien fichier n’est nettoyé qu’après confirmation, contrôle de son dossier et recherche des références dans les feuilles CNAC. Un fichier partagé est conservé ; si la recherche ou le nettoyage échoue, l’ancien fichier reste conservé. Une écriture non confirmable conserve le nouveau fichier pour la reprise, sans faux succès.
- Vérification réelle uniquement en lecture : colonnes médias présentes dans FEDERATIONS (15 colonnes), ATHLETES (24 colonnes) conforme. Les deux accès Drive ont répondu HTTP 401 avec la configuration actuelle ; les essais d’écriture réelle sont bloqués jusqu’au rétablissement de l’autorisation Google. Aucun fichier ni donnée de test écrit dans les ressources réelles ; COC utilisé en lecture seule.

Contrôles : lint sans erreur (deux avertissements existants), compilation et TypeScript validés, 50/50 tests d’intégration, 359/363 tests unitaires. Les quatre échecs préexistants concernent les compétitions et le formulaire de saison des équipes nationales. Le composant réel de sélection a été testé dans un navigateur à 1440 et 390 pixels : image existante, aperçu, remplacement, annulation, format interdit, limite de taille et placeholder.

Fichiers du lot :

- Formulaires et vues Athlètes : `app/dashboard/acteurs/athletes/athletes-client.tsx`, `page.tsx`, `[id]/athlete-detail-client.tsx` et `[id]/page.tsx`.
- Fédération : `components/dashboard/federation-create-sheet.tsx`, `federation-logo-manager.tsx`, `app/dashboard/federations/[id]/page.tsx` et `[id]/parametres/parametres-client.tsx`.
- Composants communs : `components/dashboard/image-selection.tsx`, `media-upload-dialog.tsx`, `cnac-actor-references.tsx` ; client `lib/api/confirmed-save.ts`.
- API : `app/api/athletes/[id]/avatar/route.ts`, `app/api/federations/logo/[id]/route.ts`, `app/api/federations/route.ts` et `app/api/upload-media/route.ts`.
- Coordination et mappings CNAC : `lib/cnac/media-save.ts`, `confirmed-save.ts`, `media-handler.ts`, `image-validation.ts`, `media-url.ts`, `media-config.ts`, `drive-ownership.ts`, `identifiers.ts`, `model.ts`, `sheets.ts`, `actor-handler.ts` et `territorial-handler.ts`.
- Services Fédération et Drive : `lib/federations/creation.ts`, `mappers.ts`, `logo.ts`, `logo-handler.ts`, `logo-data.ts` et `lib/google/drive.ts` ; `package.json` et `package-lock.json` déclarent explicitement le décodeur Sharp déjà installé.
- Tests : `tests/integration/cnac-media.test.ts` ; `tests/unit/cnac-confirmed-client.test.ts`, `cnac-image-validation.test.ts`, `cnac-connection.test.ts`, `federations-mappers.test.ts`, `federation-logo-handler.test.ts`, `federation-logo-replacement.test.ts`, `official-passport-upload.test.ts`.

### 2026-10-05 — Lieu et planning hebdomadaire des équipes

Les formulaires de création et modification des équipes comportent « Lieu et horaires d’entraînement » : lieu, adresse, fuseau IANA (dont Kinshasa et Lubumbashi) et créneaux hebdomadaires ajoutables, modifiables et supprimables. Aucun JSON n’est présenté à l’utilisateur. Les données restent facultatives et les anciennes lignes vides n’obtiennent aucun horaire ou fuseau fictif.

EQUIPES est lu et écrit sur A:O, quinze colonnes. Les quatre champs existants L:O sont reconnus par les types, mappings et payloads ; aucun en-tête ajouté par l’application. Une validation commune frontend/serveur impose les jours 1–7, HH:mm, une fin après le début, l’absence de doublons et de chevauchements par jour et un fuseau valide pour un planning renseigné. Les heures restent locales, sans conversion en dates UTC. Les créneaux consécutifs et plusieurs créneaux par jour sont autorisés.

Les modifications partielles conservent les champs absents ; une chaîne vide ou `[]` supprime explicitement le contenu concerné. Un planning historique illisible reste intact lors d’une modification sans rapport et déclenche un message d’anomalie. Son remplacement demande une action explicite dans le formulaire. Les erreurs Sheets ne produisent pas de succès ; les caches des équipes, fédérations et fiches Athlètes sont invalidés après écriture réussie.

Le détail d’équipe et l’onglet Localisation de l’athlète affichent « Entraînements habituels de l’équipe », le lieu, l’adresse, le fuseau et les horaires groupés du lundi au dimanche. La localisation utilise l’équipe active, vérifiée avec le club et la fédération, et suit les changements d’affiliation. Aucun champ ajouté à ATHLETES, qui reste A:X. Les états sans équipe, sans planning et avec anomalie sont explicites ; ce planning ne confirme pas la présence individuelle. Contrôles et AUT restent « Coming soon ».

Fichiers de ce lot :

- Modèle et Sheets : `lib/cnac/team-training.ts`, `schema.ts`, `sheets.ts`, `territorial-model.ts` ; `lib/federations/types.ts`, `mappers.ts`, `schema.ts`.
- Formulaires et affichage : `components/dashboard/team-training-fields.tsx`, `team-training-summary.tsx`, `team-sporting-fields.tsx` ; `app/dashboard/federations/[id]/parametres/parametres-client.tsx`, `app/dashboard/federations/[id]/structures/[typeId]/[structureId]/page.tsx`, `app/dashboard/acteurs/athletes/[id]/athlete-detail-client.tsx`.
- Tests : `tests/unit/cnac-team-training.test.ts`, `cnac-affiliation.test.ts`, `tests/integration/cnac-territorial-divisions.test.ts` ; documentation dans ce fichier.

Vérifications : build de production réussi, 53/53 tests d’intégration, 374/378 tests unitaires (les quatre échecs préexistants concernent les compétitions et équipes nationales), TypeScript validé, lint sans erreur avec deux avertissements préexistants. Playwright vérifie les composants réels à 1440 et 390 px : préchargement, réinitialisation, ajout, modification, suppression, chevauchement, préservation/correction explicite d’un planning illisible et changement d’équipe active, sans débordement ni erreur JavaScript. Les sauvegardes/rechargements sont testés avec un transport Sheets en mémoire ; aucune donnée de test écrite dans les classeurs réels, aucune modification du COC.
### 2026-10-05 — Bandeau, navigation et typographie : référence FEBACO

Pour cette passe, la consigne explicite de l’utilisateur remplace la référence visuelle COC par FEBACO. Les dépôts FEBACO et COC ont été consultés en lecture seule. Les routes, permissions, rubriques propres au CNAC, enfants dynamiques, authentification et données métier sont conservés.

| Élément | FEBACO inspecté | CNAC avant | Correction CNAC |
| --- | --- | --- | --- |
| Bandeau | Minimum 64 px ; 73 px mesurés avec sous-titre ; padding 12 × 24 px ; fond à 90 %, flou et ombre `0 10px 30px rgba(2,12,23,.18)` | 80 px avec sous-titre | Valeurs et composition de référence reprises ; titre 20 px / 700, sous-titre 14 px |
| Accent doré | Bordure de 2 px à gauche du titre, `#f6c515` ; aucune bordure droite dorée dans le code ou le rendu | Accent et composition différents | Accent gauche reproduit ; bordure droite de 2 px ajoutée conformément à la demande, distincte de la référence inspectée |
| Couleur de navigation | Texte inactif `#9db2c6`, opaque ; survol `#f7fafc` sur `#0d2d49` | Texte blanc hérité : `--sidebar-muted` existait, mais sa liaison Tailwind manquait | Ajout de `--color-sidebar-muted`, mêmes couleurs et états de survol ; focus clavier visible |
| Liens et icônes | Liens 40 px, texte 14 px / 500, icônes 20 px / trait 2, intervalle 12 px ; actif jaune sans ombre ajoutée | Sous-liens 36 px, icônes 16 px, actif plus gras avec ombre | Dimensions, épaisseurs et états harmonisés ; Flag pour Équipe nationale, Activity pour Activités ; Landmark conservé pour Fédérations |
| Sections | Acteurs, Competition, Equipe nationale, Administration | Regroupements et styles différents | Présentation regroupée avec ces titres ; toutes les rubriques CNAC et leurs enfants sont conservés, aucun module FEBACO ajouté |
| Police | Geist et Geist Mono réellement rendues ; chargement `next/font/google` | Inter déclarée mais non chargée ; Segoe UI effectivement rendue sous Windows, comme COC | Fontes et métriques exactes de la référence auto-hébergées ; variables globales harmonisées ; deux surcharges Inter du login supprimées |
| Repli et mobile | Largeurs 256 / 64 px ; à 390 px, sidebar permanente et titre masqué ; marge du contenu non réduite au repli | Navigation mobile et repli insuffisants | Même style et mêmes largeurs ; contenu adapté à 64 px au repli ; tiroir mobile avec fond, focus capturé, fermeture Escape et retour du focus, bandeau sans débordement |

Sources : `FEBACO/components/dashboard/header.tsx`, `sidebar.tsx`, `app/layout.tsx`, `app/globals.css` et fontes générées par son build ; `CNAC/app/layout.tsx`, `app/globals.css`, `app/login/login.module.css`, composants Header/Sidebar ; mêmes fichiers de police du COC. Tailwind 4 utilise les variables `@theme inline`, sans configuration Tailwind séparée. CNAC et COC avaient la même pile de police : aucune différence de fonte effectivement rendue entre eux dans le navigateur inspecté. Leurs différences de navigation provenaient notamment des couleurs et graisses. Les fontes distribuées incluent la licence SIL OFL officielle du projet Geist : https://github.com/vercel/geist-font.

Fichiers modifiés ou ajoutés : `app/dashboard/layout.tsx`, `app/globals.css`, `app/fonts.css`, `app/login/login.module.css`, `components/dashboard/header.tsx`, `sidebar.tsx`, `navigation-provider.tsx`, `lib/navigation/dashboard-presentation.ts`, `tests/unit/dashboard-navigation.test.ts`, ce rapport et `public/fonts/geist/` (11 fichiers WOFF2 et `OFL.txt`). Aucun changement de dépendance, variable d’environnement, route métier ou classeur.

Vérifications : build de production et TypeScript réussis ; 53/53 tests d’intégration ; 18/18 tests unitaires ciblant navigation, droits et redirections ; lint sans erreur, avec deux avertissements préexistants. Les rendus Chromium des composants réels ont été comparés à 1440 et 390 px, avec CSS compilé depuis chaque dépôt et fontes réellement utilisées contrôlées par le navigateur. Les assertions comparent dimensions, couleurs, fontes, espacements et ombres ; elles vérifient aussi la bordure droite dorée CNAC, le survol, le focus, le repli, les sections, le menu mobile et une erreur de déconnexion sans faux succès.

Captures locales de vérification, non versionnées : `.cache/visual-shell/desktop-comparison.png` (FEBACO à gauche, CNAC à droite), `cnac-after-390.png`, `cnac-open-390.png`, `cnac-collapsed-1440.png`, ainsi que les mesures avant/après. Les captures utilisent les composants réels dans un harnais isolé, et non des pages connectées aux classeurs ; cette passe ne revendique pas une validation métier en production. Aucun compte ni aucune donnée réelle de test n’a été créé.
### 2026-10-05 — Connexion réussie côté serveur mais annulée côté interface

Le client générique annulait les requêtes après 12 secondes. Une authentification qui terminait ses lectures et écritures Sheets puis répondait HTTP 200 à cette limite pouvait donc afficher une indisponibilité côté navigateur. Le formulaire utilise désormais `lib/auth/login-request.ts`, avec un délai spécifique borné à 60 secondes ; aucun nouvel essai automatique, aucune modification des contrôles de session, d’origine, des mots de passe ou de confirmation des écritures. Le délai des autres appels API reste inchangé.

Le test de non-régression simule une réponse réussie après 13 secondes avec des horloges contrôlées : échec constaté avant la correction, succès après. Un second test vérifie le délai maximal et l’absence de répétition. Les 16 tests ciblés connexion, session, navigation et résilience réussissent ; lint sans erreur avec les deux avertissements préexistants. Aucun identifiant réel utilisé ni aucune donnée de test écrite dans Sheets.
### 2026-10-05 — Suppression du passeport des athlètes

La suppression des cinq colonnes passeport dans ATHLETES remplace le précédent contrat A:X. Le contrat est désormais de 19 colonnes, A:S, avec `id_club_cnac` en R et `id_equipe_cnac` en S. Les champs `numero_passeport`, `date_de_delivrance_passeport`, `date_expiration_passeport`, `passeport_drive_id` et `passeport_drive_url` ne sont plus requis, lus ni écrits pour les athlètes. Les formulaires de création/modification, leur état initial, les payloads, le type de détail et le mapping de fiche ne contiennent plus de passeport. La validation de dates de passeport reste réservée aux autres catégories d’acteurs qui possèdent encore ces colonnes.

Identité, coordonnées, nationalité, observations, avatar privé et affiliation Club/Équipe sont conservés. Les tests d’intégration utilisent un transport Sheets en mémoire et vérifient les nouvelles plages, les positions physiques et la conservation des données. Vérifications : 65/65 tests ciblés existants et 2/2 nouveaux tests de non-régression, build de production/TypeScript réussis, lint sans erreur avec les deux avertissements préexistants. Aucune modification des en-têtes et aucune écriture dans les classeurs réels.

Fichiers : `lib/cnac/schema.ts`, `model.ts`, `sheets.ts`, `actors-model.ts` ; `app/dashboard/acteurs/athletes/athletes-client.tsx`, `[id]/page.tsx`, `[id]/athlete-detail-client.tsx` ; tests `athlete-without-passport.test.ts`, `cnac-affiliation.test.ts`, `cnac-connection.test.ts`, `cnac-media.test.ts`, `cnac-write-fixtures.test.ts`, `cnac-territorial-divisions.test.ts` et ce rapport.
### 2026-10-05 — Suppression du bandeau technique des acteurs

La section affichant « Sources CNAC », les dossiers d’upload et les habilitations est supprimée du layout commun des acteurs (`app/dashboard/acteurs/layout.tsx`). Le fournisseur des références Sexe et des capacités médias reste en place pour les formulaires.
### 2026-10-05 — Import du formulaire territorial

Le client des paramètres de fédération utilise `territorialEditorRow`, fonction réellement exportée, pour initialiser, ouvrir et enregistrer les éditeurs. L’ancien nom `withoutTerritorialDivision` n’est plus référencé dans le code applicatif. Le formulaire Équipe retrouve son bloc dédié avec une seule occurrence des champs Club, Nom et Statut. Les 20 tests d’intégration territoriale réussissent ; lint sans erreur avec les deux avertissements préexistants.
