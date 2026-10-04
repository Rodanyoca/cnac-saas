# Authentification CNAC : étude du modèle COC et rapport d’écarts

Date : 4 octobre 2026. Périmètre : documentation et code des dépôts locaux COC et CNAC. Étude en lecture seule du COC ; aucune modification du code applicatif, des variables, des comptes ou des classeurs. Aucun déploiement.

> État historique avant implémentation. Le mode temporaire décrit dans ce rapport est supprimé. Consulter [l’authentification réelle CNAC](cnac-authentification-reelle.md) pour le fonctionnement et le bootstrap actuels.

## Décision proposée

CNAC possède déjà l’essentiel du système d’authentification COC. Il faut remettre en service cette branche héritée, connecter un classeur utilisateurs propre au CNAC et amorcer son premier administrateur, plutôt que développer un nouveau système. Le compte temporaire configuré dans l’environnement et le mode démonstration contournent actuellement cette branche. Le classeur `USERS` seul ne suffit pas : quatre feuilles techniques et le référentiel des trois blocs sont nécessaires.

Cette conclusion porte sur le code local. L’état réel des variables Vercel et des feuilles Google Sheets n’a pas été vérifié. La présence d’une variable locale de classeur ne prouve ni que ce classeur appartient au CNAC ni que son schéma est conforme.

## Sources et ordre de lecture

Les documents COC décrivent différentes étapes d’un même lot. Les mentions « T04 non démarré » dans un rapport T03 sont historiques : elles ne signifient pas que le code actuel ne contient pas les sessions ou l’activation. Le rapport de réception et le code actuel priment pour constater ce qui est livré.

| Source COC | Apport et repères |
| --- | --- |
| [Spécification LOT 2](../../../coc-cible/docs/lot-2-utilisateurs-authentification-autorisations.md) | Modèle des feuilles, politique de secrets, sessions, autorisations, parcours et migration ; sections 2 à 8. |
| [ADR 0001](../../../coc-cible/docs/adr/0001-authentification-locale-dans-google-sheets.md) | Authentification locale avec empreintes `scrypt` dans Sheets ; lignes 5–11. |
| [ADR 0002](../../../coc-cible/docs/adr/0002-autorisations-explicites-et-revocation-par-version.md) | Attributions explicites et révocation par `session_version` ; lignes 5–7. |
| [Backlog LOT 2](../../../coc-cible/docs/tickets/lot-2.md) | Chronologie T01 à T09 ; réception T09 ligne 445. |
| [État et plan des feuilles](../../../coc-cible/docs/migrations/lot-2-plan-feuilles.md) | Préparation du stockage et migration, à distinguer de la création de comptes. |
| [Vérification après mise à niveau](../../../coc-cible/docs/migrations/lot-2-verification-apres-mise-a-niveau.md) | Preuve historique de mise à niveau des feuilles COC ; section 2. Les identifiants présents dans ce document ne sont pas repris ici. |
| [Implémentation T02](../../../coc-cible/docs/implementation/lot-2-t02.md) et [T03](../../../coc-cible/docs/implementation/lot-2-t03.md) | Dépôt typé, validations, hachage, politique et amorçage. |
| [Amorçage](../../../coc-cible/docs/migrations/lot-2-amorcage-premier-super-admin.md) | Contrôle à blanc, confirmation interactive et accès temporaire. |
| [Matrice de tests](../../../coc-cible/docs/tests/lot-2-matrice.md) et [réception](../../../coc-cible/docs/tests/lot-2-rapport-reception.md) | Preuves automatisées historiques et réserves de déploiement ; réception lignes 44–51. |
| [Correction connexion/navigation](../../../coc-cible/docs/implementation/correction-connexion-navigation-2026-09-01.md) | Destination après connexion, navigation du super-administrateur, chargements et fraîcheur. |

Les liens CNAC ci-dessous visent les fichiers effectivement présents aujourd’hui. Des fichiers sous `docs/` CNAC sont des copies de COC : ils constituent une référence, pas une réception de l’authentification CNAC en production.

## Modèle livré dans COC

### Stockage et comptes

