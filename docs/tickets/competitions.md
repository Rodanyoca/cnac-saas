# Backlog consolidé — bloc COMPÉTITIONS

Source d'audit : [`../competitions/t01-rapport-existant.md`](../competitions/t01-rapport-existant.md)  
Ordre obligatoire : `T01` à `T14`. Une évolution structurelle d'un classeur réel exige sauvegarde, plan de migration, retour arrière et validation humaine préalable. Les fichiers d'environnement, commits et déploiements sont hors périmètre sauf instruction explicite.

## T01 — Audit documentaire, fonctionnel et technique

**Statut : terminé et vérifié le 1er septembre 2026.**

- **Objectif :** établir l'existant, les règles confirmées, les divergences et les blocages avant implémentation.
- **Portée :** cahier COC, SNDS, contexte, ADR, mappings, code, API, interfaces, tests et contrôle réel strictement non mutant des onglets/en-têtes/volumes.
- **Exclusions :** mutation de code métier, données, schémas ou référentiels.
- **Sources :** documents précités, classeurs `COMPETITIONS`, `EQUIPES_NATIONALES` et `REFERENTIEL` en lecture seule.
- **Fichiers :** rapport T01 et présent backlog uniquement.
- **Dépendances :** aucune.
- **Critères d'acceptation :** rapport traçable; décisions et questions séparées; écarts code/feuilles/normes qualifiés; absence de secret et d'écriture réelle.
- **Tests :** recherche statique; lecture bornée des schémas; relecture croisée des sources.
- **Livrables :** rapport de l'existant et backlog `T01`–`T14`.
- **Passage à T02 :** T01 documenté; aucune implémentation commencée; état vide des feuilles confirmé.

## T02 — Analyse réelle des Google Sheets et rapport d'écarts

**Statut : terminé et vérifié en lecture seule le 1er septembre 2026.** Rapport : [`../competitions/t02-analyse-google-sheets-et-ecarts.md`](../competitions/t02-analyse-google-sheets-et-ecarts.md).

- **Objectif :** produire la photographie technique complète et reproductible des classeurs réels.
- **Portée :** métadonnées, onglets, en-têtes, validations de données, formats, clés, volumes, relations, éventuels orphelins et compatibilité avec les feuilles Acteurs; confirmer explicitement l'état vide.
- **Exclusions :** toute écriture, ajout de colonne, peuplement ou correction.
- **Sources :** classeurs réels, snapshot versionné, rapport T01, couche Google Sheets existante.
- **Fichiers probables :** `docs/mappings/google-sheets-schema-snapshot.json`, `docs/mappings/google-sheets-workbooks.md`, `docs/implementation/competitions-t02-*.md`.
- **Dépendances :** T01.
- **Critères d'acceptation :** chaque feuille/champ/relation est classé conforme, divergent, absent ou inutile; aucun contenu personnel ni secret publié.
- **Tests :** collecte read-only répétable; comparaison automatisée; contrôle des identifiants et relations si des lignes apparaissent.
- **Livrables :** rapport d'écarts réel et proposition de migration/retour arrière, sans l'exécuter.
- **Passage à T03 :** validation humaine du rapport et des changements structurels proposés.

## T03 — Validation de la modélisation V1 et des référentiels

**Statut : terminé documentairement le 1er septembre 2026, en attente de validation humaine.** Rapport : [`../competitions/t03-modele-relationnel-v1.md`](../competitions/t03-modele-relationnel-v1.md). Décision : [`../adr/0003-modele-v1-competitions-et-engagements-de-campagnes.md`](../adr/0003-modele-v1-competitions-et-engagements-de-campagnes.md).

- **Objectif :** figer le modèle V1 avant toute couche applicative.
- **Portée :** arbitrer compétition/édition, engagement `campagne → programme`, provenance/validation fédérale, homologation, statuts de sélection/participation, classement officiel et référentiels nécessaires.
- **Exclusions :** UI, API et migration réelle.
- **Sources :** T01–T02, SNDS, cahier COC, décisions métier confirmées.
- **Fichiers probables :** `CONTEXT.md`, `docs/adr/`, `docs/implementation/competitions-t03-*.md`, documentation de mapping.
- **Dépendances :** T02 validé.
- **Critères d'acceptation :** clés, cardinalités, champs obligatoires/facultatifs, calculs et invariants définis; aucune donnée dupliquée; V1 et différé explicités.
- **Tests :** scénarios Basket, Volleyball, multisport et athlétisme sur papier; revue de cohérence des cardinalités.
- **Livrables :** modèle cible, dictionnaire, décisions/ADR et plan de migration approuvé.
- **Passage à T04 :** validation humaine explicite du modèle et sauvegarde planifiée si migration nécessaire.

