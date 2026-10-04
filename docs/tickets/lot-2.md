# Backlog d'implémentation — LOT 2

Source fonctionnelle : [`../lot-2-utilisateurs-authentification-autorisations.md`](../lot-2-utilisateurs-authentification-autorisations.md)  
Décisions : [`../adr/0001-authentification-locale-dans-google-sheets.md`](../adr/0001-authentification-locale-dans-google-sheets.md) et [`../adr/0002-autorisations-explicites-et-revocation-par-version.md`](../adr/0002-autorisations-explicites-et-revocation-par-version.md)

Les tickets sont exécutés dans l'ordre ci-dessous. Les fichiers indiqués sont probables : l'implémentation peut affiner leur découpage sans modifier les frontières fonctionnelles. Aucun ticket n'autorise la lecture ou la modification d'un fichier d'environnement. Le design de la connexion du LOT 1 reste inchangé.

## T01 — Valider et préparer les feuilles Google Sheets réelles

**Statut :** terminé et vérifié le 2026-08-31. Les sauvegardes et la mise à niveau de schéma sont consignées dans [`../migrations/lot-2-verification-apres-mise-a-niveau.md`](../migrations/lot-2-verification-apres-mise-a-niveau.md).

### Objectif

Comparer les feuilles réelles à la cible, qualifier chaque écart et produire un plan de mise à niveau réversible avant toute écriture. Le classeur utilisateurs attendu contient `USERS` et `USER_AUTORISATIONS`; le classeur des référentiels contient `BLOCS_AUTORISATION`.

### Portée

- Confirmer les identifiants exacts des classeurs, noms d'onglets, `sheetId`, en-têtes, types de valeurs visibles et volumes utiles.
- Recenser les colonnes historiques `password`, `role`, `peut_creer`, `peut_modifier` et `peut_supprimer` sans lire ni restituer les mots de passe.
- Contrôler les doublons d'e-mails normalisés, identifiants absents, statuts inconnus, rôles non traduits et autorisations orphelines ou superposées.
- Confirmer les trois lignes `AUT-ADM`, `AUT-SPT` et `AUT-COM` ainsi que leur couverture métier.
- Préparer la création de `AUTH_TENTATIVES` et `JOURNAL_OPERATIONS` avec leurs en-têtes exacts.
- Produire un rapport d'écarts, une sauvegarde préalable et un plan d'exécution/retour arrière. Aucune migration de compte n'est exécutée dans ce ticket.

### Fichiers probables

- `docs/lot-2-utilisateurs-authentification-autorisations.md`
- `docs/migrations/lot-2-etat-feuilles.md` (nouveau)
- `docs/migrations/lot-2-plan-feuilles.md` (nouveau)
- Aucun fichier d'environnement

### Dépendances

- Aucune.

### Critères d'acceptation

- Chaque feuille réelle est reliée à un classeur et à un `sheetId` vérifiés.
- Chaque colonne réelle est classée : conservée, ajoutée, transformée, abandonnée ou anomalie à traiter.
- Le rapport ne contient aucun mot de passe, hash complet, cookie, jeton ou secret.
- Les doublons, valeurs invalides et relations orphelines sont comptés et identifiables par identifiant non secret.
- Le plan décrit l'ordre des opérations, la sauvegarde, les contrôles après écriture et le retour arrière.
- La validation humaine du rapport constitue la condition de démarrage de T02 et T03.

### Tests et vérifications

- Lecture bornée des métadonnées puis des seuls en-têtes nécessaires.
- Contrôle automatisé des en-têtes attendus et des valeurs contrôlées.
- Détection d'e-mails dupliqués après normalisation, sans les publier dans les sorties de test.
- Détection des périodes d'autorisation invalides ou chevauchantes.
- Relecture indépendante du rapport contre la spécification et les deux ADR.

## T02 — Construire la couche Google Sheets du LOT 2

**Statut :** terminé le 2026-08-31. Couche typée, validations strictes, lectures fraîches, erreurs structurées, écritures techniques idempotentes et tests unitaires ajoutés. Le branchement de la connexion sur ce modèle reste réservé à T03.

### Objectif

