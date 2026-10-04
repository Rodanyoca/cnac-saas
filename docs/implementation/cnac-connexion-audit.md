# CNAC — audit et matrice de connexion

## Projet et périmètre

Dossier : `cnac-cible`; package `cnac-management`. Aucun `.git` dans ce dossier au début de l’intervention : aucun dépôt, branche ou diff Git disponible. Les fichiers présents ont été conservés; empreintes initiales locales dans `.cache/cnac-before.json`. `.env.local` existait et n’a pas été modifié.

Instructions lues : `AGENTS.md`, `CONTEXT.md`, cartographie CNAC, documentation Acteurs, Fédérations, listes/détails et mappings Sheets. COC, FEBACO et FEVOCO sont en lecture seule. Cette intervention ne dynamise pas les autres blocs.

## Matrice initiale

| Page | Source initiale | Feuille CNAC cible | Mapper / service | Actions existantes | Écart constaté |
|---|---|---|---|---|---|
| `/dashboard/federations` | Service COC neutralisé par démonstration | `FEDERATIONS`, `ENTITES`, `SPORTS`, `CATEGORIES_ENTITES` | `federations/data`, `mappers`, `creation` | Création existante | Aucun secret; références CNAC à connecter |
| Fiche fédération, Structure territoriale | Services COC neutralisés | `HIERARCHIE`, `LIGUES`, `ENTENTES`, `CERCLES`, `CLUBS`, `EQUIPES` | `data`, `structure-model`, mappers | Consultation | IDs `*_cnac`, parents directs multisport |
| Paramètres fédération | API COC | Feuilles territoriales + identification fédération | `schema`, API `[resource]` | Créer, modifier, statut; supprimer un niveau hiérarchique déjà prévu | Alias obsolètes, validations de parent insuffisantes |
| Contacts d’entité | Contacts + acteurs + affiliations COC | `PERSONNES_CONTACT_ENTITES`, cinq types autorisés | `entity-contacts` | Créer, modifier, désactiver la relation | `id_acteur_cnac`, booléens, supprimer la dépendance aux affiliations |
| Acteurs, écran d’entrée | Compteurs codés en dur | Six feuilles acteurs | Adaptateur CNAC | Navigation | Compteurs à charger dans ce bloc uniquement |
| Athlètes, entraîneurs, arbitres : liste/détail | Lecture COC neutralisée | `ATHLETES`, `COACHS`, `ARBITRES`; fédérations et sexes | Pages + API + options | Création, édition et statut existants | IDs internes, zéros initiaux, dates, grades absents de la feuille acteurs |
| Officiels : liste/détail | Lecture COC + affiliations | `OFFICIELS`, `ENTITES`, `SEXES` | Pages + API | Création, édition et statut existants | Rattachement direct CNAC `id_entite`; aucune affiliation à créer |
| Médecins : liste/détail | Lecture COC neutralisée | `MEDECINS`, `ENTITES`, `SPECIALITES_MEDECIN`, `SEXES` | Pages + API | Création, édition, statut | `id_specialite_sante` spécifique |
| Autres : liste/détail/édition | Service COC neutralisé | `AUTRES`, `ENTITES`, `FEDERATIONS`, `SEXES` | `autres-data`, formulaire propre | Création, édition, statut | `type_autre_acteur`; pas de colonne nationale/internationale dans la feuille réelle |

## Classification des occurrences héritées

- `id_*_coc` : contrats internes de composants, adaptés explicitement aux colonnes physiques CNAC; aucun renommage global ni migration.
- `statut_affiliation_coc`, `date_affiliation_coc` : appartiennent réellement au Comité Olympique; conservés.
- IDs d’environnement `CNAC-DEMO` : valeurs temporaires actuelles, non utilisées comme source réelle par le nouveau service; erreur de configuration explicite.
- Cache `__coc*` : cache hérité séparé; nouveau cache dédié `__cnacScopedSheets`.
- `OFFICIELS_AFFILIATIONS` : hors périmètre; aucune lecture dans les nouveaux parcours CNAC.
- Autres modules et classeurs : restent isolés; anciens adaptateurs ne peuvent pas lire les trois classeurs via les nouveaux paramètres CNAC.
- Drive : pas d’OAuth ni dossier configuré; options facultatives séparées, aucune copie de fichier ou de secret.

## Vérification Google en lecture seule

Les trois titres et 28 feuilles pertinentes ont été vérifiés par le connecteur Google Drive. En-têtes enregistrés dans `docs/mappings/cnac-schema-verified.json`. La colonne `observations` existe dans les contacts. `AUTRES` ne possède ni `id_national` ni `id_international`. `SEXES` contient `01` MASCULIN, `02` FEMININ et `03` MIXTE réservé aux structures collectives. Les cinq premières lignes territoriales inspectées sont vides : ne pas en déduire que toutes les données du classeur sont absentes.

Les ID acteurs lus conservent les conventions `ATH.000001`, `COA.000001`, `OFF.000001`, `MED.000001`, `ARB.000001`, `AUT.000001`. Aucun identifiant ni enregistrement modifié.

## Stratégie de création

Les IDs existants restent intacts. Les nouvelles fiches utilisent le préfixe de leur type, suivi d’un UUID pour éviter une séquence dépendant du nombre de lignes et réduire les collisions entre instances. Structures : fédération/type/UUID; contacts : PCE/UUID. Les références restent des chaînes. Sheets ne fournit pas de transaction ou contrainte d’unicité applicative : la vérification avant append ne garantit pas l’atomicité inter-instance.
