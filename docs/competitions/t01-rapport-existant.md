# Bloc COMPÉTITIONS — T01 — Audit documentaire, fonctionnel et technique

Date de l'audit : 1er septembre 2026  
Statut : terminé en lecture seule  
Périmètre : sources primaires versionnées dans le dépôt et code existant  
Hors périmètre : modification du code, des feuilles ou des référentiels, backlog consolidé

## 1. Objet et méthode

Ce rapport établit l'existant du bloc Compétitions avant toute implémentation. Il distingue :

- les règles normatives du SNDS ;
- leur profil fonctionnel dans le cahier des charges du COC ;
- les décisions explicites transmises pour le démarrage du bloc ;
- le schéma physique déjà documenté ;
- le comportement réellement implémenté dans le dépôt.

La hiérarchie documentaire appliquée est celle de `docs/contexte-projet.md` : SNDS pour les concepts communs, cahier des charges pour la cible du COC, puis code et tests pour constater l'implémentation. Une divergence du code n'est donc pas interprétée comme une règle métier.

Sources examinées :

- `CONTEXT.md` ;
- `docs/contexte-projet.md` ;
- `docs/snds.pdf`, particulièrement les pages PDF 5 à 9 et 17 à 26 ;
- `docs/cahier-des-charges-coc.pdf`, particulièrement les pages PDF 2 à 6, 9 à 14 et 17 à 27 ;
- `docs/mappings/google-sheets-workbooks.md` ;
- `docs/lot-2-matrice-routes-t05.md` ;
- `docs/lot-2-utilisateurs-authentification-autorisations.md` ;
- `docs/adr/0001-authentification-locale-dans-google-sheets.md` et `docs/adr/0002-autorisations-explicites-et-revocation-par-version.md` ;
- `docs/interfaces/regles-listes-et-details.md` ;
- les couches `lib/competitions/`, `lib/equipes-nationales/`, `lib/documents/` ;
- les pages et API sous `app/dashboard/competitions/`, `app/api/competitions/` et les relations affichées sous `app/dashboard/equipes-nationales/` ;
- les composants de formulaire et de synthèse associés sous `components/dashboard/` ;
- les tests versionnés sous `tests/`.

La recherche de modèles Basket et Volleyball n'a trouvé aucun fichier, module ou test propre à ces sports dans le dépôt. Leurs particularités ne sont décrites que dans la demande de lancement et, de façon générique, par le cahier des charges (segments de score). Elles ne constituent donc pas encore des implémentations de référence locales.

> **Vérification réelle limitée — 1er septembre 2026.** Une lecture authentifiée et strictement non mutante a confirmé la présence des 7 onglets ciblés du classeur Compétitions, des 4 onglets ciblés du classeur Équipes nationales et des 11 référentiels ciblés. Leurs en-têtes sont conformes à `docs/mappings/google-sheets-workbooks.md` et tous ces onglets contiennent 0 ligne. La relation physique `COMPETITIONS_EQUIPES_NATIONALES` est donc bien, à ce jour, la relation directe `id_competition` / `id_equipe_nationale`. L'analyse des valeurs, doublons, orphelins et validations effectivement exercées est sans objet tant que les feuilles sont vides. T02 reste néanmoins requis pour produire le rapport formel d'écarts et faire valider les décisions structurelles avant toute insertion.

## 2. Socle métier confirmé

### 2.1 Principes SNDS

Le SNDS impose les principes suivants :

- une donnée est définie une seule fois dans son bloc de référence puis reliée par identifiant stable ;
- les caractéristiques stables sont séparées des situations temporelles ;
- l'origine, le responsable, le statut et l'historique utile sont conservés ;
- les référentiels nationaux sont complétés, et non concurrencés, par les particularités fédérales ;
- une donnée absente, inconnue ou non applicable représente trois états différents ;
- la qualité couvre complétude, conformité, cohérence, actualité et unicité.

