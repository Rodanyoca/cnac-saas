---
status: accepted
---

# Authentification locale avec empreintes dans Google Sheets

Le LOT 2 remplace le fournisseur d'identité externe envisagé dans le cahier des charges par une authentification locale dont Google Sheets reste la couche de données. Seules des empreintes `scrypt` versionnées sont conservées : les mots de passe et accès temporaires en clair ne font jamais partie des données persistées. Ce choix évite d'introduire une nouvelle infrastructure, au prix d'une responsabilité applicative explicite pour le hachage, la limitation des tentatives, la migration et la révocation.

## Conséquences

Le schéma cible remplace `auth_user_id`, `role` et `USER_PERIMETRES` par `password_hash`, `type_user`, `est_super_admin` et des autorisations explicites par blocs. L'intégration des documents institutionnels demeure séparée de l'authentification.
