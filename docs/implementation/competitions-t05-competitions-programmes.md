# T05 — Compétitions et programmes

## Périmètre livré

T05 fournit la création et la modification des éditions de compétition ainsi que la consultation, la création et la modification de leurs programmes. Une ligne `COMPETITIONS` reste une édition concrète et le booléen `est_multisport` est conservé. Les campagnes, engagements, participants et résultats restent hors périmètre jusqu’aux tickets suivants.

Les écritures sont réservées à un utilisateur autorisé en écriture sur `AUT-SPT`; la lecture exige `AUT-SPT`. Les contrôles sont appliqués dans les routes serveur et les actions sont masquées dans l’interface en lecture seule.

## Mapping utilisé

- `COMPETITIONS` : `id_competition`, `nom_competition`, `id_type_competition`, `id_niveau_competition`, `edition`, `est_multisport`, `date_debut`, `date_fin`, `pays`, `ville`, `lieu`, `id_statut_competition`, `observation`.
- `PROGRAMMES_COMPETITION` : `id_programme_competition`, `id_competition`, `id_epreuve`, `id_categorie_age`, `id_sexe`, `date_debut`, `date_fin`, `observation`.
- Référentiels : `TYPES_COMPETITION`, `NIVEAUX_COMPETITION`, `STATUTS_COMPETITION`, `EPREUVES`, `CATEGORIES_AGE` et `SEXES`.

Seuls les identifiants de référentiel sont écrits. Les libellés sont résolus à la lecture. Une épreuve devient immuable après la création d’un programme; âge, sexe, dates et observation restent modifiables.

## Règles garanties

- cohérence entre le type et la portée mono/multisport;
- dates de compétition et de programme ordonnées;
- programme rattaché à une compétition existante;
- épreuve, âge et sexe présents dans leurs référentiels;
- âge compatible avec le sport ou la discipline de l’épreuve lorsqu’ils sont précisés;
- refus d’un doublon évident `compétition + épreuve + âge + sexe`;
- refus de plusieurs sports dans une compétition déclarée monosport;
- état neutre pour une liste vide ou une donnée facultative absente;
- cartes responsives sans tableau à défilement horizontal pour les programmes.

## Point de données restant

Le référentiel réel `EPREUVES` est vide au moment de T05. L’application affiche cet état et désactive la création d’un programme. Aucune épreuve fictive n’a été créée. L’alimentation officielle de ce référentiel rendra immédiatement la liste utilisable, sans modification applicative.

## Vérifications

- tests unitaires : portée mono/multisport, dates, épreuve obligatoire, référentiel vide, interface responsive et contrôles serveur;
- matrice de routes : lecture et écriture de `/api/competitions/[id]/programmes` sur `AUT-SPT`;
- vérification TypeScript et build de production.