## T04 — Couche de données et mappings

**Statut : terminé et vérifié le 1er septembre 2026.** Migration : [`../migrations/competitions-t04-migration.md`](../migrations/competitions-t04-migration.md). Rapport : [`../implementation/competitions-t04-couche-donnees.md`](../implementation/competitions-t04-couche-donnees.md).

- **Objectif :** fournir des repositories/mappers typés sur la couche Google Sheets existante.
- **Portée :** lectures, écritures, références, erreurs typées, identifiants, idempotence, vérification post-écriture et audit des commandes.
- **Exclusions :** interfaces complètes et calcul de classements.
- **Sources :** modèle T03, en-têtes T02, conventions `lib/google/sheets.ts`.
- **Fichiers probables :** `lib/competitions/**`, `lib/equipes-nationales/**`, `lib/audit/**`, tests unitaires/intégration.
- **Dépendances :** T03; migration réelle approuvée et vérifiée si requise.
- **Critères d'acceptation :** aucun second client Sheets; références par ID; schéma invalide bloquant en écriture mais lecture résiliente; commandes répétables sans doublon.
- **Tests :** mappers, colonnes absentes, relations introuvables, concurrence simulée, échec partiel, idempotence.
- **Livrables :** couche serveur typée et tests.
- **Passage à T05 :** tests T04 verts et revue des écritures.

## T05 — Compétitions et programmes

- **Statut :** implémenté et vérifié le 1er septembre 2026; validation humaine requise avant T06.
- **Rapport :** `docs/implementation/competitions-t05-competitions-programmes.md`.
- **Donnée en attente :** le référentiel réel `EPREUVES` est vide; aucune valeur métier n’a été inventée et l’ajout d’un programme reste désactivé jusqu’à son alimentation officielle.

- **Objectif :** gérer l'identité/édition d'une compétition et ses programmes sans duplication multisport.
- **Portée :** CRUD autorisé des compétitions et programmes; type, niveau, statut, épreuve, âge, sexe et dates via référentiels.
- **Exclusions :** campagnes, participants et résultats.
- **Sources :** T03–T04 et standards d'interface validés.
- **Fichiers probables :** données/API Compétitions, formulaires et tests associés.
- **Dépendances :** T04.
- **Critères d'acceptation :** `est_multisport` conservé; programme rattaché une fois; dates cohérentes; doublons évidents refusés.
- **Tests :** mono/multisport, programme orphelin, référentiel vide, création/modification et lecture seule.
- **Livrables :** noyau compétition/programmes exploitable.
- **Passage à T06 :** scénarios T05 acceptés.

## T06 — Campagnes et rattachement des équipes nationales

- **Statut :** implémenté et vérifié le 1er septembre 2026; validation humaine requise avant T07.
- **Rapport :** `docs/implementation/competitions-t06-campagnes-engagements.md`.
- **Contrainte de données :** aucun engagement réel ne peut être créé tant que `EPREUVES` ne permet pas de créer un programme T05.

- **Objectif :** remplacer le rattachement direct provisoire par l'engagement explicite d'une campagne dans un programme.
- **Portée :** consultation/gestion des campagnes, engagement, statut/date et navigation croisée équipe-compétition.
- **Exclusions :** participation effective et résultats.
- **Sources :** modèle T03, feuilles Équipes nationales et Compétitions.
- **Fichiers probables :** `lib/equipes-nationales/**`, API/pages équipes et compétitions, migration approuvée.
- **Dépendances :** T05.
- **Critères d'acceptation :** aucune participation attribuée à l'équipe permanente seule; campagne et programme obligatoires; fédération responsable résolue.
- **Tests :** campagnes multiples, multisport, doublons, campagne hors période, relation manquante.
- **Livrables :** engagements campagne-programme et vues croisées.
- **Passage à T07 :** engagement vérifiable de bout en bout.

## T07 — Sélections et participations effectives

- **Statut :** implémenté et vérifié le 1er septembre 2026; validation humaine requise avant T08.
- **Rapport :** `docs/implementation/competitions-t07-selections-participations.md`.
- **Invariant livré :** une sélection seule reste valide et seul `PARTICIPANT` prouve une présence effective.