Fournir une couche serveur typée pour lire et écrire les quatre feuilles du LOT 2 avec validation, fraîcheur imposée pour la sécurité, commandes idempotentes et gestion explicite des échecs partiels.

### Portée

- Définir les types et validateurs de `USERS`, `USER_AUTORISATIONS`, `AUTH_TENTATIVES` et `JOURNAL_OPERATIONS`.
- Centraliser normalisation des e-mails, booléens, statuts, dates ISO et calculs calendaires `Africa/Kinshasa`.
- Ajouter les lectures ciblées par identifiant et e-mail normalisé.
- Ajouter les commandes de création/mise à jour avec `request_id`, relecture préalable et vérification après écriture.
- Ajouter la détection des autorisations qui se chevauchent.
- Distinguer indisponibilité, feuille absente, schéma invalide et enregistrement absent.
- Garantir un chemin sans cache pour comptes, versions de session et autorisations.

### Fichiers probables

- `lib/users/config.ts`
- `lib/users/data.ts`
- `lib/users/types.ts` (nouveau)
- `lib/users/validation.ts` (nouveau)
- `lib/users/commands.ts` (nouveau)
- `lib/users/authorizations.ts` (nouveau)
- `lib/auth/attempts-data.ts` (nouveau)
- `lib/audit/data.ts` (nouveau)
- `lib/google/sheets.ts`
- `tests/unit/users-data.test.ts` (nouveau)
- `tests/unit/users-validation.test.ts` (nouveau)

### Dépendances

- T01 validé.

### Critères d'acceptation

- Les schémas incomplets ou inconnus échouent avec une erreur serveur contrôlée.
- Les lectures de sécurité contournent effectivement le cache.
- Les e-mails sont uniques selon la normalisation décidée.
- Une période future est acceptée ; une période invalide ou chevauchante est refusée.
- Répéter une commande avec le même `request_id` ne duplique aucune ligne.
- Un échec multi-feuilles n'est jamais renvoyé comme succès et laisse une trace exploitable pour compensation.
- Les erreurs et traces de diagnostic sont expurgées de toute donnée d'authentification sensible.

### Tests

- Tests unitaires des mappers, validateurs, dates inclusives et normalisation d'e-mail.
- Tests avec adaptateur Sheets simulé : succès, timeout, onglet absent, en-tête manquant, ligne dupliquée et écriture partielle.
- Test d'idempotence par répétition du même `request_id`.
- Test confirmant qu'une lecture sécuritaire ne reçoit ni ne retourne une valeur mise en cache.

## T03 — Implémenter le hachage et préparer la migration des comptes

**Statut :** terminé le 2026-08-31, sans création réelle. `USERS` étant vide, la migration historique est remplacée par une procédure d'amorçage contrôlée du premier super-administrateur. Voir [`../migrations/lot-2-amorcage-premier-super-admin.md`](../migrations/lot-2-amorcage-premier-super-admin.md).

### Objectif

Remplacer le mot de passe en clair par des empreintes `scrypt` versionnées et fournir une migration contrôlée qui abandonne tous les anciens secrets.

### Portée

- Implémenter le format `scrypt$v1$N=65536,r=8,p=1,l=64$<sel>$<empreinte>` avec sel aléatoire de 16 octets.
- Réserver au moins 128 Mio pour `scrypt`, vérifier le format avant calcul et comparer en temps constant.
- Valider la politique de 12 à 128 caractères et les mots de passe manifestement compromis ou courants.
- Générer un accès temporaire aléatoire de 20 caractères et ne retourner sa valeur qu'au point de création.
- Préparer un amorçage séparé : contrôle à blanc par défaut, confirmation humaine interactive, création unique et vérification après écriture.
- Créer uniquement la commande `USERS` nécessaire à l'amorçage ; les autres commandes restent rattachées aux tickets qui les utilisent.
- Éviter toute sortie de secret dans les journaux, exceptions, snapshots ou rapports.

### Fichiers probables

