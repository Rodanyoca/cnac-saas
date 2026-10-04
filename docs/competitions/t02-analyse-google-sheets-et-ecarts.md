# Bloc COMPÉTITIONS — T02 — Analyse réelle des Google Sheets et rapport d’écarts

Date : 1er septembre 2026  
Statut : terminé en lecture seule  
Source : API Google Sheets avec portée `spreadsheets.readonly`  
Périmètre : classeurs `07_COMPETITIONS`, `08_EQUIPES_NATIONALES`, `00_REFERENTIELS` et feuilles utiles de `02_ACTEURS`

## 1. Méthode et limites

L’inspection a suivi une séquence bornée : métadonnées des classeurs, titres exacts et `sheetId`, puis lecture de `A1:ZZ1000` pour les en-têtes et volumes et de la zone utile des 100 premières lignes pour les validations et notes. Aucun appel d’écriture n’a été exécuté, aucun fichier d’environnement n’a été lu ou modifié manuellement et aucune donnée personnelle n’est reproduite ici.

Les feuilles Compétitions et Équipes nationales étant vides, les contrôles de doublons, de conventions d’identifiants et de relations orphelines y sont sans objet. Les feuilles Acteurs ont seulement été contrôlées par en-têtes et volumes : aucun nom, contact, passeport ou identifiant personnel n’est publié.

## 2. Inventaire réel

### 2.1 Classeur `07_COMPETITIONS`

| Onglet | `sheetId` | En-têtes physiques | Lignes | Ligne figée | Validation/protection |
| --- | ---: | --- | ---: | --- | --- |
| `COMPETITIONS` | `0` | `id_competition`, `nom_competition`, `id_type_competition`, `id_niveau_competition`, `edition`, `est_multisport`, `date_debut`, `date_fin`, `pays`, `ville`, `lieu`, `id_statut_competition`, `observation` | 0 | oui | aucune |
| `PROGRAMMES_COMPETITION` | `836581029` | `id_programme_competition`, `id_competition`, `id_epreuve`, `id_categorie_age`, `id_sexe`, `date_debut`, `date_fin`, `observation` | 0 | oui | aucune |
| `COMPETITIONS_EQUIPES_NATIONALES` | `1039258966` | `id_participation_equipe`, `id_competition`, `id_equipe_nationale`, `statut_participation`, `date_engagement`, `observations` | 0 | non | aucune |
| `PARTICIPATIONS_ATHLETES_COMPETITION` | `1035995058` | `id_participation_athlete`, `id_participation_equipe`, `id_selection`, `date_participation`, `observation` | 0 | oui | aucune |
| `RESULTATS` | `1246289078` | `id_resultat`, `id_participation_equipe`, `id_programme_competition`, `date_resultat`, `phase`, `adversaire`, `pays_adversaire`, `id_resultat_synthetique`, `valeur_rdc`, `valeur_adversaire`, `id_unite_mesure`, `id_decision_resultat`, `observation` | 0 | oui | aucune |
| `RESULTATS_SEGMENTS` | `728425009` | `id_segment_resultat`, `id_resultat`, `id_type_segment`, `numero_segment`, `valeur_rdc`, `valeur_adversaire`, `observation` | 0 | oui | aucune |
| `PERFORMANCES_INDIVIDUELLES` | `1221648568` | `id_performance`, `id_resultat`, `id_participation_athlete`, `id_type_resultat`, `valeur`, `id_unite_mesure`, `rang`, `est_record`, `est_meilleure_performance`, `observation` | 0 | oui | aucune |

Il n’existe ni plage nommée, ni fusion, ni note de cellule, ni plage protégée sur les zones inspectées.

### 2.2 Classeur `08_EQUIPES_NATIONALES`

