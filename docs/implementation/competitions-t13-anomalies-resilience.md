# T13 — Anomalies, complétude et résilience

## Résultat

Les fiches Compétitions et Équipes nationales disposent maintenant d'un diagnostic de qualité non mutant. Une anomalie secondaire est affichée avec son périmètre et une action recommandée sans corriger silencieusement la donnée ni empêcher la consultation des autres sections.

## États qualifiés

- `ABSENT` : référentiel ou ensemble attendu vide ;
- `INCONNU` : identifiant présent mais non résolu ;
- `NON_APPLICABLE` : champ sans sens dans le contexte ;
- `NON_RENSEIGNE` : champ applicable mais cellule vide ;
- `SOURCE_INDISPONIBLE` : lecture secondaire impossible ou délai dépassé ;
- `ORPHELIN` : identifiant parent absent du graphe chargé ;
- `SCHEMA_INVALIDE` : en-têtes indispensables absents.

Ces états ne sont jamais remplacés par une valeur supposée.

## Indicateurs

Chaque fiche affiche :

- la complétude de ses champs essentiels ;
- la complétude de provenance des engagements et résultats ;
- le nombre d'anomalies qui rendent dangereuse l'écriture de l'objet concerné ;
- le détail des anomalies et l'action explicite attendue.

Une absence de lignes produit une provenance à 100 % car aucune provenance attendue n'est manquante. Elle ne prouve pas qu'une participation ou un résultat existe.

## Relations contrôlées

- engagement → programme et campagne ;
- participation → engagement ;
- résultat → engagement et programme ;
- segment → résultat ;
- performance → résultat et participant effectif ;
- sélection → campagne.

Une relation orpheline reste visible dans le diagnostic. La lecture n'échoue pas et l'écriture de la relation concernée reste bloquée par les validations métier existantes.

## Résilience

Les chargements secondaires utilisent `Promise.allSettled`. Une source indisponible ou un timeout devient une anomalie de section ; la fiche principale et les autres onglets restent disponibles. Les mutations réussies conservent leurs invalidations `revalidatePath`/`revalidateTag` afin d'éviter un diagnostic fondé sur un cache périmé.

## Vérifications

`tests/unit/competitions-t13.test.ts` couvre les états qualifiés, le schéma invalide, le timeout, la source indisponible, les relations orphelines, la complétude, la provenance, la présence du diagnostic dans les deux fiches et l'invalidation des caches.

Aucune feuille Google Sheets n'a été modifiée pendant T13.