- `lib/auth/password.ts` (nouveau)
- `lib/auth/password-policy.ts` (nouveau)
- `lib/auth/temporary-access.ts` (nouveau)
- `lib/users/bootstrap.ts` (nouveau)
- `lib/users/commands.ts` (création minimale T03)
- `scripts/bootstrap-first-super-admin.ts` (nouveau)
- `docs/migrations/lot-2-amorcage-premier-super-admin.md` (nouveau)
- `tests/unit/password.test.ts` (nouveau)
- `tests/unit/users-migration.test.ts` (nouveau)
- `package.json` uniquement si un script de migration doit être déclaré

### Dépendances

- T01 pour le rapport réel et la traduction des comptes.
- T02 pour les lectures et commandes Sheets.

### Critères d'acceptation

- Deux hachages du même mot de passe produisent des valeurs différentes et vérifiables.
- Un format, une version ou des paramètres inconnus sont refusés proprement.
- La comparaison utilise une primitive en temps constant.
- L'accès temporaire respecte longueur, aléa, expiration de 24 heures et affichage unique.
- Le mode à blanc ne modifie aucune feuille et liste toutes les anomalies bloquantes.
- L'amorçage refuse une feuille non vide, fixe `session_version = 1` et exige une activation sous 24 heures.
- Aucun secret en clair n'apparaît dans le rapport, la console, les erreurs ou les fixtures versionnées.

### Tests

- Vecteurs positifs et négatifs de hachage/vérification.
- Sel unique, format corrompu, longueur minimale/maximale et refus d'un mot de passe compromis.
- Générateur aléatoire simulé pour tester l'affichage unique sans figer un secret réel.
- Amorçage sur feuille simulée : contrôle à blanc, feuille non vide, e-mail dupliqué, reprise idempotente et écriture non confirmée.
- Scan automatisé des sorties et fixtures contre les valeurs de secrets de test.

## T04 — Remplacer les sessions et appliquer leur révocation

**État : implémenté et vérifié.** La connexion LOT 1 demeure volontairement non branchée ; aucun compte réel n'a été créé.

### Objectif

Émettre des sessions signées de huit heures liées à `session_version`, puis refuser immédiatement les sessions expirées, révoquées ou rattachées à un compte non actif.

### Portée

- Remplacer le payload `coc/technique` par `id_user`, `session_version`, `iat` et `exp`.
- Conserver les attributs `HttpOnly`, `SameSite=Lax`, `Secure` en production et l'absence de prolongation silencieuse.
- Recharger sans cache le compte lors de chaque page protégée et action sensible.
- Refuser un compte absent, `INACTIF`, `BLOQUE`, dont l'accès temporaire est expiré ou dont la version diffère.
- Limiter une session en activation obligatoire à l'activation, la session minimale et la déconnexion.
- Centraliser création, validation, renouvellement après changement volontaire et destruction de session.
- Distinguer le contrôle cryptographique léger du cookie et la résolution complète de l'utilisateur.
- Retourner des réponses 401/403 cohérentes sans exposer l'état interne du compte.

### Fichiers probables

- `lib/auth.ts`
- `lib/auth/session.ts` (nouveau, si extraction)
- `lib/auth/current-user.ts` (nouveau)
- `proxy.ts`
- `app/api/auth/session/route.ts`
- `app/api/auth/logout/route.ts`
- `tests/unit/session.test.ts` (nouveau)
- `tests/integration/session-revocation.test.ts` (nouveau)

### Dépendances

- T02 pour les lectures fraîches du compte.
- T03 pour le futur renouvellement après changement de mot de passe.

### Critères d'acceptation

- La durée absolue est exactement de huit heures et n'est pas prolongée par l'activité.
- Une version obsolète, un compte non actif ou un accès temporaire expiré invalide la session.
- Une activation en attente interdit toute page et API métier sans invalider la session minimale.
- Une indisponibilité de Sheets produit un refus sécurisé.
- La déconnexion rend le cookie courant inutilisable.
- Le changement volontaire peut émettre une nouvelle session après incrément ; les autres sessions restent révoquées.
- Aucun ancien payload `role: coc|technique` n'est accepté.

### Tests

