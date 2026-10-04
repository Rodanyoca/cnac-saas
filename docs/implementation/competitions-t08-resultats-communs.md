# T08 — Résultats communs

## Résultat

T08 ajoute le noyau de résultat commun à tous les sports dans la fiche Compétition. Un résultat appartient obligatoirement à un engagement et reprend le programme de cet engagement. Il n’est jamais enregistré ni recopié dans la fiche Équipe nationale.

La vue affiche les versions courantes et permet d’ouvrir l’historique. Une correction ne modifie jamais silencieusement la ligne précédente : elle crée un nouvel `id_resultat`, conserve `id_resultat_logique`, incrémente `numero_version`, renseigne `id_resultat_precedent` et exige `motif_correction`. La version remplacée passe à `est_version_courante = NON` et au statut `CORRIGE`.

## Mapping

La feuille `RESULTATS` utilise exactement les colonnes V1 validées : identifiants de version, engagement, programme, date, phase, adversaire, synthèse, valeurs, unité, décision, provenance fédérale, transmission, validation, correction et observation.

Les listes utilisent :

- `RESULTATS_SYNTHETIQUES`;
- `UNITES_MESURE`;
- `DECISIONS_RESULTATS`;
- `STATUTS_VALIDATION_RESULTAT`;
- les fédérations existantes pour la provenance.

Les libellés ne sont jamais dupliqués dans `RESULTATS`.

## Règles serveur

- engagement existant et appartenant à la compétition ouverte;
- programme toujours repris depuis l’engagement;
- résultat contenant au moins une synthèse, une décision ou une valeur;
- unité obligatoire pour une valeur mesurée, sauf le type officiel `TR_RANG` qui n’a pas d’unité;
- adversaire obligatoire lorsqu’une valeur adverse est renseignée;
- décision filtrée par fédération, sport et discipline lorsqu’ils sont définis dans le référentiel;
- date du résultat comprise dans la période de l’engagement;
- date de validation obligatoire dès `VALIDE_FEDERATION`;
- validateur COC injecté depuis la session pour `VALIDE_COC` et `HOMOLOGUE`;
- correction possible uniquement depuis la version courante et avec un motif.

## Familles couvertes

Le noyau couvre victoire, nul, défaite, qualification, score, mesure, rang sans unité, décision officielle et données partielles valides. Aucun classement automatique n’est produit. Les détails par set, quart-temps, round ou manche restent exclus jusqu’à T09.

## Vérifications

Les tests couvrent les synthèses communes, score, mesure, rang, décision sans score, résultat incomplet, validation/homologation, versionnement des corrections, interface sans segments et droits serveur `AUT-SPT`.

La saisie réelle reste dépendante de l’existence d’un programme et d’un engagement validés dans les étapes précédentes.
