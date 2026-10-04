# T11 — Listes et vues détaillées

## Résultat

Les interfaces de lecture des blocs **Compétitions** et **Équipes nationales** sont consolidées sur le modèle V1 validé. T11 n'ajoute aucune mutation et ne modifie aucune feuille Google Sheets.

## Listes

- recherche textuelle et filtres métier conservés pour les deux catégories ;
- pagination locale de 10, 20 ou 50 éléments ;
- tableau compact sur grand écran et cartes sur mobile/tablette ;
- aucune zone à défilement horizontal dans ces deux listes ;
- colonnes secondaires regroupées sur grand écran et réduites sur mobile ;
- action d'ouverture explicite avec `aria-label` et infobulle native ;
- distinction entre feuille vide et recherche sans résultat ;
- valeur absente affichée comme `Non renseigné`.

Le compteur affiché dans la liste Compétitions représente les campagnes engagées issues de la projection existante, et non une relation directe permanente entre une équipe et une compétition.

## Fiches détaillées

La fiche Compétition expose les ensembles indépendants suivants : général, programmes, engagements, participants effectifs, résultats, segments, performances et documents. Une panne d'une source secondaire produit un état d'erreur dans son onglet sans empêcher les autres onglets de fonctionner.

La fiche Équipe nationale expose : général, campagnes, sélections, staff, engagements et documents. La navigation croisée vers une compétition suit exclusivement :

`EQUIPE_NATIONALE → CAMPAGNES_EQUIPES_NATIONALES → ENGAGEMENTS_CAMPAGNES → PROGRAMMES_COMPETITION → COMPETITIONS`

La projection historique `équipe → compétition` n'est plus utilisée dans cette fiche. Une relation absente reste visible et qualifiée (`Compétition inconnue`, `Programme non renseigné`) au lieu d'empêcher le chargement.

## Responsive et accessibilité

- listes sans `overflow-x-auto` ;
- onglets adaptatifs sur deux, trois, quatre ou huit colonnes selon la fiche et la largeur ;
- contenus longs autorisés à revenir à la ligne ;
- boutons d'ouverture nommés pour les technologies d'assistance ;
- états d'erreur annoncés avec `role="alert"`.

## Vérifications

Le test `tests/unit/competitions-t11.test.ts` couvre les contrats de recherche, filtres, pagination, réduction mobile, absence de défilement horizontal, navigation croisée V1, feuille vide, relation absente et isolation des erreurs secondaires.

Les formulaires, doubles soumissions, journalisation et matrice exhaustive des mutations restent réservés à T12.