Sources : `docs/snds.pdf`, pages PDF 5 à 9, 22 et 23 ; synthèse d'application dans `docs/contexte-projet.md`.

Pour le bloc Compétitions, le SNDS distingue l'événement récurrent (« compétition »), sa réalisation temporelle (« édition »), le participant, la phase ou épreuve, la rencontre ou le passage, le résultat, le classement et le palmarès ou record. Un résultat doit être rattaché à une rencontre, un passage ou une épreuve identifiable. Une correction après homologation doit être justifiée et conserver la décision précédente.

Source : `docs/snds.pdf`, pages PDF 18 et 19.

Pour le bloc Équipes nationales, le SNDS distingue l'équipe durable, la campagne, la sélection d'athlète, le staff et la participation nationale. Les participants, résultats, classements, palmarès et records restent dans le bloc Compétitions ; l'équipe nationale ne conserve que les liens permettant de les retrouver.

Source : `docs/snds.pdf`, pages PDF 19 et 20.

### 2.2 Profil COC confirmé

Le cahier des charges précise une cible V1 où :

- une compétition multisport est enregistrée une seule fois et détaillée par programmes ;
- une campagne relie une équipe nationale durable à un objectif et à une période ;
- une sélection ne prouve pas la participation effective ;
- l'engagement relie une campagne à un programme de compétition ;
- la participation effective d'un athlète relie une sélection à l'engagement de l'équipe ;
- le résultat général peut être détaillé en segments et performances individuelles ;
- le rang d'une épreuve n'est pas un ranking général d'athlète ;
- les résultats sportifs peuvent être enregistrés sans calcul automatique d'un classement individuel.

Sources : `docs/cahier-des-charges-coc.pdf`, pages PDF 4 et 9 à 13.

Les feuilles cibles décrites par ce document sont :

| Feuille | Fonction cible | Clé principale | Relations principales |
| --- | --- | --- | --- |
| `COMPETITIONS` | Événement/édition suivi par le COC dans le profil actuel | `id_competition` | types, niveaux, statuts |
| `PROGRAMMES_COMPETITION` | Programme, discipline ou épreuve d'une compétition | `id_programme_competition` | compétition, épreuve, âge, sexe |
| `COMPETITIONS_EQUIPES_NATIONALES` | Engagement d'une campagne dans un programme | `id_participation_equipe` | programme, campagne, statut |
| `PARTICIPATIONS_ATHLETES_COMPETITION` | Présence effective d'un athlète sélectionné | `id_participation_athlete` | engagement d'équipe, sélection |
| `RESULTATS` | Résultat général | `id_resultat` | engagement, programme, décision, unité |
| `RESULTATS_SEGMENTS` | Détail par set, manche, mi-temps, quart-temps ou round | `id_segment_resultat` | résultat, type de segment |
| `PERFORMANCES_INDIVIDUELLES` | Mesure, rang, record ou meilleure performance | `id_performance` | résultat, participation effective, type et unité |
| `EQUIPES_NATIONALES` | Identité durable de l'équipe | `id_equipe_nationale` | fédération, sport, discipline, catégorie, sexe |
| `CAMPAGNES_EQUIPES_NATIONALES` | Mobilisation temporelle de l'équipe | `id_campagne` | équipe nationale |
| `SELECTIONS_ATHLETES` | Athlète retenu dans une campagne | `id_selection` | campagne, athlète |
| `AFFECTATIONS_STAFF` | Membre du staff affecté à une campagne | `id_affectation_staff` | campagne, acteur, rôle |

Source : `docs/cahier-des-charges-coc.pdf`, pages PDF 9 à 13.

### 2.3 Décisions de lancement à préserver

La demande de lancement confirme et affine le profil COC :