Le compte contient un identifiant stable, une adresse normalisée et unique, une empreinte de mot de passe, le type `ADMIN` ou `VIEWER`, un indicateur super-administrateur, le statut et une version de session. Les autorisations sont des périodes explicites, conservées historiquement. Les données sont validées à la lecture, y compris les en-têtes, les doublons et les chevauchements de périodes. Sources : [types COC](../../../coc-cible/lib/users/types.ts), lignes 1–68 ; [dépôt COC](../../../coc-cible/lib/users/repository.ts), lignes 36–105.

### Secrets et activation

Le mot de passe permanent comporte 12 à 128 caractères. Le hachage utilise `scrypt`, avec sel aléatoire de 16 octets, empreinte de 64 octets, paramètres versionnés et comparaison en temps constant. La vérification des mots de passe courants repose sur une petite liste locale, sans service externe de recherche de compromission. Un nouvel accès temporaire comporte 20 caractères, expire après 24 heures et doit être remplacé par un secret différent avant accès métier. Sources : [hachage COC](../../../coc-cible/lib/auth/password.ts), lignes 1–65 ; [politique COC](../../../coc-cible/lib/auth/password-policy.ts), lignes 1–44 ; [parcours de compte COC](../../../coc-cible/lib/auth/account-workflows.ts), lignes 16–47.

### Sessions, accès et administration

La session est signée avec HMAC-SHA-256, expire huit heures après émission et ne se prolonge pas silencieusement. Le cookie est `HttpOnly`, `SameSite=Lax`, et `Secure` en production. Le résolveur confronte la version signée à celle du compte et refuse les comptes inactifs, bloqués ou les accès temporaires expirés. Le proxy restreint les comptes à activer et applique une politique par route et méthode. Sources : [session COC](../../../coc-cible/lib/auth/session-token.ts), lignes 1–70 ; [cookie COC](../../../coc-cible/lib/auth/session-cookie.ts), lignes 1–7 ; [résolution COC](../../../coc-cible/lib/auth/session-resolution.ts), lignes 9–22 ; [proxy COC](../../../coc-cible/proxy.ts).

Un `VIEWER` lit ses blocs attribués ; un `ADMIN` les lit et les modifie. Le super-administrateur accède aux trois blocs et gère utilisateurs, autorisations et référentiels. Les changements sensibles incrémentent la version du compte. Le dernier super-administrateur actif est protégé. Les commandes administratives utilisent un `request_id`, une relecture de confirmation et des compensations en cas d’écriture partielle. Sources : [autorisation COC](../../../coc-cible/lib/auth/authorization.ts), lignes 14–39 ; [administration COC](../../../coc-cible/lib/users/administration-workflows.ts), lignes 18–48 ; [commandes COC](../../../coc-cible/lib/users/commands.ts).

### Tentatives, audit et amorçage

La protection durable s’appuie sur `AUTH_TENTATIVES` : dix échecs sur trente minutes déclenchent trente minutes de blocage, avec délais progressifs. L’adresse et l’IP sont pseudonymisées avec une clé HMAC distincte. Le calcul du blocage utilise l’identifiant ; l’IP est enregistrée mais n’est pas utilisée comme seuil indépendant. `JOURNAL_OPERATIONS` conserve les actions expurgées. Une commande de purge existe pour les tentatives ; sa planification reste une opération d’exploitation. Sources : [tentatives COC](../../../coc-cible/lib/auth/attempts.ts), lignes 5–25 ; [télémétrie COC](../../../coc-cible/lib/auth/telemetry-hash.ts), lignes 3–16 ; [purge COC](../../../coc-cible/scripts/purge-auth-attempts.ts).

Le bootstrap crée uniquement le premier super-administrateur dans une feuille `USERS` vide, en contrôle à blanc par défaut puis écriture avec confirmation interactive. Il fournit un accès temporaire une seule fois. Ce n’est pas un script pour copier les comptes COC. Sources : [bootstrap COC](../../../coc-cible/lib/users/bootstrap.ts), lignes 38–87 ; [CLI COC](../../../coc-cible/scripts/bootstrap-first-super-admin.ts), lignes 49–114.

## État actuel CNAC