| Onglet | `sheetId` | En-têtes physiques | Lignes | Ligne figée | Validation/protection |
| --- | ---: | --- | ---: | --- | --- |
| `EQUIPES_NATIONALES` | `0` | `id_equipe_nationale`, `id_federation`, `id_sport`, `id_discipline`, `nom_equipe_nationale`, `id_categorie_age`, `id_sexe`, `date_debut`, `date_fin`, `statut`, `observation` | 0 | oui | aucune |
| `CAMPAGNES_EQUIPES_NATIONALES` | `1968408011` | `id_campagne`, `id_equipe_nationale`, `nom_campagne`, `date_debut`, `date_fin`, `objectif`, `statut`, `observation` | 0 | oui | aucune |
| `SELECTIONS_ATHLETES` | `1353114118` | `id_selection`, `id_campagne`, `id_athlete`, `id_poste`, `id_categorie_poids`, `id_grade_sportif`, `numero_maillot`, `date_selection`, `statut_selection`, `observation` | 0 | non | aucune |
| `AFFECTATIONS_STAFF` | `893469541` | `id_affectation_staff`, `id_campagne`, `id_acteur_coc`, `id_type_acteur`, `id_role_staff`, `date_debut`, `date_fin`, `observation` | 0 | oui | aucune |

Il n’existe ni plage nommée, ni fusion, ni note de cellule, ni plage protégée sur les zones inspectées.

### 2.3 Référentiels nécessaires

Tous les onglets ci-dessous existent avec les en-têtes documentés, mais sont vides :

- `TYPES_COMPETITION` ;
- `NIVEAUX_COMPETITION` ;
- `STATUTS_COMPETITION` ;
- `STATUTS_PARTICIPATION_COMPETITION` ;
- `EPREUVES` ;
- `FORMATS_PARTICIPATION` ;
- `UNITES_MESURE` ;
- `TYPES_RESULTAT` ;
- `RESULTATS_SYNTHETIQUES` ;
- `TYPES_SEGMENTS_RESULTATS` ;
- `DECISIONS_RESULTATS` ;
- `ROLES_STAFF_EQUIPE_NATIONALE` ;
- `POSTES_ATHLETES` ;
- `CATEGORIES_POIDS` ;
- `GRADES_SPORTIF` ;
- `CATEGORIES_AGE`.

Les référentiels généraux déjà alimentés sont `SEXES` (3 lignes), `SPORTS` (57), `DISCIPLINES` (61), `FEDERATIONS` (28) et `TYPES_ACTEURS` (6). Ils peuvent fournir les identifiants de rattachement, mais ils ne suffisent pas à créer une compétition, une équipe, une campagne, une sélection ou un résultat conforme.

Trois noms anticipés pendant l’audit n’existent pas : `STATUTS_SELECTION`, `POSTES` et `GRADES_SPORTIFS`. Les noms physiques réels sont respectivement : aucun onglet pour les statuts de sélection, `POSTES_ATHLETES` et `GRADES_SPORTIF`. Le référentiel de sexe réel est `SEXES`, pas `SEXE`.

### 2.4 Feuilles Acteurs consommées

| Feuille | Clé physique | Lignes métier |
| --- | --- | ---: |
| `ATHLETES` | `id_athlete_coc` | 2 |
| `COACHS` | `id_coach_coc` | 2 |
| `MEDECINS` | `id_medecin_coc` | 3 |
| `OFFICIELS` | `id_officiel_coc` | 13 |
| `ARBITRES` | `id_arbitre_coc` | 1 |
| `AUTRES` | `id_autre_acteur_coc` | 3 |

`SELECTIONS_ATHLETES.id_athlete` doit résoudre `ATHLETES.id_athlete_coc` au moyen d’un mapping explicite. Le nom fonctionnel ne doit jamais conduire à enregistrer une seconde identité. `AFFECTATIONS_STAFF.id_acteur_coc` doit être interprété conjointement avec `id_type_acteur`, car les clés physiques varient selon la feuille Acteurs.

## 3. Matrice des relations réelles et cibles

