# LOT 2 — Amorçage du premier super-administrateur

Statut : procédure prête, non exécutée  
Commande : `npm.cmd run bootstrap:super-admin`

## Garanties

- L'amorçage fonctionne uniquement lorsque `USERS` est vide.
- Le mode par défaut est un contrôle à blanc sans écriture.
- Le mode d'écriture exige `--execute`, un terminal interactif et une confirmation humaine exacte.
- Un seul enregistrement `USERS` est ajouté puis relu et comparé.
- Seule l'empreinte `scrypt` est envoyée à Sheets.
- L'accès temporaire de 20 caractères reste en mémoire et n'est affiché qu'une fois, après confirmation de l'écriture.
- Le compte est créé avec `ADMIN`, `est_super_admin = TRUE`, `doit_changer_mot_de_passe = TRUE`, `ACTIF`, expiration à 24 heures et `session_version = 1`.
- Aucun champ `mot_de_passe_temporaire`, fichier d'environnement ou enregistrement `USER_AUTORISATIONS` n'est créé.

## Préparation

Les variables nécessaires doivent être injectées dans le processus par la plateforme ou la session terminal. La procédure ne charge, ne crée et ne modifie aucun fichier `.env`.

Préparer trois valeurs non secrètes :

- un `id_user` stable, par exemple `USR-0001` ;
- le nom complet ;
- l'adresse e-mail institutionnelle normalisée.

## Étape 1 — Contrôle à blanc obligatoire

```powershell
npm.cmd run bootstrap:super-admin -- --id "USR-0001" --nom "Nom complet" --email "adresse@example.org"
```

Résultat attendu :

- le schéma `USERS` est validé ;
- la feuille est confirmée vide ;
- le candidat normalisé est affiché sans hash ni accès temporaire ;
- le message `Contrôle à blanc terminé. Aucune écriture effectuée.` apparaît.

Toute anomalie arrête la procédure.

## Étape 2 — Confirmation humaine séparée

Après relecture et approbation du contrôle à blanc, relancer dans un terminal interactif :

```powershell
npm.cmd run bootstrap:super-admin -- --id "USR-0001" --nom "Nom complet" --email "adresse@example.org" --execute
```

Le programme refait intégralement le contrôle à blanc, puis demande de taper exactement :

```text
CREER LE PREMIER SUPER ADMINISTRATEUR
```

Toute autre réponse annule l'opération sans écriture.

Après ajout et relecture conforme de la ligne, le terminal affiche l'accès temporaire une seule fois. Le copier immédiatement et le transmettre hors bande. Il ne peut pas être relu depuis Sheets.

## Vérification manuelle après création

Vérifier dans `USERS`, sans copier le hash dans un rapport :

- une seule ligne existe ;
- `id_user`, nom et e-mail correspondent à la validation ;
- `password_hash` commence par le format `scrypt$v1$` attendu ;
- `type_user = ADMIN` ;
- `est_super_admin = TRUE` ;
- `doit_changer_mot_de_passe = TRUE` ;
- `statut = ACTIF` ;
- `session_version = 1` ;
- `date_expiration_acces_temporaire` est exactement 24 heures après `date_creation` ;
- aucun champ ou journal ne contient l'accès temporaire.

La connexion n'est pas encore branchée sur ce compte dans T03. L'activation effective sera livrée par les tickets ultérieurs.

## Échec après écriture

Une relecture non confirmée produit une erreur explicite et n'affiche pas l'accès temporaire. Ne pas relancer avec un autre identifiant : inspecter la ligne `USERS` et utiliser la future commande de réinitialisation de T06, ou restaurer la sauvegarde T01 selon décision humaine.
