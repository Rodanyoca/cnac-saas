# LOT 2 — Rapport d'implémentation T03

Date : 2026-08-31  
Statut : terminé sans création de compte  
T04 : non démarré

## Livré

- `scrypt` natif Node avec `N=65536`, `r=8`, `p=1`, clé de 64 octets, sel aléatoire de 16 octets et plafond mémoire de 128 Mio.
- Format versionné strict et comparaison en temps constant.
- Politique de 12 à 128 caractères et liste locale de secrets manifestement courants.
- Accès temporaire aléatoire de 20 caractères sans symboles ambigus et expiration à 24 heures.
- Commande minimale `USERS` idempotente, avec validation stricte et relecture après écriture.
- Contrôle à blanc du premier super-administrateur, réservé à une feuille `USERS` vide.
- CLI sans écriture par défaut ; `--execute` exige un terminal et une confirmation humaine séparée.
- Procédure d'amorçage documentée, sans exécution réelle.

## Limites et reports

- La vérification « compromis » repose dans T03 sur une liste locale des secrets manifestement courants. Aucun service externe de mots de passe compromis n'est interrogé.
- La connexion n'utilise pas encore `scrypt` ; ce branchement n'a pas été anticipé.
- L'activation et la réinitialisation appartiennent à T06.
- Les commandes administratives restantes `USERS`, les commandes `USER_AUTORISATIONS` et la compensation multi-feuilles appartiennent à T07 ou aux tickets qui les consomment.
- L'avertissement Node sur la détection automatique des modules ES demeure non bloquant.

## Vérifications

- 18 tests unitaires réussis.
- TypeScript global réussi.
- ESLint ciblé réussi.
- Build Next de production réussi.
