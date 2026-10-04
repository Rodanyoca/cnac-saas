# Audit ciblé performances, routes et erreurs

## Mesures T01

Mesure statique du code au 5 septembre 2026 : 47 routes API, 63 appels directs à `getSheetRows`, 27 lectures explicitement fraîches et 129 anciennes réponses d'erreur construites localement. Les durées de mutation sont désormais exposées par `Server-Timing` et corrélées avec `x-request-id`, sans contenu métier ni secret.

| Parcours | Lectures avant | Lectures après | Écritures | Cache | Risque/correction |
| --- | ---: | ---: | ---: | --- | --- |
| Dashboard | 4+ et purge globale | 4 au plus, dédupliquées | 0 | court | suppression de la purge automatique |
| Médailles du dashboard | graphe complet (plusieurs feuilles) | 1 feuille `MEDAILLES` | 0 | court | agrégat ciblé |
| Création compétition/programme/sélection/unité/résultat/médaille | contrôle métier + audit + écriture | identique, sans rechargement global client | 1 métier + 1 audit | invalidé après écriture | retour immédiat de la ligne normalisée |
| Page compétition | sections parallèles | sections parallèles | 0 | court | erreur isolée et reprise locale |

Les mesures réelles dépendantes de Google ne sont pas rejouées en écriture afin de ne pas créer de données de production. Le temps serveur de chaque prochaine mutation est mesurable dans l'en-tête `Server-Timing`.

## Règles retenues

- Les listes vides et relations facultatives sont des états normaux.
- Les erreurs 400, 401, 403, 404, 409, 429 et 5xx suivent un contrat commun avec `request_id`.
- Les messages Sheets bruts restent côté serveur ; 429 et indisponibilité sont réessayables.
- Les lectures simultanées identiques sont dédupliquées et les appels Sheets sont limités à six lectures concurrentes avec timeout.
- Les contrôles de session et d'autorisation conservent leur stratégie de fraîcheur dédiée.
