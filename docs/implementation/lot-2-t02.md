# LOT 2 — Rapport d'implémentation T02

Date : 2026-08-31  
Statut : terminé  
Portée suivante non démarrée : T03

## Résultat

T02 fournit une couche serveur typée pour `USERS`, `USER_AUTORISATIONS`, `AUTH_TENTATIVES` et `JOURNAL_OPERATIONS` :

- constantes d'en-têtes et valeurs contrôlées ;
- modèles TypeScript dédiés ;
- validation stricte des en-têtes, lignes, booléens, dates, instants, statuts, types et blocs ;
- normalisation et unicité des e-mails ;
- détection des identifiants dupliqués et périodes actives chevauchantes ;
- erreurs différenciées pour source indisponible, schéma invalide, ligne invalide, absence, conflit et écriture non confirmée ;
- lectures de sécurité sans lecture ni alimentation du cache ;
- recherches typées par identifiant et e-mail ;
- ajouts idempotents des feuilles techniques par `request_id`, suivis d'une relecture de confirmation ;
- adaptateur Google réel séparé du dépôt testable avec stockage simulé.

## Séparation de portée

La fonction historique `getUsers()` reste disponible pour la route de connexion du LOT 1 et effectue toujours une lecture fraîche. La nouvelle API stricte est exposée par `getTypedUsers()`, les fonctions ciblées de `lib/users/data.ts` et `UsersRepository`. Le basculement de la connexion, le hachage et la migration appartiennent à T03 et ne sont pas commencés.

Aucun test n'utilise l'adaptateur Google réel. Aucun compte, aucune autorisation, aucune tentative et aucune ligne d'audit n'ont été écrits dans Google Sheets.

## Vérifications

- `npm.cmd run test:unit` : 10 tests réussis.
- `npx.cmd --no-install eslint lib/users lib/google/sheets.ts tests/unit --no-cache` : réussi.
- `npx.cmd --no-install tsc --noEmit` : réussi après régénération des types Next par le build.
- `npm.cmd run build` : compilation, vérification TypeScript et génération des 26 pages statiques réussies.

Le runner natif Node signale uniquement que le paquet n'est pas déclaré `type: module` et reparcourt les tests TypeScript comme modules ES. Cet avertissement n'affecte pas les résultats et le type du paquet n'a pas été modifié afin d'éviter un changement global hors T02.
