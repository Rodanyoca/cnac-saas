# LOT 2 — État réel des feuilles avant migration

Date du relevé : 2026-08-31  
Statut T01 : rapport terminé, en attente de validation humaine  
Mode : lecture seule, sans lecture de valeur `password` ou `password_hash`

## 1. Classeurs retenus

### Utilisateurs

- Titre : `09_USERS`
- Identifiant : `1Tip01SUzauQmVX__Z1xYCzSmankAxi1LbUpDgqF5jO8`
- URL : <https://docs.google.com/spreadsheets/d/1Tip01SUzauQmVX__Z1xYCzSmankAxi1LbUpDgqF5jO8/edit>
- Dossier parent Drive : `177UlOMi5U2bdGyiugpQ6CuhPOn206Bru`
- Locale : `fr_FR`
- Fuseau du classeur : `Europe/Paris`

Deux autres candidats plus anciens ont été trouvés : `10_USERS` et `Copie de 10_USERS`. `09_USERS` est retenu comme cible probable parce qu'il est le classeur partagé le plus récent, se trouve dans le même dossier que `00_REFERENTIELS` et contient les quatre onglets du modèle actuel. La liaison de production via `GOOGLE_SHEETS_USERS_SPREADSHEET_ID` n'a pas été contrôlée, car T01 interdit la lecture des fichiers d'environnement. La validation humaine doit confirmer que `09_USERS` est bien le classeur applicatif cible.

### Référentiels

- Titre : `00_REFERENTIELS`
- Identifiant : `17hm4n4QSWq_IrSANyF4pJIZ_9Jg9pD85ycMV7SCb7XQ`
- URL : <https://docs.google.com/spreadsheets/d/17hm4n4QSWq_IrSANyF4pJIZ_9Jg9pD85ycMV7SCb7XQ/edit>
- Dossier parent Drive : `177UlOMi5U2bdGyiugpQ6CuhPOn206Bru`
- Locale : `fr_FR`
- Fuseau du classeur : `Europe/Paris`

## 2. Inventaire réel

| Classeur | Onglet | `sheetId` | Grille | Ligne figée | Lignes de données utiles |
| --- | --- | ---: | --- | ---: | ---: |
| `09_USERS` | `USERS` | `0` | 1000 × 26 | 1 | 0 |
| `09_USERS` | `USER_AUTORISATIONS` | `460942713` | 1000 × 26 | 1 | 0 |
| `09_USERS` | `AUTH_TENTATIVES` | `203746581` | 999 × 26 | 1 | 0 |
| `09_USERS` | `JOURNAL_OPERATIONS` | `129539155` | 999 × 26 | 1 | 0 |
| `00_REFERENTIELS` | `BLOCS_AUTORISATION` | `920357138` | 1000 × 25 | 1 | 3 |

Les quatre feuilles du classeur utilisateurs ne contiennent que leur ligne d'en-tête. Il n'existe donc actuellement aucun compte, aucune attribution, aucune tentative et aucune opération auditée dans ce classeur.

## 3. Écarts par feuille

### 3.1 `USERS`

En-têtes réels, dans l'ordre :

`id_user`, `nom_complet`, `email`, `password_hash`, `type_user`, `statut`, `date_creation`, `derniere_connexion`, `session_version`

| Colonne cible | État réel | Classement | Action préparée |
| --- | --- | --- | --- |
| `id_user` | Présente | Conservée | Conserver |
| `nom_complet` | Présente | Conservée | Conserver |
| `email` | Présente | Conservée | Conserver et appliquer l'unicité normalisée côté serveur |
| `password_hash` | Présente | Conservée | Conserver ; aucune valeur n'a été lue |
| `type_user` | Présente | Conservée | Conserver et limiter à `ADMIN`/`VIEWER` |
| `est_super_admin` | Absente | Ajoutée | Ajouter, faux par défaut |
| `doit_changer_mot_de_passe` | Absente | Ajoutée | Ajouter |
| `statut` | Présente | Conservée | Conserver et limiter à `ACTIF`/`INACTIF`/`BLOQUE` |
| `date_creation` | Présente | Conservée | Conserver |
| `date_modification_mot_de_passe` | Absente | Ajoutée | Ajouter |
| `derniere_connexion` | Présente | Conservée | Conserver |
| `session_version` | Présente | Conservée | Conserver comme entier positif |
| `date_expiration_acces_temporaire` | Absente | Ajoutée | Ajouter |

Aucun champ `mot_de_passe_temporaire` n'existe et aucun n'est à ajouter. L'accès temporaire utilisera exclusivement `password_hash`, `doit_changer_mot_de_passe` et `date_expiration_acces_temporaire`.

### 3.2 `USER_AUTORISATIONS`

En-têtes réels, dans l'ordre :

`id_user_autorisation`, `id_user`, `id_bloc_autorisation`, `peut_creer`, `peut_modifier`, `peut_supprimer`, `statut`

