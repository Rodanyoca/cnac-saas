# Authentification réelle CNAC

L’authentification temporaire et les exceptions locales sont supprimées. Les règles héritées du COC sont réutilisées avec les comptes et ressources CNAC uniquement. Aucun identifiant de classeur ni secret n’est enregistré dans ce document.

## Configuration serveur

| Variable | Usage |
| --- | --- |
| `GOOGLE_SHEETS_USERS_SPREADSHEET_ID` | Classeur CNAC dédié aux quatre feuilles ci-dessous, distinct des classeurs métier. |
| `AUTH_SECRET` | Signature des sessions, au moins 32 caractères aléatoires. |
| `AUTH_TELEMETRY_HMAC_KEY` | Pseudonymisation des adresses et IP dans les tentatives ; au moins 32 caractères, distinct du secret de session. |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Compte de service ayant accès au classeur CNAC. |
| `GOOGLE_PRIVATE_KEY` | Clé privée du compte de service ; séquences `\n` prises en charge. |

Pour Sheets, le compte de service est prioritaire. À défaut, le backend peut utiliser `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET` et `GOOGLE_DRIVE_REFRESH_TOKEN` avec les permissions Sheets requises. Ces variables servent aussi à l’accès backend Drive : elles ne connectent jamais un utilisateur CNAC. Aucune de ces variables ne doit recevoir le préfixe `NEXT_PUBLIC_`.

Les noms sont identiques dans `.env.local` et Vercel. Les secrets doivent être configurés dans chaque environnement d’exécution ; la configuration locale ne vérifie pas celle de Vercel. Après une modification sur Vercel, redéployer l’application.

## Feuilles conservées

Les en-têtes attendus sont ceux de `lib/users/types.ts`, sans adaptation automatique ni copie d’un compte COC : `USERS` (13 colonnes), `USER_AUTORISATIONS` (6), `AUTH_TENTATIVES` (6), `JOURNAL_OPERATIONS` (9). Le bootstrap vérifie les quatre schémas avant toute création.

## Premier super administrateur

Fournir l’identifiant interne, le nom complet et l’adresse email personnelle du premier responsable. Aucune identité ni aucun mot de passe par défaut n’est prévu. Dans un terminal PowerShell situé à la racine CNAC :

```powershell
# Remplacer les trois valeurs entre chevrons avant exécution.
npm.cmd run bootstrap:super-admin -- --id "<ID_USER>" --nom "<NOM_COMPLET>" --email "<EMAIL>"
# Puis, après le contrôle à blanc, dans un terminal interactif :
npm.cmd run bootstrap:super-admin -- --id "<ID_USER>" --nom "<NOM_COMPLET>" --email "<EMAIL>" --execute
```

Le mode sans `--execute` est sans écriture. L’exécution exige la confirmation `CREER LE PREMIER SUPER ADMINISTRATEUR`, refuse USERS dès qu’un compte existe, puis écrit uniquement le hash d’un accès initial aléatoire. Cet accès est affiché une seule fois au responsable dans le terminal et expire après 24 heures. Se connecter sur `/login`, puis choisir un mot de passe personnel sur `/activation`. Ce parcours initial n’est pas un mode d’accès de démonstration.

Il n’existe aucune inscription publique ni création d’administrateur depuis le navigateur. Ne pas exécuter plusieurs bootstraps simultanément : Google Sheets ne fournit pas de transaction inter-instances. Après activation, créer les autres comptes dans `/dashboard/utilisateurs` et leur attribuer les blocs appropriés.

## Contrôles d’accès

- Cookie `cnac_session` signé, HttpOnly, SameSite=Lax, Secure en production, durée de huit heures. Les cookies COC ne sont pas reconnus.
- Chaque accès protégé relit USERS sans cache ni secours sur des données périmées. Désactivation, expiration et changement de `session_version` rendent le jeton invalide.
- Déconnexion : incrément de version confirmé, journalisation, puis suppression du cookie. Elle ferme toutes les sessions du compte. Changement de mot de passe, réinitialisation et révocation administrative invalident aussi les versions précédentes.
- Une session nécessitant l’activation reste limitée à l’activation, au contrôle de session et à la déconnexion.
- `AUT-SPT` : acteurs, fédérations, structure territoriale, compétitions et équipes nationales ; `AUT-ADM` : activités et documents ; `AUT-COM` : site web. Les utilisateurs et référentiels sont réservés au super administrateur.
- VIEWER lit seulement les blocs attribués et actifs. ADMIN écrit dans ces mêmes blocs. Les dates sont inclusives selon la date civile Africa/Kinshasa. Le super administrateur accède à tous les blocs après activation.
- Le proxy protège les pages et endpoints, applique les permissions et contrôle l’origine exacte des mutations, y compris la connexion. Les routes inconnues sont refusées. Les mutations métier possèdent également leurs contrôles serveur. Aucun module server action métier n’est présent actuellement ; toute future action doit effectuer son contrôle d’accès serveur.
- Les tentatives sont persistées avec identifiant et IP pseudonymisés. Dix échecs dans une fenêtre de trente minutes bloquent temporairement l’identifiant pendant trente minutes ; un délai progressif commence au cinquième échec. Le serveur génère les identifiants des tentatives pour empêcher un client de contourner la journalisation par réutilisation de request_id.
- Les écritures de connexion sont confirmées avant création de la session. Une panne ne produit pas de succès fictif. Les réponses publiques de connexion restent génériques ; les réponses de session/utilisateurs excluent `password_hash`.