- Tests avec horloge contrôlée : juste avant, à et après l'expiration.
- Signature altérée, payload incomplet, version obsolète et utilisateur absent.
- Statuts `ACTIF`, `INACTIF`, `BLOQUE` et activation obligatoire.
- Panne et latence de Sheets.
- Vérification des attributs du cookie en développement et production.

## T05 — Centraliser et appliquer les autorisations côté serveur

**État : implémenté et vérifié.** Matrice exhaustive dans `docs/lot-2-matrice-routes-t05.md`; aucune donnée réelle écrite et aucun déploiement effectué.

### Objectif

Faire de chaque route serveur le point d'application obligatoire du couple action/bloc, avec refus par défaut et suppression complète de l'ancien modèle `coc/technique`.

### Portée

- Définir les actions `READ` et `WRITE`, les trois blocs et la règle spéciale de super-administration.
- Construire un garde serveur unique qui vérifie session, statut, activation, version, type, super-administration et attribution datée.
- Cartographier toutes les pages et routes API existantes vers `AUT-ADM`, `AUT-SPT`, `AUT-COM` ou `SUPER_ADMIN`.
- Appliquer `VIEWER = lecture seule` et `ADMIN = écriture uniquement dans les blocs attribués`.
- Appliquer les bornes inclusives dans `Africa/Kinshasa`.
- Interdire toute permission dérivée d'une ligne absente, expirée, future ou inactive.
- Protéger le dernier super-administrateur actif.
- Aligner la navigation et les boutons sur les droits calculés, sans en faire une barrière de sécurité.

### Fichiers probables

- `lib/auth/authorization.ts` (nouveau)
- `lib/auth/route-policy.ts` (nouveau)
- `proxy.ts`
- `components/dashboard/sidebar.tsx`
- `app/dashboard/layout.tsx`
- `app/api/**/route.ts` pour toutes les routes métier existantes
- `lib/documents/auth.ts`
- `tests/unit/authorization.test.ts` (nouveau)
- `tests/integration/api-authorization.test.ts` (nouveau)

### Dépendances

- T02 pour les autorisations réelles.
- T04 pour l'utilisateur courant et la version de session.

### Critères d'acceptation

- Chaque route API et page protégée possède une politique explicite recensée dans une matrice vérifiable.
- Un `VIEWER` ne réussit aucune mutation, y compris par appel HTTP direct.
- Un `ADMIN` ne modifie que les blocs attribués et valides.
- Un super-administrateur dispose d’un accès complet aux trois blocs métier, même sans attribution explicite.
- Seul le super-administrateur accède aux utilisateurs, autorisations et référentiels.
- Le dernier super-administrateur actif ne peut être neutralisé, y compris par lui-même.
- La suppression de l'ancien rôle est complète dans les chemins d'autorisation.

### Tests

- Table de décision exhaustive profil × bloc × action × état de période.
- Test de toutes les routes d'écriture avec `VIEWER`, `ADMIN` autorisé, `ADMIN` non autorisé et super-administrateur sans bloc.
- Tests aux deux bornes calendaires dans `Africa/Kinshasa`.
- Test de contournement par URL directe et requête API forgée.
- Test de panne de la source d'autorisation et de refus par défaut.
- Recherche statique empêchant la réintroduction des contrôles `role === "coc"` ou `role === "technique"`.

## T06 — Livrer l'activation, le changement et la réinitialisation d'accès

**État : implémenté et vérifié avec données simulées.** Aucun compte réel créé. La réinitialisation exige un `requestId` et ne restitue jamais l'accès temporaire lors d'une reprise idempotente.

### Objectif

Implémenter les parcours sécurisés d'activation initiale, changement volontaire, réinitialisation administrative et changement d'adresse, sans redessiner la connexion existante.

### Portée

- Adapter la connexion au hash, aux statuts et à la redirection d'activation.
- Créer la page et l'API d'activation accessibles uniquement à une session d'activation valide.
- Vérifier l'accès temporaire, son expiration et la confirmation du nouveau mot de passe.
- Créer « Mon compte » avec lecture des informations et changement volontaire après vérification du mot de passe courant.
- Créer la commande de réinitialisation administrative et l'affichage unique du nouvel accès temporaire.
- Traiter le changement d'adresse comme une nouvelle activation.
- Ajouter dans ce ticket les commandes `USERS` nécessaires au changement et à la réinitialisation, avec idempotence et relecture après écriture.
- Incrémenter `session_version` et écrire les événements d'audit requis via les interfaces prévues.
- Conserver le message générique et la composition visuelle du LOT 1.

