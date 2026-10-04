# T07 — Sélections et participations effectives

## Résultat

T07 sépare deux faits métier qui ne sont jamais déduits l’un de l’autre :

1. une sélection rattache un athlète à une campagne d’équipe nationale;
2. une participation rattache cette sélection à un engagement campagne-programme.

Une sélection peut donc exister sans participation. Seul le statut `PARTICIPANT` constitue une preuve de présence effective; `INSCRIT`, une sélection ou une affectation au staff ne la prouvent pas.

## Interfaces

- fiche Équipe nationale : onglets distincts `Campagnes`, `Sélections` et `Staff`;
- fiche Compétition : onglet `Participants` alimenté uniquement par `PARTICIPATIONS_ATHLETES_COMPETITION`;
- création et modification dans des volets latéraux;
- cartes compactes et responsives sans défilement horizontal;
- actions masquées en lecture seule.

## Mapping

`SELECTIONS_ATHLETES` utilise `id_selection`, `id_campagne`, `id_athlete`, `id_poste`, `id_categorie_poids`, `id_grade_sportif`, `date_selection`, `id_statut_selection` et `observation`.

`PARTICIPATIONS_ATHLETES_COMPETITION` utilise `id_participation_athlete`, `id_engagement_campagne`, `id_selection`, `id_statut_participation`, `date_statut`, `id_selection_remplacement` et `observation`.

Les libellés d’athlètes et de statuts sont résolus depuis les acteurs et les référentiels. Ils ne sont jamais recopiés dans les feuilles métier.

## Règles serveur

- campagne appartenant à l’équipe ouverte;
- athlète existant et identifié par son ID;
- date de sélection comprise dans la campagne;
- statuts de sélection limités à `PRESELECTIONNE`, `SELECTIONNE`, `REMPLACANT`, `NON_RETENU`, `RETIRE`;
- engagement appartenant à la compétition ouverte;
- sélection appartenant exactement à la campagne engagée;
- unicité `engagement + sélection`;
- statuts de participation limités à `INSCRIT`, `PARTICIPANT`, `ABSENT`, `FORFAIT`, `REMPLACE`;
- `REMPLACE` exige une autre sélection de statut `REMPLACANT` dans la même campagne;
- campagne, athlète, engagement et sélection deviennent immuables après création;
- `date_statut` conserve la date du dernier constat enregistré conformément au schéma V1 validé;
- toutes les lectures et écritures sont contrôlées côté serveur par `AUT-SPT`.

## Vérifications

Les tests couvrent la sélection seule, les cinq statuts de sélection, participant/inscrit/absent/forfait, remplacement obligatoire, séparation sémantique dans l’interface, responsive et autorisations serveur.

Aucun résultat sportif n’est lu, créé ou affiché par T07. L’écriture réelle reste dépendante des campagnes et engagements T06, eux-mêmes dépendants d’un programme T05.