- **Objectif :** distinguer strictement sélection et présence effective.
- **Portée :** sélections athlètes, staff consultable, participation, retrait, remplacement et absence; liens vers acteurs par ID.
- **Exclusions :** déduction automatique et résultats sportifs.
- **Sources :** campagnes T06, acteurs, statuts validés T03.
- **Fichiers probables :** couches/API/pages équipes et compétitions, composants Acteurs, tests.
- **Dépendances :** T06.
- **Critères d'acceptation :** une sélection sans participation est valide; une participation exige sélection et engagement cohérents; états historisés.
- **Tests :** sélection seule, participant, absent, retiré/remplacé, acteur/équipe/campagne orphelin.
- **Livrables :** workflow sélection-participation explicite.
- **Passage à T08 :** présence effective prouvable sans inférence.

## T08 — Résultats communs

- **Statut :** implémenté et vérifié le 1er septembre 2026; validation humaine requise avant T09.
- **Rapport :** `docs/implementation/competitions-t08-resultats-communs.md`.
- **Invariant livré :** toute correction crée une nouvelle version et aucun classement n’est calculé.

- **Objectif :** gérer un noyau de résultat commun à tous les sports.
- **Portée :** résultat lié à engagement/programme, score/rang/synthèse/mesure/décision, adversaire, provenance, validation et homologation retenues en T03.
- **Exclusions :** calcul automatique de classement et détails par segment.
- **Sources :** T03, T07 et référentiels résultat.
- **Fichiers probables :** `lib/competitions/**`, routes, fiches et tests résultats.
- **Dépendances :** T07.
- **Critères d'acceptation :** résultat unique et traçable; unités/décisions compatibles; correction non silencieuse; aucune copie côté équipe.
- **Tests :** victoire/nul/défaite, score, rang, mesure, qualification, données partielles et correction homologuée.
- **Livrables :** résultat commun consultable et modifiable selon droits.
- **Passage à T09 :** familles communes validées.

## T09 — Segments et particularités multisports

- **Statut :** implémenté et vérifié le 1er septembre 2026; validation humaine requise avant T10.
- **Rapport :** `docs/implementation/competitions-t09-segments-resultats.md`.
- **Invariant livré :** les segments détaillent un résultat sans jamais recalculer son score officiel.

- **Objectif :** détailler un résultat sans table spécifique par sport.
- **Portée :** sets, quarts-temps, mi-temps, rounds/manches; ordre et maximum issus des référentiels; affichage générique.
- **Exclusions :** moteur de règles sportives ou recalcul de score officiel.
- **Sources :** T08, scénarios Basket/Volleyball et référentiels de segments.
- **Fichiers probables :** données/API/UI résultats et tests.
- **Dépendances :** T08.
- **Critères d'acceptation :** segments facultatifs, ordonnés, non dupliqués et compatibles avec le sport/discipline; noyau inchangé.
- **Tests :** Basket, Volleyball, combat, segment absent/invalide et total non recalculé sans règle.
- **Livrables :** détails multisports génériques.
- **Passage à T10 :** scénarios segmentés acceptés.

## T10 — Performances individuelles, records et distinctions

- **Statut :** implémenté et vérifié le 1er septembre 2026; validation humaine requise avant T11.
- **Rapport :** `docs/implementation/competitions-t10-performances-individuelles.md`.
- **Invariant livré :** une performance exige un participant effectif et ne produit aucun classement ou record automatique.

- **Objectif :** rattacher une performance individuelle à un participant effectif et à un résultat.
- **Portée :** valeur/unité, rang, record, meilleure performance, distinction selon décision T03.
- **Exclusions :** ranking général calculé et homologation automatique.
- **Sources :** T07–T09, référentiels types/unité.
- **Fichiers probables :** données/API/UI performances et tests.
- **Dépendances :** T09.
- **Critères d'acceptation :** participant effectif obligatoire; unité compatible; rang d'épreuve distinct d'un classement général; provenance officielle visible.
- **Tests :** temps, distance, hauteur, poids, note, record, distinction et relation invalide.
- **Livrables :** performances individuelles traçables.
- **Passage à T11 :** modèle complet lisible via API.

## T11 — Listes et vues détaillées

- **Statut :** implémenté et vérifié le 1er septembre 2026; validation humaine requise avant T12.
- **Rapport :** `docs/implementation/competitions-t11-listes-details.md`.
- **Invariant livré :** la navigation Équipe nationale → Compétition passe par la campagne, l'engagement et le programme; aucune relation directe permanente n'est projetée.