- toutes les compétitions suivies dans ce périmètre concernent les équipes ou campagnes nationales ;
- compétition et équipe nationale restent deux blocs distincts mais explicitement reliés ;
- un événement multisport n'est jamais dupliqué par sport ;
- présélection, sélection, participation effective, retrait, remplacement et absence doivent rester distinguables ;
- la participation ne doit jamais être inférée automatiquement de la sélection ;
- le résultat appartient à la compétition et peut exprimer score, rang, médaille, qualification, élimination, mesure, record ou distinction ;
- les particularités sportives passent par segments, mesures ou performances plutôt que par une table différente par sport ;
- le système enregistre un classement officiel, mais n'en invente ni n'en recalcule un sans règle officielle ;
- la fédération produit et valide la donnée, le COC la consolide sans correction silencieuse ;
- l'accès relève de `AUT-SPT` : lecture avec attribution active, écriture pour `ADMIN` avec attribution active, contrôlée côté serveur.

Source primaire de la mission : pièce jointe `pasted-text.txt` transmise avec T01.

## 3. Existant documentaire et schéma physique documenté

`docs/mappings/google-sheets-workbooks.md` documente déjà les sept feuilles du classeur `07_COMPETITIONS`, les quatre feuilles de `08_EQUIPES_NATIONALES`, ainsi que les référentiels de types, formats, unités, épreuves, résultats, segments, décisions, niveaux et statuts.

Cependant, son schéma documenté pour `COMPETITIONS_EQUIPES_NATIONALES` est :

`id_participation_equipe`, `id_competition`, `id_equipe_nationale`, `statut_participation`, `date_engagement`, `observations`.

Ce schéma diverge du cahier des charges, qui relie l'engagement à `id_programme_competition` et `id_campagne`. Le mapping documente donc une relation directe compétition-équipe permanente, tandis que la cible métier exige une relation programme-campagne.

Autres variations documentaires à vérifier en T02 :

- le cahier des charges utilise `observation` au singulier sur cette relation ; le mapping annonce `observations` au pluriel ;
- `SELECTIONS_ATHLETES` utilise `id_athlete_coc` dans le cahier des charges, mais `id_athlete` dans le mapping documenté et dans la lecture actuelle de `lib/equipes-nationales/data.ts` ;
- le référentiel documenté est `ROLES_STAFF_EQUIPE_NATIONALE`, alors que `getNationalTeamReferences()` tente de lire `ROLES_EQUIPE_NATIONALE`, puis retombe silencieusement sur une liste codée en dur ;
- le référentiel physique documente `STATUTS_PARTICIPATION_COMPETITION`, mais l'interface utilise quatre valeurs codées en dur sans lire cette feuille.

Un contrôle complémentaire strictement non mutant, réalisé le 1er septembre 2026, confirme que les sept onglets de `07_COMPETITIONS`, les quatre onglets de `08_EQUIPES_NATIONALES` et les onze référentiels ciblés existent avec les en-têtes documentés. Ils contiennent tous zéro ligne. Ce contrôle confirme la relation physique directe actuellement prévue, mais ne permet de valider aucune valeur de référentiel, relation réellement exercée par des données, convention d'identifiant ou donnée métier.

## 4. Implémentation réellement présente

### 4.1 Couche de données

`lib/competitions/data.ts` lit et écrit seulement :

- `COMPETITIONS` ;
- `COMPETITIONS_EQUIPES_NATIONALES`.

Il adapte `id_niveau_competition`, `id_statut_competition` et `observation` vers les noms fonctionnels historiques. Il charge le type de compétition et les équipes nationales, génère des identifiants séquentiels `COMP####` et `PEN####`, puis autorise création et modification.

Les cinq feuilles `PROGRAMMES_COMPETITION`, `PARTICIPATIONS_ATHLETES_COMPETITION`, `RESULTATS`, `RESULTATS_SEGMENTS` et `PERFORMANCES_INDIVIDUELLES` ne sont référencées par aucun module applicatif. Il n'existe donc actuellement aucun mapping, lecture, validation ou mutation pour ces objets.

