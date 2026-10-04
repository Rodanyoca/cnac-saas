# LOT 2 — Matrice serveur des routes (T05)

Le serveur refuse toute page ou route API protégée qui ne correspond à aucune règle. `GET`, `HEAD` et `OPTIONS` valent `READ`; les autres méthodes valent `WRITE`, sauf l'actualisation du dashboard qui reste une lecture.

| Famille | Chemins couverts | Action | Exigence |
| --- | --- | --- | --- |
| Dashboard | `/dashboard` | `READ` | Au moins une attribution active parmi `AUT-ADM`, `AUT-SPT`, `AUT-COM` |
| Administration métier | `/dashboard/activites/**`, `/dashboard/documents/**` | `READ` | `AUT-ADM` actif |
| Création administration métier | `/dashboard/documents/nouveau` | `WRITE` | `ADMIN` et `AUT-ADM` actif |
| Gestion sportive | `/dashboard/federations/**`, `/dashboard/acteurs/**`, `/dashboard/competitions/**`, `/dashboard/equipes-nationales/**` | `READ` | `AUT-SPT` actif |
| Création sportive | `/dashboard/competitions/nouveau`, `/dashboard/equipes-nationales/nouveau` | `WRITE` | `ADMIN` et `AUT-SPT` actif |
| Écriture autres acteurs | `/dashboard/acteurs/autres/nouveau`, `/dashboard/acteurs/autres/{id}/modifier` | `WRITE` | `ADMIN` et `AUT-SPT` actif |
| Paramètres territoriaux | `/dashboard/federations/{id}/parametres` | `WRITE` | `ADMIN` et `AUT-SPT` actif |
| Communication web | `/dashboard/articles/**`, `/dashboard/galeries/**`, `/dashboard/partenaires/**`, `/dashboard/contenus-web/**` | Méthode/page | `AUT-COM`; écriture réservée à `ADMIN` |
| Administration réservée | `/dashboard/users/**`, `/dashboard/autorisations/**`, `/dashboard/referentiels/**` | Selon page | Super-administrateur actif |
| API administration métier | `/api/activites/**`, `/api/documents/**` | Méthode HTTP | `AUT-ADM`; écriture réservée à `ADMIN` |
| API sport | `/api/arbitres/**`, `/api/athletes/**`, `/api/coachs/**`, `/api/competitions/**`, `/api/equipes-nationales/**`, `/api/federations/**`, `/api/medecins/**`, `/api/officiels/**`, `/api/upload-media` | Méthode HTTP | `AUT-SPT`; écriture réservée à `ADMIN` |
| API communication web | `/api/articles/**`, `/api/galeries/**`, `/api/partenaires/**`, `/api/contenus-web/**` | Méthode HTTP | `AUT-COM`; écriture réservée à `ADMIN` |
| Actualisation dashboard | `POST /api/dashboard/refresh` | `READ` | Au moins un bloc actif |
| API réservées | `/api/users/**`, `/api/authorizations/**`, `/api/autorisations/**`, `/api/referentiels/**` | Méthode HTTP | Super-administrateur actif |
| Session minimale | `/activation`, `/api/auth/activate`, `/api/auth/session`, `/api/auth/logout` | Session | Session valide; seules routes permises pendant l'activation obligatoire |
| Connexion | `/login`, `POST /api/auth/login` | Public | La route API reste volontairement indisponible jusqu'à T06 |

## Règles transversales

- Une ligne absente, inactive, future ou expirée ne donne aucun droit.
- Les dates de début et de fin sont inclusives et comparées à la date civile de `Africa/Kinshasa`.
- `VIEWER` peut seulement lire les blocs explicitement attribués.
- `ADMIN` peut lire et écrire seulement les blocs explicitement attribués.
- `est_super_admin` ouvre l’administration réservée et accorde un accès complet en lecture et écriture aux trois blocs métier.
- Une panne ou incohérence de `USER_AUTORISATIONS` entraîne un refus fermé.
- Le proxy serveur est l'autorité centrale. La navigation et les boutons ne sont que des reflets ergonomiques.
- Le dernier super-administrateur actif est protégé par `assertLastActiveSuperAdminProtected`; les commandes administratives de T07 devront obligatoirement employer ce garde.
