# T09 — Segments et particularités multisports

## Résultat

T09 ajoute les détails segmentés d’un résultat sans créer de table propre à chaque sport. Les sets, quarts-temps, mi-temps, rounds et manches utilisent tous `RESULTATS_SEGMENTS` et le référentiel `TYPES_SEGMENTS_RESULTATS`.

Un résultat commun T08 reste valide sans segment. Les segments appartiennent à une version précise du résultat et ne peuvent être ajoutés ou modifiés que sur sa version courante. Une correction T08 produit donc une nouvelle version sans recopier silencieusement les segments de l’ancienne version.

## Mapping

`RESULTATS_SEGMENTS` utilise exactement :

- `id_segment_resultat`;
- `id_resultat`;
- `id_type_segment`;
- `numero_segment`;
- `valeur_rdc`;
- `valeur_adversaire`;
- `observation`.

Le référentiel fournit le libellé, la fédération, le sport, la discipline et `ordre_maximal`. Aucun libellé n’est enregistré dans la feuille métier.

## Règles serveur

- résultat existant, courant et appartenant à la compétition ouverte;
- type de segment compatible avec la fédération, le sport et la discipline de l’épreuve du programme;
- numéro entier supérieur ou égal à un;
- numéro inférieur ou égal à `ordre_maximal` lorsque ce maximum est défini;
- unicité `résultat + type de segment + numéro`;
- résultat, type et numéro immuables après création;
- au moins une valeur, ou une observation justifiant un segment non disputé;
- lecture et écriture contrôlées côté serveur par `AUT-SPT`.

## Comportement de l’interface

L’onglet `Segments` affiche des cartes ordonnées et un volet latéral de saisie. Les types proposés sont filtrés selon le contexte sportif du résultat. Les segments restent indépendants du noyau T08 : aucune somme et aucun recalcul du score officiel ne sont exécutés.

Les onglets de la fiche Compétition passent sur une grille responsive afin de rester utilisables sans défilement horizontal malgré l’ajout de `Segments`.

## Vérifications

Les tests couvrent Basket, Volleyball, combat, segment absent, segment non disputé justifié, numéro invalide, maximum officiel, incompatibilité sportive, doublon, absence de recalcul et autorisations serveur.

Les performances individuelles, records et distinctions restent hors périmètre jusqu’à T10.