| Colonne réelle ou cible | État | Classement | Action préparée |
| --- | --- | --- | --- |
| `id_user_autorisation` | Présente | Conservée | Conserver |
| `id_user` | Présente | Conservée | Conserver |
| `id_bloc_autorisation` | Présente | Conservée | Conserver |
| `peut_creer` | Présente | Abandonnée | Retirer après sauvegarde |
| `peut_modifier` | Présente | Abandonnée | Retirer après sauvegarde |
| `peut_supprimer` | Présente | Abandonnée | Retirer après sauvegarde |
| `statut` | Présente | Conservée | Limiter à `ACTIF`/`INACTIF` |
| `date_debut` | Absente | Ajoutée | Ajouter, obligatoire |
| `date_fin` | Absente | Ajoutée | Ajouter, facultative |

### 3.3 `AUTH_TENTATIVES`

En-têtes réels :

`id_tentative`, `email_pseudonymise`, `ip_pseudonymisee`, `date_tentative`, `resultat`, `request_id`

| Colonne réelle | Cible documentaire | Classement | Action préparée |
| --- | --- | --- | --- |
| `id_tentative` | `id_tentative` | Conservée | Conserver |
| `email_pseudonymise` | `identifiant_hash` | Renommée | Renommer pour couvrir un identifiant normalisé sans suggérer une donnée en clair |
| `ip_pseudonymisee` | `ip_hash` | Renommée | Renommer |
| `date_tentative` | `date_tentative` | Conservée | Conserver |
| `resultat` | `resultat` | Conservée | Limiter à `ECHEC`, `SUCCES`, `REFUS_BLOCAGE_TEMPORAIRE` |
| `request_id` | `request_id` | Conservée | Conserver |

Les pseudonymes seront calculés exclusivement par le serveur avec HMAC-SHA-256. La clé sera fournie ultérieurement par l'environnement de déploiement et ne sera jamais inscrite dans Google Sheets.

### 3.4 `JOURNAL_OPERATIONS`

En-têtes réels :

`id_operation`, `id_user`, `action`, `type_objet`, `id_objet`, `date_operation`, `resultat`, `request_id`, `details_non_sensibles`

Les neuf colonnes correspondent exactement à la cible. Elles sont toutes conservées.

### 3.5 `BLOCS_AUTORISATION`

| Identifiant | Libellé réel | Observation réelle | Résultat |
| --- | --- | --- | --- |
| `AUT-ADM` | `ADMINISTRATION` | Activités, participants aux activités et documents | Conforme |
| `AUT-SPT` | `GESTION SPORTIVE` | Structures territoriales, acteurs, affiliations, licences, équipes nationales, sélections, compétitions, participants et résultats | Conforme |
| `AUT-COM` | `COMMUNICATION` | Articles, galeries, partenaires et contenus du site web | Conforme |

Il n'existe ni identifiant en double ni ligne de bloc supplémentaire dans la plage utile.

## 4. Contrôles de données

Les feuilles utilisateurs étant vides, les résultats sont :

| Contrôle | Résultat |
| --- | ---: |
| Comptes | 0 |
| E-mails normalisés en double | 0 |
| `id_user` absent ou dupliqué | 0 |
| Statuts utilisateur inconnus | 0 |
| Types utilisateur inconnus ou anciens rôles non traduits | 0 |
| Autorisations | 0 |
| Autorisations orphelines | 0 |
| Périodes invalides ou chevauchantes | 0 |
| Tentatives d'authentification | 0 |
| Opérations d'audit | 0 |

Ces zéros décrivent le contenu actuel vide ; ils ne valident pas encore les règles applicatives futures.

## 5. Formats et validations visibles

- Les en-têtes sont présents et la première ligne est figée sur chaque feuille.
- Aucune validation de données, note ou format de date contrôlé n'a été observé dans les plages utiles inspectées.
- Les deux classeurs utilisent actuellement le fuseau `Europe/Paris`, alors que le LOT 2 impose `Africa/Kinshasa`.
- Le modèle serveur doit rester l'autorité de validation même si des listes ou formats sont ajoutés dans Sheets.

## 6. Anomalies et décisions requises

| Niveau | Élément | Décision proposée |
| --- | --- | --- |
| Bloquant avant T02 | La liaison de déploiement vers `09_USERS` n'est pas vérifiable sans environnement | Confirmer humainement que `09_USERS` est la cible |
| Important | Fuseau des deux classeurs : `Europe/Paris` | Passer à `Africa/Kinshasa` lors de la mise à niveau validée |
| Important | Quatre colonnes `USERS` absentes | Les ajouter selon l'ordre cible |
| Important | Modèle historique `peut_*` encore présent | Le remplacer par `date_debut` et `date_fin` |
| Important | Noms des pseudonymes non alignés | Renommer en `identifiant_hash` et `ip_hash` |
| Mineur | Aucune validation de cellules | Ajouter des validations d'aide, sans leur déléguer la sécurité |

## 7. Conclusion T01

Le contenu réel ne nécessite aucune migration de compte : le classeur cible probable est vide. La mise à niveau est donc une migration de schéma, de fuseau et de validations, suivie de la création contrôlée des premiers comptes. T02 et T03 restent bloqués jusqu'à confirmation du classeur cible et validation du plan associé.
