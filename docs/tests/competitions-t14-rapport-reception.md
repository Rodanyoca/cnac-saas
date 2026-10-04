# T14 — Rapport de réception du bloc Compétitions

## Conclusion

Le bloc Compétitions est prêt pour la validation humaine T14. Le modèle V1 et le parcours fonctionnel complet sont couverts par les tests unitaires et d'intégration. Les accès directs protégés et le comportement responsive public ont été vérifiés en navigateur.

La campagne n'a modifié aucune feuille Google Sheets, n'a créé aucune dépendance et n'a effectué ni déploiement, ni commit, ni push.

## Résultats

| Contrôle | Résultat |
| --- | --- |
| `npm.cmd run test:unit` | 167/167 réussis |
| `npm.cmd run test:integration` | 12/12 réussis |
| `npm.cmd run test:e2e` | 25/25 réussis |
| `npm.cmd exec tsc -- --noEmit` | Réussi |
| `$env:NEXT_DIST_DIR='.next-t14'; npm.cmd run build` | Réussi |
| Lint | 0 erreur après correction T14; avertissements historiques documentés |

## Anomalie corrigée pendant la réception

Le test à 390 px a révélé que la connexion imposait une largeur minimale de 1024 px et que la métadonnée viewport manquait. La racine définit maintenant un viewport adapté à l'appareil et la connexion bascule vers une composition mobile sans héros ni bandeau partenaires sous 1024 px. Le test passe désormais à 390, 1366 et 1920 px.

La recette utilise aussi un répertoire de build et un port E2E isolés. Cela évite qu'un serveur de développement local actif ne remplace les manifestes CSS/JavaScript du build testé.

## Écarts résiduels

- Aucun parcours E2E authentifié contre des données Google Sheets réelles n'a été lancé : il nécessiterait un compte/jeu de données isolé et pourrait provoquer des écritures externes, interdites pendant T14.
- La présence et le contenu métier des référentiels réels, notamment les référentiels encore vides, restent à confirmer lors de la recette humaine connectée.
- Aucun test de charge n'est inclus dans T14.
- Le lint conserve des avertissements de qualité préexistants (hooks et paramètres inutilisés), sans erreur bloquante ni échec de compilation.

## Décision attendue

La validation humaine peut porter sur un parcours connecté en lecture seule, puis sur un ajout/modification dans un environnement de recette autorisé. Aucun déploiement ne doit être lancé sans instruction explicite.