### Trois branches distinctes

Le serveur choisit d’abord l’authentification locale si `CNAC_LOCAL_AUTH=true`, puis la démonstration si l’un des indicateurs `CNAC_DEMO_MODE` ou `NEXT_PUBLIC_CNAC_DEMO_MODE` vaut `true`, puis seulement l’authentification héritée COC. En démonstration sans authentification locale, le proxy laisse passer les requêtes et `getSession()` fournit un administrateur synthétique sans connexion. Sources : [session CNAC](../../lib/auth.ts), lignes 39–47 ; [proxy CNAC](../../proxy.ts), lignes 31–40 ; [mode démo](../../lib/demo-mode.ts), lignes 1–3.

Le contrôle local de configuration effectué pour cette étude constate : les deux indicateurs de démonstration et les deux indicateurs d’authentification locale sont activés ; l’identifiant de classeur utilisateurs, le secret de session et les identifiants de compte de service Google sont renseignés ; la clé de télémétrie n’est pas exploitable, car absente ou laissée en valeur de remplacement. L’identifiant utilisateurs est distinct de celui du classeur COC historique documenté et des trois classeurs métier CNAC ; cela ne confirme pas l’existence, la propriété ou les permissions du classeur. Aucune valeur, adresse de compte de service, clé ou identifiant de classeur n’est reproduit. Cette observation ne décrit pas automatiquement Vercel.

L’authentification locale vérifie une adresse et un mot de passe d’environnement et crée un administrateur synthétique. Son mot de passe n’est pas haché avec `scrypt` au stockage : la comparaison de condensats SHA-256 sert uniquement à la comparaison en temps constant. Elle ne valide pas la politique 12–128 caractères. Sa limitation des tentatives est une `Map` mémoire, par paire IP/adresse, avec huit échecs et une fenêtre de quinze minutes ; elle n’est ni partagée entre instances ni conservée après redémarrage. Sources : [accès local](../../lib/auth/local-access.ts), lignes 7–47 ; [connexion](../../app/api/auth/login/route.ts), lignes 32–41.

Le flag public `NEXT_PUBLIC_CNAC_LOCAL_AUTH` n’est pas un contrôle de sécurité : il sert à masquer le parcours de démonstration dans la page de connexion. Le comportement serveur dépend de `CNAC_LOCAL_AUTH`. Source : [page connexion](../../app/login/page.tsx), ligne 26.

### Matrice des écarts

