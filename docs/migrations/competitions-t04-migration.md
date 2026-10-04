# Compétitions T04 — migration structurelle

Date d’exécution : 1er septembre 2026  
Statut : appliquée et vérifiée

## Sauvegarde

La copie native Drive a été refusée avant toute mutation en raison du quota de stockage du compte. Le processus s’est arrêté correctement. Les trois classeurs ont ensuite été exportés intégralement au format XLSX avant le premier lot d’écriture, avec taille et empreinte SHA-256 dans un manifeste local :

`backups/competitions-t04/2026-09-01T17-55-57-588Z/`

Ce répertoire est exclu de Git pour ne pas versionner de données réelles. Il contient `07_COMPETITIONS.xlsx`, `08_EQUIPES_NATIONALES.xlsx`, `00_REFERENTIELS.xlsx` et `manifest.json`.

## Changements appliqués

- renommage de `COMPETITIONS_EQUIPES_NATIONALES` en `ENGAGEMENTS_CAMPAGNES_PROGRAMMES`;
- remplacement de son schéma par la relation programme-campagne sourcée;
- mise à niveau des en-têtes des participations, résultats, performances et sélections;
- renommage de `STATUTS_PARTICIPATION_COMPETITION` en `STATUTS_PARTICIPATION_ATHLETE`;
- création de `STATUTS_SELECTION`, `STATUTS_ENGAGEMENT_PROGRAMME`, `STATUTS_VALIDATION_RESULTAT` et `DISTINCTIONS_SPORTIVES`;
- peuplement des référentiels nationaux validés dans T03;
- peuplement du référentiel minimal des rôles de staff;
- application d’un en-tête gris léger, gras, et d’une première ligne figée sur les feuilles modifiées.

Aucune ligne métier n’a été créée. Les référentiels gouvernés par les fédérations n’ont pas été inventés.

## Vérification

Le script `scripts/verify-competitions-t04.mjs` confirme les en-têtes exacts, les onglets, les lignes figées et les volumes attendus. Le snapshot `docs/mappings/google-sheets-schema-snapshot.json` et sa synthèse Markdown ont été régénérés depuis les classeurs réels.

## Retour arrière

Suspendre les écritures, réimporter les trois fichiers XLSX de sauvegarde dans leurs classeurs respectifs, puis comparer les en-têtes et volumes au manifeste. La restauration doit porter sur les trois classeurs ensemble. Si des données métier sont ajoutées après cette migration, cette procédure simple n’est plus suffisante : une migration inverse des lignes doit être préparée et validée séparément.
