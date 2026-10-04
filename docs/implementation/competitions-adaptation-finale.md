# Adaptation finale du bloc Compétitions

Date : 3 septembre 2026.

## Modèle appliqué

- Une ligne `COMPETITIONS` représente une édition concrète; les contextes sportifs restent dans `PROGRAMMES_COMPETITION`.
- `EQUIPES_NATIONALES` porte `id_saison`. `CAMPAGNES_EQUIPES_NATIONALES` conserve ses dates de début et de fin opérationnelles, contrôlées dans les bornes de cette saison, ainsi que `id_statut_campagne`.
- `PARTICIPATIONS_ACTEURS_COMPETITION` distingue la présence effective des sélections et affectations.
- `UNITES_PARTICIPANTES` identifie une unité `INDIVIDUEL` ou `EQUIPE`; `MEMBRES_UNITES_PARTICIPANTES` porte la composition collective.
- `RESULTATS` référence le programme, l’engagement et l’unité participante. La date métier unique est `date_resultat`; les corrections créent une nouvelle version.
- L’adversaire est `AUCUN`, `ATHLETE` ou `EQUIPE`. Son nom, son pays et sa fédération/délégation restent des informations externes légères.

## Référentiels

Les feuilles `SAISONS`, `STATUTS_CAMPAGNE`, `STATUTS_RESULTAT`, `TYPES_UNITES_PARTICIPANTES` et `TYPES_ADVERSAIRES` ont été ajoutées. `FORMATS_PARTICIPATION` ne conserve que `FMT_INDIVIDUEL` et `FMT_EQUIPE`. `RESULTATS_SYNTHETIQUES` utilise les valeurs métier exactes : `VICTOIRE`, `DEFAITE`, `NUL`, `QUALIFIE`, `NON_QUALIFIE`, `ELIMINE`, `CLASSE`, `NON_CLASSE`, `DISQUALIFIE`, `ABANDON`, `NON_APPLICABLE`.

## Migration et retour arrière

Avant écriture, trois copies Drive horodatées `20260903-150000` ont été créées pour `07_COMPETITIONS`, `08_EQUIPES_NATIONALES` et `00_REFERENTIELS`. Les six campagnes existantes conservent leurs identifiants et pointent vers `SAI_2024`; leurs objectifs ont été préservés dans `observation`. Le résultat historique `RES0001` conserve son identifiant et sa version. Son unité n’a pas été inventée car aucune participation effective ne la prouve; il reste explicitement signalé comme incomplet.

Le retour arrière consiste à remettre les trois copies horodatées comme classeurs applicatifs, puis à restaurer la version du code antérieure à cette adaptation.

## Interface et autorisations

Les campagnes utilisent le référentiel des saisons. Les participants effectifs alimentent les unités; une unité collective exige au moins deux participants. Le résultat sélectionne une unité et gère l’adversaire conditionnel. Les écritures passent par l’enveloppe serveur `AUT-SPT`; un lecteur ne voit pas les commandes de création ou modification.