- **Objectif :** livrer les interfaces consolidées Compétitions et Équipes nationales.
- **Portée :** recherche/filtres/pagination; fiches avec général, programmes, campagnes, participants, résultats, segments, performances et documents; états secondaires indépendants.
- **Exclusions :** mutation non prévue aux tickets antérieurs.
- **Sources :** T05–T10 et `docs/interfaces/regles-listes-et-details.md`.
- **Fichiers probables :** pages/composants dashboard Compétitions et Équipes nationales.
- **Dépendances :** T10.
- **Critères d'acceptation :** aucune barre horizontale aux résolutions supportées; colonnes réduites sur mobile; valeurs neutres qualifiées; navigation croisée.
- **Tests :** desktop/mobile, feuille vide, relation absente, section en erreur, recherche, filtres et pagination.
- **Livrables :** interfaces de lecture complètes.
- **Passage à T12 :** revue visuelle et accessibilité acceptées.

## T12 — Formulaires, actions et autorisations

- **Statut :** implémenté et vérifié le 2 septembre 2026; validation humaine requise avant T13.
- **Rapport :** `docs/implementation/competitions-t12-formulaires-autorisations.md`.
- **Invariant livré :** toute mutation V1 est contrôlée par `AUT-SPT:WRITE`, identifiable, répétable sans double traitement lorsque `x-request-id` est fourni, et journalisée.

- **Objectif :** harmoniser les mutations et garantir les droits côté serveur.
- **Portée :** volets/formulaires, validations, conservation de saisie, rafraîchissement, `AUT-SPT`, rôle `ADMIN`, attribution active et journalisation.
- **Exclusions :** protection fondée uniquement sur les boutons masqués.
- **Sources :** matrice d'autorisation LOT2, composants existants, commandes T04.
- **Fichiers probables :** composants formulaire, routes API, politique de routes, tests sécurité.
- **Dépendances :** T11.
- **Critères d'acceptation :** VIEWER sans mutation; ADMIN sans attribution refusé; contrôles dans chaque frontière serveur; erreurs de validation sans perte des valeurs.
- **Tests :** 401/403/validation/succès, URL directe, requête API forgée, double soumission et rafraîchissement.
- **Livrables :** actions cohérentes, protégées et auditées.
- **Passage à T13 :** matrice d'accès entièrement verte.

## T13 — Anomalies, complétude et résilience

- **Statut :** implémenté et vérifié le 2 septembre 2026; validation humaine requise avant T14.
- **Rapport :** `docs/implementation/competitions-t13-anomalies-resilience.md`.
- **Invariant livré :** une anomalie secondaire est qualifiée et actionnable sans masquer la fiche principale ni fabriquer une valeur.

- **Objectif :** rendre le bloc consultable malgré les anomalies secondaires et rendre celles-ci actionnables.
- **Portée :** états absent/inconnu/non applicable/non renseigné/source indisponible; relations orphelines; indicateurs de complétude et provenance.
- **Exclusions :** correction silencieuse ou fabrication de valeur.
- **Sources :** règles SNDS, T01 et retours des tickets précédents.
- **Fichiers probables :** erreurs typées, loaders, composants d'état, dashboard et tests.
- **Dépendances :** T12.
- **Critères d'acceptation :** fiche principale toujours lisible si une section secondaire échoue; écriture bloquée seulement sur anomalie pertinente; messages distincts.
- **Tests :** chaque état d'anomalie, timeout partiel, référentiel vide, ligne orpheline et cache invalidé.
- **Livrables :** résilience et qualité visibles.
- **Passage à T14 :** matrice d'anomalies couverte.

## T14 — Campagne complète de tests et réception

- **Statut :** implémenté et vérifié techniquement le 2 septembre 2026; validation humaine en attente.
- **Preuves :** [`docs/tests/competitions-t14-matrice.md`](../tests/competitions-t14-matrice.md) et [`docs/tests/competitions-t14-rapport-reception.md`](../tests/competitions-t14-rapport-reception.md).

- **Objectif :** prouver la conformité fonctionnelle, technique, responsive et sécuritaire du bloc.
- **Portée :** tests unitaires, intégration, routes, E2E, accessibilité, responsive, données vides/partielles, sécurité, audit et non-régression.
- **Exclusions :** déploiement, commit et mutation réelle non approuvée.
- **Sources :** critères T01–T13 et décisions T03.
- **Fichiers probables :** `tests/**`, `docs/tests/competitions-*.md`, rapport de réception.
- **Dépendances :** T13.
- **Critères d'acceptation :** parcours complet équipe→campagne→programme→participant→résultat; aucun classement inventé; droits prouvés; aucun secret; build/tests verts.
- **Tests :** scénarios mono/multisport, Basket, Volleyball, performance mesurée, remplacement, correction homologuée, lecture seule et pannes partielles.
- **Livrables :** matrice de tests, preuves et rapport de réception avec écarts résiduels.
- **Clôture :** validation humaine du rapport; déploiement uniquement sur instruction explicite.
