# LOT 2 — Vérification après mise à niveau T01

Date d'exécution : 2026-08-31  
Horodatage des sauvegardes : `20260831-103823`  
Statut : mise à niveau T01 exécutée et vérifiée ; T02 non démarré

## 1. Sauvegardes natives vérifiées

| Source | Sauvegarde | Identifiant | Vérifications |
| --- | --- | --- | --- |
| `09_USERS` | `SAUVEGARDE_09_USERS_AVANT_LOT2_20260831-103823` | `16cEeiPLdqV0BV4e_LOLbPyp0JKnIcGh46bv71p0VlZ4` | Google Sheets natif, identifiant distinct, même dossier parent, 4 onglets et `sheetId` identiques, en-têtes et fuseau antérieurs présents |
| `00_REFERENTIELS` | `SAUVEGARDE_00_REFERENTIELS_AVANT_LOT2_20260831-103823` | `1NplR_pQ5oR_ZIKnJn4oqp7WAEUVNDmti0fyiJXjKw-0` | Google Sheets natif, identifiant distinct, même dossier parent, 37 onglets et `sheetId` identiques, trois blocs et fuseau antérieurs présents |

Les deux copies sont dans le dossier Drive `177UlOMi5U2bdGyiugpQ6CuhPOn206Bru`. Elles conservent l'état `Europe/Paris` et les en-têtes historiques, ce qui fournit le point de retour arrière prévu.

## 2. Originaux après écriture

### `09_USERS`

- Identifiant inchangé : `1Tip01SUzauQmVX__Z1xYCzSmankAxi1LbUpDgqF5jO8`
- Locale : `fr_FR`
- Fuseau : `Africa/Kinshasa` — conforme
- Nombre d'onglets : 4 — conforme

| Onglet | `sheetId` | En-têtes vérifiés | Lignes de données |
| --- | ---: | --- | ---: |
| `USERS` | `0` | `id_user`, `nom_complet`, `email`, `password_hash`, `type_user`, `est_super_admin`, `doit_changer_mot_de_passe`, `statut`, `date_creation`, `date_modification_mot_de_passe`, `derniere_connexion`, `session_version`, `date_expiration_acces_temporaire` | 0 |
| `USER_AUTORISATIONS` | `460942713` | `id_user_autorisation`, `id_user`, `id_bloc_autorisation`, `statut`, `date_debut`, `date_fin` | 0 |
| `AUTH_TENTATIVES` | `203746581` | `id_tentative`, `identifiant_hash`, `ip_hash`, `date_tentative`, `resultat`, `request_id` | 0 |
| `JOURNAL_OPERATIONS` | `129539155` | `id_operation`, `id_user`, `action`, `type_objet`, `id_objet`, `date_operation`, `resultat`, `request_id`, `details_non_sensibles` | 0 |

Validations natives relues :

- `USERS.type_user` : `ADMIN`, `VIEWER` ;
- `USERS.est_super_admin` et `USERS.doit_changer_mot_de_passe` : `TRUE`, `FALSE`, sans valeur matérialisée dans les lignes vides ;
- `USERS.statut` : `ACTIF`, `INACTIF`, `BLOQUE` ;
- `USER_AUTORISATIONS.id_bloc_autorisation` : `AUT-ADM`, `AUT-SPT`, `AUT-COM` ;
- `USER_AUTORISATIONS.statut` : `ACTIF`, `INACTIF` ;
- `USER_AUTORISATIONS.date_debut` et `date_fin` : format `yyyy-mm-dd` ;
- `AUTH_TENTATIVES.resultat` : `ECHEC`, `SUCCES`, `REFUS_BLOCAGE_TEMPORAIRE` ;
- `JOURNAL_OPERATIONS.resultat` : `SUCCES`, `ECHEC`.

Aucun champ `mot_de_passe_temporaire`, aucune clé HMAC et aucune ligne de compte n'ont été ajoutés. Aucune valeur de `password_hash` n'a été lue ou créée.

### `00_REFERENTIELS`

- Identifiant inchangé : `17hm4n4QSWq_IrSANyF4pJIZ_9Jg9pD85ycMV7SCb7XQ`
- Locale : `fr_FR`
- Fuseau : `Africa/Kinshasa` — conforme
- Nombre d'onglets : 37 — conforme
- Titres, ordre, dimensions et `sheetId` des 37 onglets : inchangés par rapport à la sauvegarde
- `BLOCS_AUTORISATION.sheetId` : `920357138` — inchangé

Contenu vérifié :

| Identifiant | Libellé | Observation | Résultat |
| --- | --- | --- | --- |
| `AUT-ADM` | `ADMINISTRATION` | Activités, participants aux activités et documents | Inchangé |
| `AUT-SPT` | `GESTION SPORTIVE` | Structures territoriales, acteurs, affiliations, licences, équipes nationales, sélections, compétitions, participants et résultats | Inchangé |
| `AUT-COM` | `COMMUNICATION` | Articles, galeries, partenaires et contenus du site web | Inchangé |

## 3. Incidents et corrections contrôlées

- La première lecture Sheets des copies a rencontré un timeout DNS temporaire. La relance a réussi avant toute modification des originaux.
- La validation native de type case à cocher a initialement matérialisé `FALSE` dans les colonnes booléennes des lignes vides. La plage exacte `USERS!F2:G1000` a été nettoyée, la validation a été remplacée par une liste stricte `TRUE/FALSE`, puis l'absence de valeurs a été vérifiée.
- Une tentative d'auto-ajustement des largeurs a été refusée par le contrôle de sécurité du connecteur faute d'autorisation explicite. Aucun contournement n'a été tenté et aucune largeur n'a été modifiée.

## 4. Résultat

La mise à niveau réversible prévue par T01 est conforme sur les éléments autorisés : sauvegardes natives, fuseaux, onglets, `sheetId`, en-têtes, validations et conservation du référentiel. Aucun compte n'a été migré ou créé, aucun code applicatif n'a été modifié et T02 n'a pas commencé.