| Domaine | COC livré / cible documentaire | CNAC effectif actuellement | Écart et conséquence |
| --- | --- | --- | --- |
| Identités | Comptes individuels validés dans `USERS` | Compte synthétique administrateur local | Branche COC déjà copiée, mais non utilisée. Aucun statut individuel ni séparation des utilisateurs. |
| Mot de passe | Empreinte `scrypt`, politique, activation | Secret d’environnement, sans activation | Le parcours temporaire n’est pas le cycle de vie de comptes COC. |
| Session | Signature, huit heures, version du compte | Même signature et expiration, version fixée à 1 | Modifier le mot de passe local ne révoque pas les cookies déjà signés. La rotation du secret de signature invalide ces cookies. [Accès local](../../lib/auth/local-access.ts), lignes 19–30. |
| Permissions | Politique par route, type et blocs | Proxy local accepte toute route couverte avec cookie valide | La matrice COC est contournée ; navigation et `canAccess` donnent tous les droits. [Proxy](../../proxy.ts), lignes 34–37 ; [session](../../lib/auth.ts), lignes 67–83. |
| Activation / mon compte | Activation et changement de secret via `USERS` | Pages héritées présentes, compte synthétique absent de Sheets | La route de changement recherche cet identifiant dans `USERS` et échoue ; ce bouton ne change pas le secret local. [Route](../../app/api/auth/change-password/route.ts), ligne 6. |
| Administration | Super-administration reliée au dépôt utilisateurs | APIs héritées, session locale super-administrateur | L’interface existe mais ne prouve pas un fonctionnement avec les comptes CNAC réels. [API utilisateurs](../../app/api/users/route.ts), lignes 7–8. |
| Tentatives | Journal durable, dix échecs, trente minutes | Mémoire locale, huit échecs, quinze minutes | Protection moins durable sur hébergement à instances multiples. [Accès local](../../lib/auth/local-access.ts), lignes 34–47. |
| Audit de connexion | Tentatives, audit et dernière connexion | Retour local avant ces traitements | Les connexions locales ne produisent pas ces écritures. [Login](../../app/api/auth/login/route.ts), lignes 32–43. |
| Lectures utilisateurs | Quatre feuilles techniques | Démo renvoie des en-têtes/lignes vides | Renseigner le classeur ne suffit pas tant que la démo est active. [Sheets](../../lib/google/sheets.ts), lignes 120, 187 et 250. |
| Écritures métier | Session réelle et autorisations | Démo active, exceptions locales de développement | Une connexion locale réussie ne débloque pas les écritures Athlètes en production. [Garde acteur](../../lib/cnac/actor-handler.ts), lignes 14–17 ; [exception locale](../../lib/demo-mode.ts), lignes 6–18. |
| Configuration | Secret session, HMAC télémétrie, accès Google, classeur utilisateurs | Plusieurs valeurs présentes localement, télémétrie non exploitable | Configurer et vérifier les valeurs propres au CNAC, puis tester hors démo. |
| Cookies | Nom historique `coc_session` | Même nom | Dette d’identité, à renommer si isolation par application sur un même domaine nécessaire ; pas de collision automatique entre domaines distincts. [Cookie](../../lib/auth/session-cookie.ts), ligne 3. |
| Blocs métier | `AUT-ADM`, `AUT-SPT`, `AUT-COM` | Même matrice copiée | Suffisant pour une première mise en service ; l’accès aux futurs modules antidopage demandera ensuite une décision métier et des règles de routes explicites. [Politique](../../lib/auth/route-policy.ts), lignes 15–43. |

La comparaison textuelle constate que tous les fichiers `lib/users`, les API utilisateurs, les API d’authentification sauf login, les scripts bootstrap/réinitialisation/purge et 17 fichiers communs de `lib/auth` sont identiques entre les dépôts. L’écart porte surtout sur les points d’entrée, le module `local-access`, les indicateurs de configuration et le service Sheets CNAC. Il ne manque pas une implémentation entière des utilisateurs.

Le mode démonstration neutralise les lectures du service générique, mais n’est pas une garantie globale de neutralisation de toutes les écritures Google : les primitives d’écriture n’ont pas toutes une garde démo et le CLI d’amorçage utilise son propre adaptateur. Les refus métier Athlètes et les exceptions locales sont des protections séparées. Sources : [service Sheets](../../lib/google/sheets.ts), lignes 69–71 et 273 ; [garde acteur](../../lib/cnac/actor-handler.ts), lignes 14–17.

## Écarts hérités entre documentation COC et code courant

Ces points sont également présents dans COC et ne doivent pas être attribués au seul CNAC.

1. **Lectures de sécurité réellement mises en cache.** L’ADR exige une lecture sans cache pour rendre la révocation déterministe. Le dépôt appelle son adaptateur avec `{ fresh: true }`, mais l’adaptateur Google ne transmet pas cette option et demande un cache de 60 secondes. Le lecteur générique peut également retourner des données anciennes en cas d’échec. La révocation et le refus sur indisponibilité peuvent donc être retardés ou contournés par un état mis en cache. Le snapshot de login, lui, utilise une lecture directe `batchGet`. Correction prioritaire : honorer `fresh` avec `bypassCache`, sans repli sur état ancien pour les décisions de sécurité. Sources : [ADR COC](../../../coc-cible/docs/adr/0002-autorisations-explicites-et-revocation-par-version.md), ligne 7 ; [dépôt CNAC](../../lib/users/repository.ts), lignes 43–44 ; [adaptateur](../../lib/users/google-adapter.ts), lignes 10–14 ; [Sheets](../../lib/google/sheets.ts), lignes 128 et 148–149 ; [snapshot](../../lib/users/data.ts), ligne 54.

