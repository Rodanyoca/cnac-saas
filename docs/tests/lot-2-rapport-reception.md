# LOT 2 — Rapport de réception technique

Date : 1er septembre 2026  
Décision proposée : **réception technique favorable, sans anomalie bloquante**.

## Résumé

La campagne T09 valide l'authentification locale `scrypt`, l'activation, les changements et réinitialisations d'accès, les sessions signées, la révocation, la matrice des trois blocs, la super-administration, l'audit, la limitation des tentatives et la non-régression ciblée de la connexion LOT 1.

Aucun compte réel n'a été créé, aucune donnée réelle n'a été écrite dans Google Sheets, aucun fichier d'environnement n'a été modifié et aucun déploiement n'a été effectué.

## Résultats reproductibles

| Contrôle | Commande | Résultat |
|---|---|---|
| ESLint | `npm run lint` | 0 erreur, 1 avertissement préexistant hors LOT 2 |
| TypeScript | `npx tsc --noEmit` | Réussi |
| Tests unitaires | `npm run test:unit` | 57 réussis, 0 échec |
| Tests d'intégration | `npm run test:integration` | 7 réussis, 0 échec |
| Build Next.js | `npm run build` | Réussi, 32 pages générées |
| Playwright | `npm run test:e2e` | 15 réussis, 0 échec |
| Recherche de secrets | recherche de signatures de clés privées, clés Google/OpenAI/GitHub/AWS et affectations de secrets | Aucun résultat |

## Incidents et anomalies

### Bloquants

Aucun.

### Non bloquants

1. `app/dashboard/activites/activites-client.tsx` produit un avertissement ESLint `react-hooks/set-state-in-effect`. Il préexistait à T09, se situe hors LOT 2 et ne provoque ni erreur de build ni échec de test.
2. Node affiche `MODULE_TYPELESS_PACKAGE_JSON` pendant les tests TypeScript natifs. Cet avertissement de performance ne change pas leur résultat.
3. Les parcours administratifs authentifiés ne sont pas pilotés contre des comptes ou feuilles réels, conformément à l'interdiction de créer un compte réel. Leur sécurité et leurs mutations sont couvertes respectivement par les tests unitaires de politique et les adaptateurs Sheets simulés d'intégration.

## Sécurité et confidentialité

- Le scan n'a trouvé aucune signature de clé privée ni clé de fournisseur connue.
- Les valeurs de mot de passe présentes dans les tests sont exclusivement synthétiques et ne sont jamais inscrites dans les rapports ou journaux applicatifs.
- Les audits simulés sont contrôlés pour exclure mots de passe, accès temporaires et cookies.
- La clé `AUTH_TELEMETRY_HMAC_KEY` reste une condition de déploiement ; aucune valeur n'est versionnée.
- Les pannes Sheets entraînent un refus fermé. Une écriture partielle administrative est compensée et n'est pas annoncée comme un succès.

## Réserves avant mise en production

Ces éléments ne relèvent pas de T09 et n'empêchent pas la réception technique du code :

1. configurer la clé HMAC de télémétrie dans la plateforme de déploiement ;
2. exécuter l'amorçage humain séparé du premier super-administrateur ;
3. réaliser une recette métier authentifiée après amorçage, sans réutiliser de secret de test ;
4. planifier l'exécution périodique de la purge des tentatives.

## Conclusion

Les preuves automatisées et statiques couvrent les critères LOT 2. Le lot peut être présenté à la validation métier puis préparé au déploiement contrôlé, après satisfaction des prérequis ci-dessus.

## Addendum du 1er septembre 2026 — connexion et navigation

Une anomalie de redirection a été corrigée après la réception initiale. Le client lançait une navigation après le succès de connexion puis rafraîchissait immédiatement la page courante, ce qui pouvait provoquer la séquence `POST /api/auth/login 200` suivie d’un retour à `GET /login`. Le rafraîchissement concurrent a été supprimé et les destinations locales renvoyées par l’API sont désormais respectées et validées.

La règle métier du super-administrateur a également été précisée : il arrive sur `/dashboard`, dispose d’un accès complet aux trois blocs métier et voit toutes les sections de navigation, en plus de la gestion des utilisateurs. Le contrôle serveur et la navigation utilisent la même décision d’autorisation.

Après correction, 64 tests unitaires, la vérification TypeScript et 13 tests Playwright ciblant la connexion réussissent. Le détail technique figure dans [`../implementation/correction-connexion-navigation-2026-09-01.md`](../implementation/correction-connexion-navigation-2026-09-01.md).
