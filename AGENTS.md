# Instructions du projet CNAC

## Référence visuelle exclusive

- Le projet de référence est `C:\Projets\SNDS-HARMONISATION\coc-cible`.
- Toute évolution d’interface doit préserver fidèlement sa structure, ses espacements, sa typographie, ses composants, ses états, son responsive et ses interactions.
- Le dépôt COC est en lecture seule : ne jamais le modifier depuis ce projet.

## Identité et périmètre

- La marque visible est **CNAC — Comité National Antidopage Congolais**.
- Utiliser `public/images/logo-cnac-temp.png` tant qu’aucun logo officiel n’est fourni. Ne jamais présenter cet emblème temporaire comme officiel.
- Ne pas renommer automatiquement les champs métier hérités (`id_*_coc`, statuts d’affiliation COC, etc.). Ils appartiennent au modèle COC copié et seront adaptés lors des lots métier.
- Consigner l’état des écrans dans `docs/CNAC_ROUTE_MAPPING.md`.

## Données et connexions

- `CNAC_DEMO_MODE=true` isole l’application : aucune lecture Google Sheets COC et aucun compte COC ne doivent être utilisés.
- Les données temporaires et adaptateurs de démonstration restent séparés du code métier de production.
- Les identifiants de classeurs, dossiers Drive et secrets doivent être propres au CNAC et uniquement placés dans `.env.local`, jamais versionnés.

## Qualité

- Avant livraison : exécuter `npm run lint`, les tests pertinents et `npm run build`.
- Vérifier les vues principales en desktop et mobile contre COC.
- Ne pas pousser ni déployer sans demande explicite.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