2. **Succès de connexion avant confirmation d’audit.** L’audit, la tentative réussie et la mise à jour de dernière connexion s’exécutent après réponse, via `after` et `Promise.allSettled`. Une panne de ces écritures n’annule pas la connexion déjà annoncée. La réception historique ne suffit pas à garantir un audit durable de chaque connexion dans cette version. Source : [login COC](../../../coc-cible/app/api/auth/login/route.ts), bloc `after`, et [login CNAC](../../app/api/auth/login/route.ts), lignes 74–82.

3. **Amorçage et fichiers d’environnement.** La procédure COC indique ne charger aucun fichier `.env`, tandis que le CLI courant appelle `nextEnv.loadEnvConfig(process.cwd())`. Son adaptateur parle directement à Google et ne passe pas par les neutralisations du mode démo. Exécuter le CLI depuis CNAC impose donc de vérifier au préalable sa destination propre au CNAC. Le statut « procédure non exécutée » du document est historique ; il ne permet pas de connaître le contenu actuel d’une feuille distante. Sources : [procédure COC](../../../coc-cible/docs/migrations/lot-2-amorcage-premier-super-admin.md), section Préparation ; [CLI CNAC](../../scripts/bootstrap-first-super-admin.ts), lignes 11 et 49–85.

4. **Limites de la couverture.** La réception COC utilise des adaptateurs simulés et affirme explicitement ne pas avoir créé de comptes réels. Elle réserve une recette authentifiée après amorçage. Elle ne certifie pas la connexion à un classeur CNAC réel ni le déploiement Vercel. Source : [réception COC](../../../coc-cible/docs/tests/lot-2-rapport-reception.md), lignes 10, 34 et 44–51.

## Stockage CNAC à préparer ou vérifier

Créer ou vérifier un classeur utilisateurs **distinct de COC** avec les feuilles suivantes. Copier uniquement une structure vide et les validations nécessaires ; ne pas copier les comptes, empreintes, historiques de connexions ou secrets COC.

| Feuille | Colonnes attendues |
| --- | --- |
| `USERS` — A:M | `id_user`, `nom_complet`, `email`, `password_hash`, `type_user`, `est_super_admin`, `doit_changer_mot_de_passe`, `statut`, `date_creation`, `date_modification_mot_de_passe`, `derniere_connexion`, `session_version`, `date_expiration_acces_temporaire` |
| `USER_AUTORISATIONS` — A:F | `id_user_autorisation`, `id_user`, `id_bloc_autorisation`, `statut`, `date_debut`, `date_fin` |
| `AUTH_TENTATIVES` — A:F | `id_tentative`, `identifiant_hash`, `ip_hash`, `date_tentative`, `resultat`, `request_id` |
| `JOURNAL_OPERATIONS` — A:I | `id_operation`, `id_user`, `action`, `type_objet`, `id_objet`, `date_operation`, `resultat`, `request_id`, `details_non_sensibles` |

Source : [contrat CNAC hérité](../../lib/users/types.ts), lignes 8–68. Dans le référentiel CNAC, vérifier les trois lignes `BLOCS_AUTORISATION` : `AUT-ADM` administration, `AUT-SPT` gestion sportive et `AUT-COM` communication. Le serveur utilise également ces identifiants dans ses constantes. Le fuseau métier est `Africa/Kinshasa`, avec dates de début et fin inclusives. Source : [spécification COC](../../../coc-cible/docs/lot-2-utilisateurs-authentification-autorisations.md), sections 2.2–2.3.

## Plan d’adaptation priorisé

### P0 — Obtenir un accès CNAC réel et isolé