### Fichiers probables

- `app/api/auth/login/route.ts`
- `app/api/auth/activate/route.ts` (nouveau)
- `app/api/auth/change-password/route.ts` (nouveau)
- `app/api/users/[id]/reset-access/route.ts` (nouveau)
- `app/activation/page.tsx` (nouveau)
- `app/mon-compte/page.tsx` (nouveau)
- `app/mon-compte/mon-compte-client.tsx` (nouveau)
- `app/login/page.tsx` uniquement pour le routage et les états, sans changement de design
- `lib/users/commands.ts`
- `tests/e2e/activation.spec.ts` (nouveau)
- `tests/e2e/account-password.spec.ts` (nouveau)

### Dépendances

- T03 pour hachage et accès temporaire.
- T04 pour session d'activation et renouvellement.
- T05 pour les restrictions de parcours et la réinitialisation super-administrateur.

### Critères d'acceptation

- Un compte à activer ne peut atteindre que l'activation, la session minimale et la déconnexion.
- Un accès temporaire expiré ou remplacé est refusé avec un message non révélateur.
- L'activation réussie vide l'expiration temporaire, met à jour les dates, incrémente la version et émet une session valide.
- Un changement volontaire vérifie le mot de passe courant et renouvelle uniquement la session initiatrice.
- Une réinitialisation et un changement d'adresse révoquent toutes les anciennes sessions.
- Le nouvel accès temporaire n'est affiché qu'une fois et n'est jamais récupérable ensuite.
- La connexion conserve ses tests visuels et fonctionnels du LOT 1.

### Tests

- E2E première connexion, activation réussie, confirmation différente et secret trop faible.
- Accès temporaire expiré, déjà consommé et incorrect.
- Changement volontaire avec mot de passe courant correct ou incorrect.
- Réinitialisation administrative suivie du refus de l'ancien mot de passe et des anciennes sessions.
- Changement d'adresse et contrôle de l'unicité normalisée.
- Snapshot ou comparaison visuelle ciblée confirmant l'absence de redesign de la connexion.

## T07 — Construire l'administration des utilisateurs

**État : implémenté et vérifié avec données simulées.** Aucun compte réel ni aucune donnée Sheets n'ont été créés. Les mutations sont tracées par `request_id`; les opérations multi-feuilles vérifient leurs écritures et compensent explicitement les échecs partiels.

### Objectif

Fournir au super-administrateur les pages et commandes de gestion des comptes, statuts, types, super-administration, autorisations et sessions.

### Portée

- Liste avec recherche et filtres par type, statut et qualité de super-administrateur.
- Formulaire de création avec attribution initiale et remise unique de l'accès temporaire.
- Détail du compte, informations de sécurité non sensibles et historique minimal.
- Modification de l'identité, de l'adresse, du type, du statut et de `est_super_admin`.
- Attribution future, modification, fermeture et retrait logique des blocs.
- Réinitialisation d'accès et action « déconnecter toutes les sessions ».
- Confirmations explicites pour les actions révoquant des sessions.
- Messages exploitables en cas d'écriture partielle ou d'anomalie Sheets.
- Ajouter les commandes administratives restantes pour `USERS` et toutes les commandes `USER_AUTORISATIONS` utilisées par ces parcours.
- Orchestrer les opérations qui touchent plusieurs feuilles avec `request_id`, vérification de chaque écriture et compensation explicite en cas d'échec partiel.

### Fichiers probables

