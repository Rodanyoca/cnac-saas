---
status: accepted
---

# Autorisations explicites et révocation par version de session

Tout accès métier exige une attribution de bloc active et valide dans le temps, sauf pour le super-administrateur qui dispose d’un accès complet aux trois blocs métier. Les sessions signées portent `session_version` et sont confrontées sans cache à l’état courant du compte et de ses autorisations afin que les changements sensibles révoquent les anciens accès. Ce choix privilégie une révocation déterministe et un refus sécurisé malgré le coût de lectures supplémentaires dans Google Sheets.