## Validation et limites

Les tests d’intégration utilisent un adaptateur Sheets en mémoire et exécutent les véritables routes et modules serveur : connexion, refus, activation, droits, rechargement, déconnexion, révocation, panne et CSRF. Aucun compte de test n’est créé dans le classeur réel. Les tests existants couvrent également les mots de passe, tentatives, périodes d’autorisation, protections du dernier super administrateur et bootstrap.

Google Sheets ne possède pas de verrou transactionnel global : les confirmations et compensations réduisent les erreurs, sans garantir une atomicité entre instances. Le journal de tentatives doit être entretenu selon la politique de conservation CNAC ; aucun traitement planifié de purge n’est activé par cette modification.

### Résultats du 4 octobre 2026

- Les quatre feuilles du classeur CNAC fourni ont été contrôlées en lecture seule : en-têtes conformes, aucune écriture.
- 74 tests unitaires ciblés sur l’authentification réussissent ; 37 tests d’intégration réussissent, y compris la création/modification/relecture des affiliations athlètes.
- Suite unitaire complète : 344 succès sur 348. Les quatre échecs concernent des fichiers métier inchangés : deux assertions dans `competitions-final-interfaces.test.ts`, une dans `competitions-t12.test.ts`, une dans `national-team-season.test.ts`.
- Lint : aucune erreur, deux avertissements existants dans le client Arbitres et le chargement de l’historique sportif athlète.
- TypeScript et build de production vérifiés. Connexion testée sur le serveur local existant en desktop et mobile : liens légaux, absence de bouton démo, visiteurs refusés, origine externe refusée, aucun débordement ni erreur JavaScript.
- Contrôle de 73 bundles clients : aucun secret serveur configuré détecté. Les réponses de session et les journaux sont également contrôlés par les tests pour exclure mot de passe et hash.
- Le lancement du CLI sans identité refuse l’opération avec `Argument --id obligatoire.` ; les tests de bootstrap vérifient le refus d’un classeur non vide et le stockage du hash uniquement.

Configuration locale : `AUTH_TELEMETRY_HMAC_KEY` a été complétée avec une clé aléatoire propre au CNAC, conservée uniquement dans `.env.local`. Le contrôle de configuration réussit. Le classeur USERS, le secret de session et les identifiants du compte de service sont renseignés. Ces constats ne vérifient pas les variables Vercel. Le contrôle à blanc du premier administrateur a réussi ; aucune création de compte n’a été exécutée par l’agent. Utiliser la commande avec `--execute` dans le terminal interactif pour finaliser l’initialisation.

### Fichiers concernés

| Ensemble | Fichiers principaux |
| --- | --- |
| Connexion, sessions et permissions | `lib/auth.ts`, `lib/auth/config.ts`, `csrf.ts`, `errors.ts`, `login-error.ts`, `session-cookie.ts`, `proxy.ts` ; API `app/api/auth/*`. |
| Source USERS et écritures confirmées | `lib/users/config.ts`, `data.ts`, `google-adapter.ts`, `commands.ts`, `lib/google/sheets.ts`. |
| Suppression des accès temporaires | Suppression de `lib/demo-mode.ts` et `lib/auth/local-access.ts` ; retrait des exceptions dans `lib/cnac/actor-handler.ts` et `territorial-handler.ts`, et des anciens marqueurs de configuration. |
| Interfaces | Login, activation, compte, layouts Dashboard/Acteurs, en-tête de déconnexion, page d’indisponibilité ; protection propre de l’API de rafraîchissement. |
| Initialisation | `scripts/bootstrap-first-super-admin.ts` et `reset-bootstrap-user-access.ts` : imports Sheets ciblés ; identité obligatoire sans valeur par défaut ; contrôle des schémas au bootstrap. |
| Vérifications et documentation | Nouveaux tests CNAC d’authentification/CSRF ; retrait des tests du mode temporaire ; mise à jour des attentes de sessions, cache et login ; README, AGENTS et cartographie des routes. |