Le modèle TypeScript `lib/competitions/types.ts` omet `est_multisport` bien que `lib/competitions/data.ts` exige cet en-tête physique. La valeur est ainsi vérifiée dans le schéma, mais non mappée, non affichée et non modifiable. Le même modèle présente `edition` comme simple champ de `COMPETITIONS` : la distinction SNDS entre compétition récurrente et édition n'est pas matérialisée.

La validation `lib/competitions/validation.ts` exige nom, type, date de début et statut, et contrôle seulement l'ordre des dates et une liste locale de statuts. Elle ne valide pas : niveau et statut contre leurs référentiels physiques, cohérence monosport/multisport, unicité métier, dates de programmes, campagne, sélection, participation, résultat, unité, décision ou homologation.

La création d'un engagement vérifie seulement l'existence de la compétition et de l'équipe. Elle empêche un doublon sur le couple compétition-équipe, mais ne peut exprimer plusieurs campagnes ou programmes pour la même équipe. Elle ne conserve ni fédération source, ni validation fédérale, ni campagne.

### 4.2 Interfaces

La liste `app/dashboard/competitions/competitions-client.tsx` fournit : recherche, filtres type/statut/niveau, quatre compteurs, colonnes principales et nombre d'équipes rattachées. Elle couvre l'essentiel de la liste demandée, sauf le caractère mono/multisports. Sa table est placée dans `overflow-x-auto`, en contradiction avec la règle versionnée interdisant le défilement horizontal aux résolutions prises en charge (`docs/interfaces/regles-listes-et-details.md`).

La création existe dans une page dédiée `app/dashboard/competitions/nouveau/page.tsx`. La modification existe dans un volet latéral depuis la fiche. Le langage visuel n'est donc pas encore homogène entre création et modification.

La fiche `app/dashboard/competitions/[id]/competition-detail-client.tsx` propose trois onglets : général, équipes nationales, documents. Elle ne présente pas :

- mono/multisports ;
- programmes, sports, disciplines et épreuves ;
- campagnes engagées ;
- participants effectifs ;
- résultats ;
- segments ;
- performances individuelles ;
- origine et validation fédérales.

L'onglet « Équipes nationales » ajoute directement une équipe permanente avec un statut local. Le libellé « participation » est donc plus fort que la relation réellement prouvée : ni campagne, ni programme, ni présence effective ne sont établis.

La fiche équipe nationale `app/dashboard/equipes-nationales/[id]/team-detail-client.tsx` expose les membres agrégés et les compétitions reliées directement à l'équipe. Elle ne présente pas les campagnes comme objets consultables et mélange, pour l'affichage, sélections d'athlètes et affectations de staff sous le concept générique de « membres ».

### 4.3 API, autorisations et traçabilité

Les routes existantes couvrent :

- `GET`, `POST`, `PUT /api/competitions` ;
- `GET /api/competitions/[id]` ;
- `GET`, `POST`, `PUT /api/competitions/[id]/equipes-nationales`.

Il n'existe aucune route pour programmes, campagnes depuis le bloc compétition, participations effectives, résultats, segments ou performances.

La politique centrale documentée dans `docs/lot-2-matrice-routes-t05.md` classe `/dashboard/competitions/**` et `/api/competitions/**` dans `AUT-SPT`, avec écriture réservée à `ADMIN`. Les pages calculent aussi `canAccess("AUT-SPT", "WRITE")` pour masquer les actions. La décision d'autorisation est donc documentée et reflétée dans l'interface ; sa non-régression serveur devra être couverte par des tests propres au bloc.

Les mutations Compétitions appellent directement les fonctions Sheets et ne produisent pas d'entrée dans `JOURNAL_OPERATIONS`. Elles ne portent pas non plus de `request_id`, de relecture immédiate avant écriture, de compensation ou de vérification post-écriture. Elles ne satisfont donc pas encore la règle d'opération fonctionnelle unique et traçable exposée dans le cahier des charges, ni le niveau de robustesse déjà documenté pour le LOT 2.