| Objet source | Relation physique actuelle | Cible métier | État |
| --- | --- | --- | --- |
| Compétition | types/niveau/statut par ID | identique | structure prête, référentiels vides |
| Programme | compétition/épreuve/âge/sexe par ID | identique | structure prête, référentiels partiellement vides |
| Engagement équipe | `id_competition` + `id_equipe_nationale` | `id_programme_competition` + `id_campagne` | divergence bloquante |
| Participation athlète | engagement + sélection | identique | structure prête après correction de l’engagement |
| Résultat | engagement + programme + références résultat | noyau commun attendu | structure partielle; provenance/validation non portées |
| Segment | résultat + type de segment | identique | structure prête, référentiel vide |
| Performance | résultat + participation effective + type/unité | identique | structure prête, référentiels vides |
| Campagne | équipe nationale | identique | structure prête |
| Sélection | campagne + athlète + références sportives | identique conceptuellement | nom de clé athlète adapté; statut sans référentiel |
| Staff | campagne + acteur typé + rôle | identique | structure prête, rôle vide |

## 4. Écarts qualifiés

### Bloquants avant première insertion

1. `COMPETITIONS_EQUIPES_NATIONALES` porte la mauvaise cardinalité métier. Une équipe permanente peut avoir plusieurs campagnes et participer à plusieurs programmes d’une même compétition; le couple direct actuel ne peut pas les distinguer.
2. Tous les référentiels propres au bloc sont vides. Le formulaire actuel est donc soit inutilisable (`TYPES_COMPETITION`), soit contraint de contourner les feuilles avec des valeurs codées en dur.
3. Aucun référentiel réel ne définit les états de sélection permettant de distinguer présélection, sélection, retrait, remplacement et absence.
4. Le schéma ne porte ni fédération source, ni validation fédérale, ni homologation/historique de correction des résultats alors que la responsabilité et la non-correction silencieuse sont des règles confirmées.
5. La décision SNDS « compétition récurrente / édition temporelle » n’est pas matérialisée; `edition` reste un champ libre de `COMPETITIONS`.

### Importants mais non structurellement bloquants

- `observation` et `observations` alternent selon les onglets; les adaptateurs doivent rester explicites.
- `statut_participation`, `statut` et plusieurs autres champs ne portent pas le nom de leur identifiant de référentiel.
- aucune validation native de cellule ne protège les références, dates, booléens ou statuts;
- `COMPETITIONS_EQUIPES_NATIONALES`, `SELECTIONS_ATHLETES`, `TYPES_SEGMENTS_RESULTATS`, `FEDERATIONS` et `TYPES_ACTEURS` n’ont pas leur ligne d’en-tête figée;
- aucune plage n’est protégée, y compris les colonnes d’identifiants;
- aucune convention d’identifiant ne peut être vérifiée sur les feuilles métier vides;
- les noms physiques `POSTES_ATHLETES`, `GRADES_SPORTIF`, `SEXES` et `ROLES_STAFF_EQUIPE_NATIONALE` divergent de plusieurs suppositions du code ou des premiers modèles.

## 5. Champs obligatoires proposés pour validation T03

Cette section ne modifie pas les feuilles. Elle classe la cible minimale à faire approuver.

| Feuille | Obligatoires proposés | Facultatifs proposés | Calculés/résolus, jamais dupliqués |
| --- | --- | --- | --- |
| `COMPETITIONS` | ID, nom, type, niveau, mono/multisport, début, statut | édition, fin, pays, ville, lieu, observation | libellés type/niveau/statut |
| `PROGRAMMES_COMPETITION` | ID, compétition, épreuve | âge, sexe, dates, observation | sport, discipline, fédération et format via `EPREUVES` |
| engagement renommé fonctionnellement | ID, programme, campagne, statut | date d’engagement, observation | équipe/fédération/sport via campagne et programme |
| `PARTICIPATIONS_ATHLETES_COMPETITION` | ID, engagement, sélection, état de participation | date effective, observation | athlète et campagne via la sélection |
| `RESULTATS` | ID, engagement, programme, date, état/homologation | phase, adversaire, valeurs, synthèse, unité, décision, observation | fédération responsable et contexte sportif via relations |
| `RESULTATS_SEGMENTS` | ID, résultat, type, numéro | valeurs, observation | sport/discipline via résultat |
| `PERFORMANCES_INDIVIDUELLES` | ID, résultat, participant, type | valeur, unité, rang, record, meilleure performance, observation | athlète via participation |
| `EQUIPES_NATIONALES` | ID, fédération, sport, nom, sexe, début, statut | discipline, âge, fin, observation | libellés des référentiels |
| `CAMPAGNES_EQUIPES_NATIONALES` | ID, équipe, nom, début, statut | fin, objectif, observation | fédération et sport via équipe |
| `SELECTIONS_ATHLETES` | ID, campagne, athlète, date, statut | poste, poids, grade, maillot, observation | identité via Acteurs |
| `AFFECTATIONS_STAFF` | ID, campagne, acteur, type, rôle, début | fin, observation | identité via Acteurs et rôle via référentiel |

