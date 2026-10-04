# LOT 2 — Matrice exigences → tests

Date de campagne : 1er septembre 2026  
Périmètre : utilisateurs, authentification, sessions, autorisations, administration, audit et limitation des tentatives.

Toutes les données utilisées sont synthétiques. Aucun adaptateur Google réel n'est invoqué par les tests unitaires ou d'intégration.

| Exigence | Preuve automatisée | Niveau | Résultat |
|---|---|---|---|
| `scrypt` salé, format versionné et vérification sûre | `tests/unit/password.test.ts` | Unitaire | Conforme |
| Politique 12–128 caractères et secrets courants refusés | `tests/unit/password.test.ts` | Unitaire | Conforme |
| Accès temporaire de 20 caractères, activation obligatoire et expiration à 24 h | `tests/unit/password.test.ts`, `tests/unit/bootstrap-first-super-admin.test.ts`, `tests/integration/account-workflows.test.ts` | Unitaire + intégration | Conforme |
| Aucun ancien mot de passe utilisable après changement ou réinitialisation | `tests/integration/account-workflows.test.ts` | Intégration | Conforme |
| Session signée de 8 h avec payload strict | `tests/unit/session-token.test.ts` | Unitaire | Conforme |
| Cookie sécurisé et session minimale d'activation | `tests/unit/session-cookie.test.ts` | Unitaire | Conforme |
| Relecture de `USERS` sans cache et révocation par `session_version` | `tests/unit/session-resolution.test.ts`, `tests/unit/users-repository.test.ts` | Unitaire | Conforme |
| Refus des comptes absents, `INACTIF`, `BLOQUE` ou temporaires expirés | `tests/unit/session-resolution.test.ts`, `tests/integration/account-workflows.test.ts` | Unitaire + intégration | Conforme |
| Refus fermé si Sheets est indisponible ou invalide | `tests/unit/session-resolution.test.ts`, `tests/unit/authorization.test.ts`, `tests/unit/users-repository.test.ts` | Unitaire | Conforme |
| Matrice `VIEWER`/`ADMIN` avec attributions et super-administrateur avec accès complet × trois blocs × lecture/écriture | `tests/unit/authorization-matrix.test.ts` | Unitaire exhaustif | Conforme |
| Attribution absente, inactive, future ou expirée refusée | `tests/unit/authorization-matrix.test.ts`, `tests/unit/authorization.test.ts` | Unitaire | Conforme |
| Bornes inclusives selon `Africa/Kinshasa` | `tests/unit/authorization.test.ts` | Unitaire | Conforme |
| Routes classées dans `AUT-ADM`, `AUT-SPT`, `AUT-COM` ou super-administration | `tests/unit/route-policy.test.ts` | Unitaire | Conforme |
| Aucune route inconnue ou écriture non déclarée autorisée | `tests/unit/route-policy.test.ts` | Unitaire | Conforme |
| Création idempotente, e-mail unique et affichage unique du secret | `tests/integration/user-administration.test.ts`, `tests/unit/users-repository.test.ts` | Intégration + unitaire | Conforme |
| Dernier super-administrateur actif protégé | `tests/unit/authorization.test.ts`, `tests/integration/user-administration.test.ts` | Unitaire + intégration | Conforme |
| Périodes superposées refusées | `tests/unit/users-repository.test.ts`, `tests/integration/user-administration.test.ts` | Unitaire + intégration | Conforme |
| Compensation d'une écriture multi-feuilles partielle | `tests/integration/user-administration.test.ts` | Intégration | Conforme |
| Audit idempotent, concurrent et expurgé | `tests/integration/audit.test.ts`, `tests/integration/user-administration.test.ts` | Intégration | Conforme |
| HMAC-SHA-256 sans conservation de l'e-mail ou de l'IP | `tests/unit/login-attempts.test.ts` | Unitaire | Conforme |
| Attente dès 5 échecs, blocage à 10 pendant 30 minutes, levée automatique | `tests/unit/login-attempts.test.ts` | Unitaire à horloge fixe | Conforme |
| Changement d'IP ne contourne pas la protection du compte | `tests/unit/login-attempts.test.ts` | Unitaire | Conforme |
| Purge à 90 jours et préservation minimale de l'audit | `tests/unit/login-attempts.test.ts` | Unitaire | Conforme |
| Connexion LOT 1 : clavier, états, erreurs, chargement et redirections | `tests/e2e/login.spec.ts` | Playwright | Conforme |
| Connexion LOT 1 : composition institutionnelle et absence de débordement à trois résolutions | `tests/e2e/login.spec.ts`, `tests/e2e/partners-strip.spec.tsx` | Playwright | Conforme |
| Administration inaccessible sans authentification | `tests/e2e/users-admin.spec.ts` | Playwright | Conforme |
| Administration réservée côté serveur au super-administrateur | `tests/unit/route-policy.test.ts`, `tests/unit/authorization-matrix.test.ts` | Unitaire serveur | Conforme |
| En-têtes et valeurs des quatre feuilles strictement validés | `tests/unit/users-validation.test.ts`, `tests/unit/users-repository.test.ts` | Unitaire | Conforme |
| Absence de secrets réels dans code, fixtures, journaux et rapports | scan `rg` documenté dans le rapport de réception | Statique | Conforme |

## Correspondance des blocs officiels

| Bloc | Routes couvertes |
|---|---|
| `AUT-ADM` | Activités, participants aux activités, documents |
| `AUT-SPT` | Structures, acteurs, affiliations, licences, équipes, sélections, compétitions, participants et résultats |
| `AUT-COM` | Articles, galeries, partenaires et contenus web |
| Super-administration | Utilisateurs, autorisations et référentiels |

La navigation n'est jamais utilisée comme preuve d'autorisation : les preuves de sécurité sont les politiques et décisions serveur.