### 4.4 Résilience et cache

Les pages serveur utilisent `force-dynamic` et isolent partiellement les erreurs secondaires sur la fiche via `Promise.allSettled`. Une panne des équipes ou documents n'empêche pas l'affichage de la compétition principale. Cela va dans le sens du cahier des charges.

En revanche :

- la liste transforme toute erreur de chargement en liste vide accompagnée d'un message global ;
- les valeurs secondaires absentes sont affichées principalement par un tiret, sans distinguer « non renseigné », « inconnu », « non applicable » ou relation introuvable ;
- les anomalies ne sont ni qualifiées ni remontées ;
- l'API renvoie souvent toute erreur métier en HTTP 400, sans typologie stable ;
- les générations d'identifiants par maximum local ne sont pas protégées contre deux écritures concurrentes.

Le dashboard agrège compétitions et rattachements directs par type (`lib/competitions/dashboard.ts`). Les mutations invalident le chemin du dashboard et le tag `competitions-dashboard`. Aucun indicateur ne couvre encore participation effective, résultats, performances, qualité ou provenance.

### 4.5 Tests

Aucun fichier de test dédié aux compétitions, campagnes, sélections, participations ou résultats n'est présent sous `tests/`. Les seules couvertures indirectes constatées portent sur la navigation et la politique générale des routes. Il n'existe donc pas de preuve automatisée locale pour : mappings, validations, multi-sport, séparation sélection/participation, résultats, résilience relationnelle, autorisations de mutation ou responsive des listes Compétitions.

## 5. Écarts et contradictions prioritaires

| Priorité | Sujet | Référence attendue | Existant constaté | Conséquence |
| --- | --- | --- | --- | --- |
| Bloquante avant écriture structurelle | Engagement | campagne → programme | équipe permanente → compétition | Impossible de représenter correctement campagnes et multisport |
| Bloquante avant modèle final | Compétition/édition | objets distincts dans le SNDS | `edition` est un champ de `COMPETITIONS` | Ambiguïté sur récurrence, identité et historique |
| Haute | Multi-sport | compétition unique + programmes | `est_multisport` ignoré, aucun programme lu | Risque de duplication par sport |
| Haute | Sélection/participation | objets distincts, aucune inférence | aucune participation effective implémentée | Impossible de prouver la présence réelle |
| Haute | Résultats | résultat, segments, performances, homologation | aucune couche applicative | Fiche incomplète et aucun suivi sportif exploitable |
| Haute | Responsabilité | origine et validation fédérales | aucun champ ni workflow constaté | Consolidation sans provenance démontrable |
| Haute | Référentiels | valeurs contrôlées | plusieurs listes locales codées en dur | Divergence possible avec les feuilles réelles |
| Haute | Écriture | commande cohérente, auditée, reprise explicite | écritures directes sans audit/idempotence | Risque de doublon ou succès partiel silencieux |
| Moyenne | Équipes nationales | campagnes visibles, sélections et staff séparés | agrégation générique en « membres » | Perte de lisibilité métier |
| Moyenne | Résilience | états absent/inconnu/non applicable/invalide | tiret générique et erreurs peu typées | Anomalies non actionnables |
| Moyenne | Interface responsive | aucune barre horizontale | tables avec `overflow-x-auto` | Écart au standard d'interface validé |
| Haute | Tests | vérification des relations et mutations | aucune suite Compétitions | Régression non détectée |

## 6. Questions réellement bloquantes

Ces questions ne trouvent pas de réponse certaine dans les sources versionnées et doivent être résolues avant les tickets de modélisation ou de mutation :