- `app/dashboard/utilisateurs/page.tsx` (nouveau)
- `app/dashboard/utilisateurs/users-client.tsx` (nouveau)
- `app/dashboard/utilisateurs/nouveau/page.tsx` (nouveau)
- `app/dashboard/utilisateurs/[id]/page.tsx` (nouveau)
- `app/dashboard/utilisateurs/[id]/user-detail-client.tsx` (nouveau)
- `app/api/users/route.ts` (nouveau)
- `app/api/users/[id]/route.ts` (nouveau)
- `app/api/users/[id]/authorizations/route.ts` (nouveau)
- `app/api/users/[id]/revoke-sessions/route.ts` (nouveau)
- `components/dashboard/sidebar.tsx`
- `lib/users/commands.ts`
- `lib/users/authorization-commands.ts` (nouveau)
- `lib/users/administration-workflows.ts` (nouveau, compensation multi-feuilles)
- `tests/e2e/users-admin.spec.ts` (nouveau)

### Dépendances

- T02 pour les commandes utilisateurs/autorisations.
- T05 pour la super-administration et les protections serveur.
- T06 pour création et réinitialisation d'accès.

### Critères d'acceptation

- Toutes les pages et API d'administration sont réservées au super-administrateur.
- La création refuse un e-mail existant et oriente vers le compte correspondant.
- Les changements sensibles révoquent les sessions conformément à la spécification.
- Les périodes superposées et valeurs contrôlées invalides sont refusées côté serveur.
- Le dernier super-administrateur actif reste protégé dans tous les parcours.
- Les actions retirent ou ferment les autorisations sans supprimer l'historique.
- Aucun secret existant, hash ou cookie n'est visible dans les pages ou réponses.

### Tests

- E2E liste, filtres, création, détail, modification et révocation.
- Accès refusé à un `VIEWER`, un `ADMIN` et un utilisateur non authentifié.
- Scénarios e-mail dupliqué, dernière super-administration, dates superposées et écriture partielle.
- Vérification de l'affichage unique du secret temporaire.
- Tests d'accessibilité des formulaires, dialogues et messages d'erreur.

## T08 — Finaliser l'audit et la limitation des tentatives

**État : implémenté et vérifié avec données simulées.** Aucun compte ni journal réel n'a été écrit. La connexion exige désormais une clé HMAC de télémétrie fournie par la plateforme ; aucune valeur de clé n'est versionnée.

### Objectif

Rendre les opérations importantes traçables et appliquer une défense uniforme contre les connexions répétées sans divulguer l'existence des comptes.

### Portée

- Implémenter l'écriture append-only de `AUTH_TENTATIVES` et `JOURNAL_OPERATIONS`.
- Pseudonymiser e-mail et adresse réseau par HMAC-SHA-256 avec une clé de télémétrie distincte fournie par la plateforme.
- Calculer la série depuis le dernier succès et le blocage de 30 minutes déclenché au dixième échec dans la fenêtre de 30 minutes.
- Appliquer une attente progressive après cinq échecs sans révéler le motif.
- Distinguer blocage temporaire calculé et statut administratif `BLOQUE`.
- Instrumenter tous les événements définis dans la spécification avec un `request_id` idempotent.
- Prévoir la purge après 90 jours des tentatives et la conservation minimale de 24 mois de l'audit.
- Expurger systématiquement détails, erreurs et métadonnées.

### Fichiers probables

- `lib/auth/attempts.ts` (nouveau)
- `lib/auth/telemetry-hash.ts` (nouveau)
- `lib/audit/logger.ts` (nouveau)
- `lib/audit/actions.ts` (nouveau)
- `app/api/auth/login/route.ts`
- `lib/users/commands.ts`
- `scripts/purge-auth-attempts.ts` (nouveau)
- `tests/unit/login-attempts.test.ts` (nouveau)
- `tests/integration/audit.test.ts` (nouveau)

### Dépendances

- T02 pour les feuilles techniques.
- T03 pour l'authentification réelle.
- T06 et T07 pour disposer de tous les événements à instrumenter.

### Critères d'acceptation

- Le cinquième échec active l'attente progressive prévue ; le dixième déclenche exactement 30 minutes de blocage temporaire.
- Le blocage temporaire se lève automatiquement et ne modifie jamais `USERS.statut`.
- Les comptes connus et inconnus ont des réponses et transitions observables équivalentes.
- Chaque opération obligatoire produit une seule ligne d'audit par `request_id`.
- Aucun e-mail, adresse réseau, mot de passe, hash de mot de passe, cookie ou secret n'est écrit en clair.
- Les échecs d'audit sont signalés selon la criticité de l'opération et ne transforment jamais un échec métier en succès.
- Les règles de rétention sont exécutables et vérifiables sans fichier d'environnement versionné.

