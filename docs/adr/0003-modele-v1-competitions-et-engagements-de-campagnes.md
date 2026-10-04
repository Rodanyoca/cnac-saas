---
status: accepted
---

# Modèle V1 des compétitions et engagements de campagnes

En V1, chaque ligne `COMPETITIONS` représente une édition concrète : aucune table `EDITIONS_COMPETITION` n’est créée. Une compétition multisport n’existe qu’une fois et ses contextes sportifs sont portés par `PROGRAMMES_COMPETITION`. Une équipe nationale permanente ne s’engage jamais directement : seule une campagne s’engage dans un programme, avec son propre statut, ses dates et sa provenance. Sélection et participation effective restent deux faits distincts; les résultats appartiennent au programme et à l’engagement, sont versionnés pour éviter les corrections silencieuses et ne sont pas recopiés dans le bloc Équipes nationales. Aucun classement n’est calculé sans règle officielle.

Cette cible privilégie une V1 exploitable avec les feuilles existantes tout en respectant les frontières temporelles du SNDS. Elle diffère la modélisation de la compétition récurrente et d’un moteur de classement; une évolution future devra migrer explicitement les identifiants et relations au lieu de réinterpréter silencieusement les lignes V1.