## 6. Proposition de migration — non autorisée à ce stade

### Besoin

Corriger le modèle avant la première donnée afin d’éviter une migration de lignes métier ultérieure et rendre explicites provenance, validation et états temporels.

### Plan proposé

1. Exporter une sauvegarde horodatée complète des trois classeurs concernés et relever leurs métadonnées.
2. Obtenir la décision T03 sur compétition/édition, provenance/validation, statuts et classement officiel.
3. Sur `COMPETITIONS_EQUIPES_NATIONALES`, remplacer `id_competition` et `id_equipe_nationale` par `id_programme_competition` et `id_campagne`; renommer `statut_participation` en `id_statut_participation`; harmoniser `observations` selon la convention physique retenue.
4. Créer seulement les colonnes de provenance, validation, homologation et historique approuvées en T03, sur les objets qui en sont propriétaires.
5. Créer le référentiel manquant des statuts de sélection/participation personnelle, ou étendre un référentiel existant si T03 démontre qu’il porte exactement la même sémantique.
6. Peupler les référentiels minimaux validés avant toute donnée métier : types/niveaux/statuts de compétition, formats, épreuves, unités, résultats, segments, décisions, rôles de staff, postes, catégories et grades réellement nécessaires.
7. Ajouter des validations natives par plage fondées sur les colonnes d’identifiants des référentiels, des validations de dates/booléens et une protection des identifiants générés.
8. Figer la première ligne des cinq onglets qui ne le sont pas et vérifier chaque en-tête après écriture.
9. Mettre à jour le snapshot documentaire seulement après vérification de la structure réelle.

### Consommateurs impactés

- `lib/competitions/**` et `lib/equipes-nationales/**`;
- API et écrans Compétitions/Équipes nationales;
- dashboard et documents liés;
- composants Acteurs affichant les équipes;
- tests de mappings, relations, autorisations et résilience.

### Retour arrière

Restaurer les copies de classeurs horodatées, vérifier titres/`sheetId`/en-têtes, puis remettre le snapshot et le code au dernier état compatible. Comme les feuilles métier sont vides, aucun remappage de lignes n’est actuellement nécessaire; cette propriété doit être revérifiée immédiatement avant la migration.

## 7. Décisions humaines requises avant toute mutation

1. Valider le remplacement de la relation directe par `programme → campagne`.
2. Choisir si V1 introduit un objet `EDITIONS_COMPETITION` ou assume explicitement qu’une ligne `COMPETITIONS` représente une édition.
3. Définir le propriétaire et les champs de provenance, validation fédérale, homologation et correction.
4. Valider les listes minimales de statuts, types, formats, résultats, segments, décisions et rôles.
5. Décider si le classement officiel nécessite une feuille dédiée en V1.
6. Autoriser séparément la sauvegarde puis la migration structurelle réelle.

## 8. Vérifications T02

- Les quatre classeurs ont été identifiés par leur titre réel.
- Les 7 + 4 onglets métier attendus existent.
- Les en-têtes réels correspondent au snapshot versionné.
- Les volumes ont été contrôlés sans exposer les lignes Acteurs.
- Les validations, notes, fusions, protections et lignes figées ont été relevées.
- Aucun secret, identifiant de classeur ou donnée personnelle n’est consigné.
- Aucune donnée ni structure réelle n’a été modifiée.

## 9. Clôture et condition d’ouverture de T03

T02 est clôturé sur son périmètre read-only. Les feuilles vides rendent la correction structurelle peu coûteuse, mais ne l’autorisent pas. T03 peut commencer pour formaliser les six décisions ci-dessus. Toute sauvegarde ou mutation réelle reste suspendue à une validation humaine explicite du modèle et du plan.
