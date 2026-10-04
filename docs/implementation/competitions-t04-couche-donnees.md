# Compétitions T04 — couche de données et mappings

Date : 1er septembre 2026  
Statut : terminé et vérifié

## Livré

- constantes uniques des onze feuilles et de leurs en-têtes physiques V1;
- types stricts pour compétitions, programmes, campagnes, engagements, sélections, participations, résultats, segments et performances;
- mapping qui ignore les colonnes inconnues et neutralise les cellules absentes;
- détection explicite des schémas incomplets;
- lecture groupée du graphe Compétitions/Équipes nationales avec option fraîche;
- validation des statuts, dates, périodes, remplacements et corrections de résultats;
- validation des relations campagne-programme, sélection-participation et engagement-résultat;
- créations idempotentes par identifiant stable, refus d’un contenu divergent et relecture de confirmation;
- modifications avec relecture exacte après écriture;
- référentiels compétition type/niveau/statut chargés depuis Google Sheets;
- compatibilité transitoire des écrans existants par projection en lecture des engagements;
- refus explicite des anciennes mutations directes équipe-compétition;
- correction du nom réel `ROLES_STAFF_EQUIPE_NATIONALE` et de `id_statut_selection`.

Les nouvelles commandes génériques ne sont exposées par aucune route HTTP en T04. Leur branchement aux opérations auditées avec identité utilisateur et `request_id` relève de T12, au moment où les actions serveur sont créées. Les anciennes routes ne peuvent plus écrire l’ancien modèle.

## Fichiers principaux

- `lib/competitions/v1-model.ts`
- `lib/competitions/v1-data.ts`
- `lib/competitions/data.ts`
- `lib/competitions/types.ts`
- `lib/competitions/validation.ts`
- `lib/equipes-nationales/data.ts`
- `scripts/migrate-competitions-t04.mjs`
- `scripts/verify-competitions-t04.mjs`
- `tests/unit/competitions-v1-model.test.ts`

## Vérifications

- migration Google Sheets : conforme sur 20 onglets/référentiels ciblés;
- tests du modèle V1 : 5/5;
- suite unitaire complète : 114/114;
- TypeScript : conforme;
- build Next.js : réussi;
- contrôle des différences : aucune anomalie métier; les avertissements de fins de ligne concernent le worktree Windows et le générateur historique de cartographie.

## Limites réservées aux tickets suivants

- T05–T10 introduisent les commandes métier spécialisées et leurs règles par objet;
- T11 remplace les projections transitoires dans les interfaces;
- T12 expose les mutations, contrôle `AUT-SPT` dans chaque frontière serveur et journalise les opérations;
- les épreuves, catégories, postes, grades et distinctions restent à fournir par les fédérations.