1. Confirmer la propriété CNAC du classeur actuellement configuré ; examiner seulement ses en-têtes et son état vide/non vide. Préparer les quatre feuilles si elles manquent, sans importer les comptes COC.
2. Configurer dans l’hébergement `GOOGLE_SHEETS_USERS_SPREADSHEET_ID`, `AUTH_SECRET` et une clé `AUTH_TELEMETRY_HMAC_KEY` distincte d’au moins 32 caractères, ainsi que l’accès Google autorisé au classeur CNAC. Ne pas publier les valeurs dans Git.
3. Corriger les lectures de sécurité fraîches de l’adaptateur avant de présenter la révocation comme immédiate.
4. Désactiver **les deux** indicateurs de démonstration et l’authentification locale. Retirer le raccourci du login et du proxy lors de l’implémentation finale pour éviter une réactivation involontaire. Aligner la page connexion afin de ne plus dépendre d’un indicateur public pour son mode réel.
5. Exécuter le contrôle à blanc du bootstrap uniquement si `USERS` est vide ; puis amorcer le premier super-administrateur CNAC avec la confirmation prévue. Si la feuille contient déjà des utilisateurs, analyser leur état et utiliser les parcours de gestion/réinitialisation appropriés plutôt que forcer ce bootstrap.
6. Se connecter avec l’accès temporaire, terminer l’activation et vérifier le dashboard et une création/modification/relecture d’athlète. Une session réelle avec démo désactivée doit conserver les champs d’identité et d’affiliation existants.

### P1 — Valider le cycle de vie et les droits

Créer un compte `VIEWER` et un `ADMIN` CNAC de recette, attribuer explicitement les blocs, puis vérifier lecture, refus d’écriture, activation, mot de passe, réinitialisation, changement de statut, fermeture d’autorisation et révocation. Tester les API directement, pas seulement les boutons. Tester une panne Sheets après avoir rempli les caches : aucun droit ancien ne doit permettre l’accès. Vérifier la protection du dernier super-administrateur et la compensation d’une écriture partielle.

### P2 — Exploitation et modèle antidopage

Planifier la purge des tentatives à 90 jours et la conservation minimale d’audit de 24 mois selon la politique institutionnelle ; surveiller les échecs d’écriture différée. Décider ensuite des blocs pour les futurs Contrôles, AUT et Localisation avant de rendre leurs routes actives. Une MFA ou un fournisseur externe n’est pas nécessaire pour reproduire le lot COC : ce serait une décision ultérieure distincte.

## Vérification et limites de l’étude

Cette étude recoupe les documents COC avec les sources des deux dépôts et un relevé de configuration locale sans valeurs sensibles. Elle ne lance ni bootstrap, ni purge, ni connexion à un compte réel ; elle ne consulte pas les lignes de Sheets et ne change pas Vercel. Les chiffres de réception COC cités plus haut restent des preuves historiques.

Vérifications actuelles réalisées séparément pendant cette étude :

| Contrôle | Résultat | Limite |
| --- | --- | --- |
| CNAC, sélection de tests unitaires auth/utilisateurs | 70 tests, 68 réussis, 2 échecs | Assertions statiques de navigation et verrouillage détaillées ci-dessous. |
| COC, même sélection de fichiers | 67 tests, 66 réussis, 1 échec | Même assertion de navigation héritée. |
| CNAC, suite complète d’intégration | 34 tests réussis sur 34 | Adaptateurs simulés ; pas de recette authentifiée réelle. |

Sélection reproductible depuis chaque dépôt avec PowerShell :

```powershell
$authTestFiles = rg --files tests/unit | Where-Object { $_ -match '(authorization|session-|login-|password|users-|bootstrap-|post-login|auth-source|cnac-local-auth)' }
node --test $authTestFiles
npm.cmd run test:integration
```

[Le test de navigation](../../tests/unit/login-navigation.test.ts) exige littéralement `window.location.assign(normalizeLoginRedirect(...))`, tandis que le client utilise `replace` ; cet échec existe dans COC et CNAC. [Le test de verrouillage](../../tests/unit/login-submission-lock.test.ts) interdit tout `window.location.assign` dans le fichier et atteint le bouton de démonstration, alors que la connexion normale utilise `replace`. Ces échecs ne prouvent pas une panne de connexion ; ils signalent des assertions statiques à réconcilier avec le comportement attendu. Ne pas annoncer une suite unitaire entièrement verte. Aucun build ni lint supplémentaire n’est nécessaire pour la seule création de ce rapport, qui ne modifie pas l’application.

Le résultat est un rapport d’écarts et un plan concret. Aucune adaptation applicative ni copie de classeur n’a été exécutée dans le cadre de cette demande d’étude.
