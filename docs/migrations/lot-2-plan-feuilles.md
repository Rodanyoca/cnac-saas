# LOT 2 — Plan de mise à niveau des feuilles

Statut : proposé, non exécuté  
Prérequis : validation de [`lot-2-etat-feuilles.md`](./lot-2-etat-feuilles.md)

## 1. Conditions d'entrée

Avant toute écriture :

1. confirmer que `09_USERS` (`1Tip01SUzauQmVX__Z1xYCzSmankAxi1LbUpDgqF5jO8`) est le classeur utilisé par le déploiement ;
2. confirmer que `00_REFERENTIELS` (`17hm4n4QSWq_IrSANyF4pJIZ_9Jg9pD85ycMV7SCb7XQ`) est le référentiel applicable ;
3. créer une copie Drive horodatée de chacun des deux classeurs et vérifier que les copies possèdent des identifiants différents ;
4. enregistrer les métadonnées, `sheetId`, en-têtes et nombres de lignes utiles des originaux et des copies ;
5. obtenir une validation humaine explicite du présent plan.

La copie constitue le point de retour arrière. Aucune valeur sensible n'est exportée dans le dépôt.

## 2. Ordre d'exécution proposé

### Étape A — Fuseaux

- Passer le fuseau de `09_USERS` à `Africa/Kinshasa`.
- Passer le fuseau de `00_REFERENTIELS` à `Africa/Kinshasa` afin que les référentiels et les données d'accès partagent la même interprétation calendaire.
- Recharger les métadonnées et vérifier les deux propriétés.

### Étape B — `USERS`

Remplacer la ligne d'en-tête par l'ordre cible :

`id_user`, `nom_complet`, `email`, `password_hash`, `type_user`, `est_super_admin`, `doit_changer_mot_de_passe`, `statut`, `date_creation`, `date_modification_mot_de_passe`, `derniere_connexion`, `session_version`, `date_expiration_acces_temporaire`

Ajouter des validations d'aide pour :

- `type_user` : `ADMIN`, `VIEWER` ;
- `est_super_admin` et `doit_changer_mot_de_passe` : booléens explicites ;
- `statut` : `ACTIF`, `INACTIF`, `BLOQUE` ;
- `session_version` : entier positif ;
- colonnes de date : format ISO 8601 lisible et cohérent.

Aucun champ `mot_de_passe_temporaire` n'est créé.

### Étape C — `USER_AUTORISATIONS`

Remplacer la ligne d'en-tête par :

`id_user_autorisation`, `id_user`, `id_bloc_autorisation`, `statut`, `date_debut`, `date_fin`

Ajouter des validations d'aide pour `statut` et `id_bloc_autorisation`. Les contraintes de référence, d'inclusion des bornes et de non-chevauchement restent appliquées par le serveur.

### Étape D — `AUTH_TENTATIVES`

Remplacer la ligne d'en-tête par :

`id_tentative`, `identifiant_hash`, `ip_hash`, `date_tentative`, `resultat`, `request_id`

Configurer la validation de `resultat`. Les valeurs `identifiant_hash` et `ip_hash` seront calculées côté serveur. La clé HMAC reste exclusivement dans l'environnement de déploiement futur.

### Étape E — `JOURNAL_OPERATIONS`

Conserver les neuf en-têtes existants. Ajouter seulement les formats et validations d'aide nécessaires à `date_operation` et `resultat`.

### Étape F — `BLOCS_AUTORISATION`

Conserver les trois lignes existantes. Protéger la plage de référentiel selon les pratiques d'administration du classeur, sans déplacer cette source dans le code d'authentification.

## 3. Vérifications après écriture

- Les identifiants des classeurs et `sheetId` des onglets existants sont inchangés.
- Les deux classeurs déclarent `Africa/Kinshasa`.
- Les en-têtes correspondent exactement aux listes cibles, dans le bon ordre.
- Les lignes utiles restent à zéro dans les quatre feuilles utilisateurs jusqu'à la création contrôlée du premier compte.
- Les trois blocs d'autorisation et leurs observations sont inchangés.
- Aucun champ `mot_de_passe_temporaire`, aucune clé HMAC et aucun secret n'apparaît dans les feuilles.
- Les validations de cellules sont présentes mais les règles serveur restent prévues comme autorité.
- Une seconde exécution du plan ne duplique ni colonne, ni onglet, ni ligne.

## 4. Retour arrière

En cas d'écart :

1. arrêter toute création de compte ;
2. conserver les originaux en l'état pour diagnostic et ne pas effectuer de suppression de lignes ;
3. comparer les métadonnées et en-têtes à la copie horodatée ;
4. restaurer uniquement les propriétés et plages explicitement modifiées depuis la copie validée ;
5. revérifier les identifiants, onglets, en-têtes, fuseaux et trois lignes de référentiel ;
6. consigner l'échec sans secret avant une nouvelle tentative.

## 5. Porte de validation

T02 ne commence qu'après approbation explicite des points suivants :

- `09_USERS` est bien le classeur applicatif cible ;
- le changement des deux classeurs vers `Africa/Kinshasa` est accepté ;
- les renommages `email_pseudonymise` → `identifiant_hash` et `ip_pseudonymisee` → `ip_hash` sont acceptés ;
- le remplacement des colonnes `peut_*` par `statut`, `date_debut`, `date_fin` est accepté ;
- la sauvegarde Drive sera créée immédiatement avant la première écriture.
