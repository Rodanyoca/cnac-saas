# Règles des vues listes et détails

## Compétitions

La liste Compétitions privilégie l’identifiant, le nom, l’édition, la période et le statut, puis passe en cartes sous le format desktop. La fiche utilise quatre onglets latéraux : Général, Participants, Équipes engagées et Résultats. Les équipes affichées proviennent exclusivement des engagements campagne-programme. Une sélection et une participation effective restent deux informations distinctes ; les segments et performances complètent un résultat officiel sans le recalculer.

- Une vue liste ne doit produire aucun défilement horizontal aux résolutions prises en charge. Les contenus reviennent à la ligne et la structure passe en cartes ou en grille compacte sur petit écran.
- Les colonnes sont hiérarchisées : identité et nom restent prioritaires; les informations secondaires peuvent être abrégées ou réorganisées selon la largeur disponible.
- Une information essentielle n’est jamais tronquée sans moyen d’accéder à sa valeur complète, notamment une infobulle.
- Les actions de ligne utilisent des icônes avec un `aria-label` explicite et une infobulle visible.
- Les vues détaillées partagent la structure des fiches Acteurs : en-tête du dashboard, retour, carte synthétique et carte de contenu, avec les mêmes espacements et comportements responsive.
- Un onglet unique est utilisé lorsque toutes les données appartiennent au même ensemble fonctionnel. Plusieurs onglets ne sont justifiés que par des ensembles distincts.
- Une cellule absente produit un libellé neutre comme `Non renseigné`; elle ne doit ni provoquer une erreur ni être remplacée par une donnée inventée.
