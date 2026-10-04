# T06 — Campagnes et engagements

## Résultat

T06 remplace l’ancien rattachement direct `compétition → équipe nationale` dans l’interface par la relation V1 explicite `programme → engagement → campagne → équipe nationale`. L’équipe permanente sert d’identité stable; seule une campagne datée peut être engagée dans un programme.

La fiche Équipe nationale expose désormais ses campagnes et conserve une vue croisée des compétitions obtenue par les engagements. La fiche Compétition expose les engagements de campagnes par programme. Création et modification utilisent des volets latéraux responsives.

## Feuilles et clés

- `CAMPAGNES_EQUIPES_NATIONALES` : `id_campagne`, `id_equipe_nationale`, `nom_campagne`, `date_debut`, `date_fin`, `objectif`, `statut`, `observation`.
- `ENGAGEMENTS_CAMPAGNES_PROGRAMMES` : `id_engagement_campagne`, `id_programme_competition`, `id_campagne`, `id_statut_engagement`, `date_engagement`, `date_debut`, `date_fin`, `id_federation_source`, `date_transmission`, `reference_source`, `observation`.
- Référentiel : `STATUTS_ENGAGEMENT_PROGRAMME`.

La fédération responsable est toujours résolue par `campagne → équipe → id_federation`. `id_federation_source` représente seulement la provenance de la déclaration. Une source différente de la fédération responsable exige une justification.

## Règles serveur

- campagne et programme obligatoires et existants;
- programme appartenant à la compétition ouverte;
- unicité `programme + campagne`;
- campagne temporellement compatible avec le programme;
- période opérationnelle de l’engagement comprise dans celle du programme;
- statut présent dans le référentiel et dans les valeurs V1 validées;
- fédération source existante;
- programme et campagne immuables après création;
- lecture `AUT-SPT`; écriture réservée aux droits `AUT-SPT` en écriture.

Les routes historiques de rattachement direct restent uniquement comme garde de compatibilité et refusent toute mutation avec un message orientant vers l’engagement campagne-programme.

## Vérifications

Les tests couvrent les campagnes multiples, les périodes invalides, les champs obligatoires de l’engagement, les contrôles serveur, la matrice d’autorisation, l’absence du déclencheur d’engagement direct et les interfaces sans défilement horizontal.

La création réelle d’un engagement reste dépendante de l’existence d’au moins un programme. Comme signalé en T05, le référentiel réel `EPREUVES` est vide; aucune donnée fictive n’a été ajoutée.