1. Le schéma physique vide de `COMPETITIONS_EQUIPES_NATIONALES` doit-il être migré du couple `id_competition`/`id_equipe_nationale` vers le couple métier `id_programme_competition`/`id_campagne` avant toute première donnée ? L'absence de lignes rend la migration simple, mais ne l'autorise pas sans validation humaine.
2. Pour la V1 COC, faut-il introduire un objet/onglet `EDITIONS_COMPETITION` conforme au SNDS, ou confirmer explicitement que chaque ligne `COMPETITIONS` représente une édition et qu'un identifiant de compétition récurrente est différé ? Cette décision modifie les clés et toutes les relations.
3. Quel objet et quels champs portent formellement l'organisation productrice, la fédération responsable, l'état de validation et l'homologation d'un résultat ? Ces informations sont obligatoires conceptuellement, mais absentes du schéma cible détaillé actuel.
4. Quelles valeurs officielles doivent distinguer présélectionné, sélectionné, participant, retiré, remplacé et absent, et sur quels objets s'appliquent-elles ? Les sources donnent les concepts, mais les référentiels physiques sont vides.
5. Un classement officiel doit-il être représenté en V1 par une feuille dédiée conforme au SNDS, ou seulement comme rang/performance transmis dans les résultats ? La cible envisagée ne contient pas de feuille `CLASSEMENTS`, bien que le SNDS distingue cet objet.
6. Médaille, qualification, élimination, distinction et record sont-ils tous exprimables par `TYPES_RESULTAT`, `RESULTATS_SYNTHETIQUES` et `DECISIONS_RESULTATS`, ou faut-il une relation dédiée ? Les en-têtes existent, mais les référentiels vides ne permettent pas de trancher.

Les choix de disposition visuelle, de libellés secondaires ou d'ordre des onglets ne sont pas bloquants : ils peuvent être déduits du langage visuel existant après stabilisation du modèle.

## 7. Premières implications pour une V1 cohérente

Sous réserve de T02 et des décisions bloquantes, le noyau V1 minimal devrait :

1. conserver les onze objets déjà prévus dans le cahier des charges, mais ne retenir que ceux prouvés utiles par les feuilles et scénarios réels ;
2. faire de `campagne → programme de compétition` la relation d'engagement, jamais `équipe permanente → compétition` ;
3. conserver une participation effective explicite par sélection, sans déduction automatique ;
4. représenter les résultats par un noyau commun, puis segments et mesures individuelles facultatifs ;
5. résoudre sport et discipline d'un programme via `EPREUVES`, sans recopier leurs libellés ;
6. utiliser exclusivement les identifiants des acteurs, équipes, campagnes, programmes et référentiels ;
7. ajouter au modèle opérationnel la provenance, la validation et, pour les résultats, l'homologation/historique de correction ;
8. interdire tout recalcul de classement en l'absence d'une règle officielle versionnée ;
9. charger chaque section secondaire indépendamment afin que la fiche principale reste consultable ;
10. exposer des états distincts pour absence, inconnue, non-applicabilité, valeur invalide et source indisponible ;
11. placer création et modification dans le même patron d'interface validé, en réutilisant les volets et formulaires existants ;
12. encapsuler chaque mutation multi-feuilles dans une commande serveur idempotente, auditée et vérifiable ;
13. prévoir des tests unitaires de modèle/mapping/validation, des tests d'intégration des commandes et droits, puis des tests d'interface responsive et de résilience.

## 8. Condition de clôture T01

T01 est clôturable sur le périmètre documentaire et technique du dépôt : l'existant, les décisions confirmées, les contradictions, les lacunes et les questions bloquantes sont identifiés et traçables.

La condition d'ouverture de T02 est respectée : aucune donnée réelle ni structure Google Sheets n'a été modifiée. Le contrôle non mutant a confirmé l'existence et la vacuité des onglets ciblés. Les contrôles de valeurs, doublons et orphelins sont actuellement sans objet ; T02 doit toutefois formaliser l'écart entre le schéma physique direct et le modèle campagne-programme, arrêter les référentiels minimaux et obtenir une validation humaine avant toute évolution structurelle ou insertion de données.