### Tests

- Horloge simulée autour des fenêtres de 30 minutes et de la levée automatique.
- Séquences de 4, 5, 9 et 10 échecs, succès intermédiaire et tentatives pendant le blocage.
- Parité de réponse compte connu/inconnu.
- Idempotence et concurrence de deux requêtes portant le même `request_id`.
- Scan des feuilles simulées et sorties de logs pour données sensibles.
- Tests de purge à 90 jours et de préservation du journal d'audit.

## T09 — Exécuter la campagne complète de tests et de réception

**État : campagne exécutée, réception technique favorable.** Matrice et rapport disponibles dans `docs/tests/`; aucun compte réel créé, aucune écriture Sheets réelle, aucun fichier d'environnement modifié et aucun déploiement.

### Objectif

Démontrer que le LOT 2 satisfait la spécification, les ADR, la sécurité serveur et la non-régression du LOT 1 avant toute réception.

### Portée

- Consolider les tests unitaires, intégration API et E2E des tickets précédents.
- Construire une matrice de couverture exigences → tests.
- Tester tous les profils, blocs, actions, statuts, périodes et événements de révocation.
- Vérifier les cas de panne, latence, schéma invalide et écriture partielle de Google Sheets.
- Vérifier l'absence de secrets dans code, fixtures, sorties, réponses et rendus.
- Vérifier accessibilité, navigation clavier, messages et conservation visuelle de la connexion.
- Exécuter lint, type-check, build et suite Playwright dans l'environnement cible.
- Produire un rapport de réception avec anomalies classées et preuves reproductibles.

### Fichiers probables

- `tests/unit/**`
- `tests/integration/**`
- `tests/e2e/login.spec.ts`
- `tests/e2e/activation.spec.ts`
- `tests/e2e/account-password.spec.ts`
- `tests/e2e/users-admin.spec.ts`
- `tests/e2e/authorization-matrix.spec.ts` (nouveau)
- `tests/fixtures/auth/**` (nouveau, secrets exclusivement synthétiques)
- `playwright.config.ts`
- `package.json` pour les scripts de test uniquement si nécessaire
- `docs/tests/lot-2-matrice.md` (nouveau)
- `docs/tests/lot-2-rapport-reception.md` (nouveau)

### Dépendances

- T01 à T08 terminés.

### Critères d'acceptation

- Chaque exigence et chaque critère de la spécification possède au moins un test identifié.
- Tous les chemins d'écriture sont couverts par un test serveur d'autorisation positif et négatif.
- Tous les événements de révocation invalident une session antérieure dans les tests.
- Les tests prouvent l’absence d’accès implicite pour les comptes ordinaires, l’accès complet du super-administrateur et la distinction des deux formes de blocage.
- La connexion du LOT 1 ne présente aucune régression visuelle ou fonctionnelle.
- Lint, vérification TypeScript, build et suites automatisées réussissent.
- Aucun secret réel ou en clair n'est détecté dans les artefacts de test.
- Le rapport ne contient aucune anomalie bloquante connue ; les autres anomalies sont classées, reproductibles et acceptées avant réception.

### Tests finaux

- Matrice `VIEWER`/`ADMIN`/super-administrateur × trois blocs × lecture/écriture × attribution valide/invalide.
- Création → accès temporaire → activation → changement volontaire → réinitialisation → révocation.
- Désactivation, blocage administratif, réactivation et protection du dernier super-administrateur.
- Cinq puis dix échecs, blocage temporaire, levée automatique et succès ultérieur.
- Expiration à 24 heures de l'accès temporaire et à huit heures de la session.
- Pannes Sheets en lecture, écriture, contrôle d'autorisation et audit.
- Tests de sécurité directs sur toutes les API, indépendamment de l'interface.
- Exécution documentée de `npm run lint`, de la vérification TypeScript, de `npm run build` et de `npm run test:e2e` ou scripts équivalents déclarés par le dépôt.
