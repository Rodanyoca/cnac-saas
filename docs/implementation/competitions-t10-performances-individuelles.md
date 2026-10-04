# T10 — Performances individuelles, records et distinctions

## Résultat

T10 ajoute les performances individuelles à la fiche Compétition. Une performance appartient simultanément à une version courante du résultat et à un participant dont le statut est exactement `PARTICIPANT`. La participation et le résultat doivent relever du même engagement.

Le rang enregistré est un rang d’épreuve. Il ne constitue jamais un classement général calculé. Les indicateurs de record et de meilleure performance sont déclaratifs; ils ne déclenchent aucune homologation automatique.

## Mapping

`PERFORMANCES_INDIVIDUELLES` utilise exactement :

- `id_performance`;
- `id_resultat`;
- `id_participation_athlete`;
- `id_type_resultat`;
- `valeur`;
- `id_unite_mesure`;
- `rang`;
- `est_record`;
- `est_meilleure_performance`;
- `id_distinction`;
- `observation`.

Les libellés proviennent de `TYPES_RESULTAT`, `UNITES_MESURE`, `DISTINCTIONS_SPORTIVES` et des acteurs. La provenance officielle reste résolue depuis le résultat T08 (`id_federation_source` et `reference_source`) et est affichée sans duplication dans la feuille des performances.

## Règles serveur

- résultat courant appartenant à la compétition ouverte;
- participant effectif appartenant au même engagement;
- type de résultat compatible avec la fédération, le sport et la discipline de l’épreuve;
- valeur, rang ou distinction obligatoire;
- rang entier supérieur ou égal à un;
- unité obligatoire et conforme à l’unité du type lorsqu’une mesure le requiert;
- distinction compatible avec le contexte sportif;
- indicateurs limités à `OUI` ou `NON`;
- unicité `résultat + participant + type de résultat`;
- résultat, participant et type immuables après création;
- lecture et écriture contrôlées côté serveur par `AUT-SPT`.

## Familles couvertes

Temps, distance, hauteur, poids, note, rang d’épreuve, record, meilleure performance et distinction sont pris en charge de manière générique. Aucun classement général, comparaison automatique, détection de record ou homologation automatique n’est produit.

## Interface

L’onglet `Performances` utilise des cartes responsives et un volet latéral. Les participants proposés sont uniquement les participants effectifs du même engagement. Types et distinctions sont filtrés selon l’épreuve, et l’unité par défaut du type est présélectionnée.

## Vérifications

Les tests couvrent temps, distance, hauteur, poids, note, rang, record, meilleure performance, distinction, participant non effectif, unité incompatible, relation sportive invalide, provenance visible, absence de classement et autorisations serveur.
