# T14 — Matrice de réception du bloc Compétitions

Date d'exécution : 2 septembre 2026. Cette campagne n'a effectué aucune écriture dans Google Sheets.

| Exigence | Preuve automatisée | Résultat |
| --- | --- | --- |
| Compétition mono ou multisport, sans édition séparée | Tests unitaires T05 et modèle V1 | Conforme |
| Une compétition multisport porte plusieurs programmes | `competitions-reception.test.ts`, scénario multisport | Conforme |
| Parcours équipe → campagne → programme → engagement → participant → résultat | `competitions-reception.test.ts`, parcours complet | Conforme |
| L'équipe permanente ne s'engage pas directement | Tests T06, T11 et T12 | Conforme |
| Une sélection ne prouve pas la participation | Tests T07 et réception intégrée | Conforme |
| Remplacement explicite | Tests T07 et scénario réception | Conforme |
| Basket avec périodes, sans total recalculé | Tests T09 et scénario réception | Conforme |
| Volleyball avec sets, sans total recalculé | Tests T09 et scénario réception | Conforme |
| Athlétisme avec performance mesurée | Tests T10 et scénario réception | Conforme |
| Résultat rattaché au programme et à l'engagement | Tests T08 et parcours complet | Conforme |
| Correction et homologation avec preuves | Tests T08 et scénario réception | Conforme |
| Aucun classement calculé sans règle officielle | Tests T08, T09, T10 et inspection des vues | Conforme |
| Données absentes, référentiels vides et relations orphelines | Tests T05, T11 et T13 | Conforme |
| Panne partielle isolée | Tests T11 et T13 | Conforme |
| Lecture seule et écritures AUT-SPT contrôlées côté serveur | Tests T12 et E2E des routes/API sans session | Conforme |
| Audit, idempotence et invalidation des caches | Tests T12, T13 et tests d'intégration audit | Conforme |
| Responsive sans débordement horizontal | Tests UI T11 et E2E à 390, 1366 et 1920 px | Conforme après correction T14 |
| Compilation, typage et build de production | `tsc --noEmit` et `next build` | Conforme |

## Comptage de la campagne

- Tests unitaires : 167 réussis sur 167.
- Tests d'intégration : 12 réussis sur 12, dont 5 scénarios de réception Compétitions.
- Tests E2E : 25 réussis sur 25 après correction du viewport mobile.
- TypeScript : aucune erreur.
- Build de production : réussi.

Les avertissements de lint non bloquants sont consignés dans le rapport de réception.
