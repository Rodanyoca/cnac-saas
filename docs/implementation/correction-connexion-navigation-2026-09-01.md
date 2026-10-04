# Correction de la connexion et de la navigation

Date : 1er septembre 2026  
Statut : corrigé et validé

## Symptômes observés

- `POST /api/auth/login` répondait `200`, puis l’application rechargeait immédiatement `/login`.
- Un super-administrateur authentifié pouvait être envoyé vers `/dashboard/utilisateurs` au lieu du tableau de bord.
- Les sections métier n’apparaissaient pas toutes dans la navigation du super-administrateur.
- La connexion effectuait plusieurs opérations Google Sheets indépendantes de façon séquentielle, avec un délai observé de 18 à 21 secondes.

## Causes

1. La page de connexion lançait `router.push(...)`, puis appelait immédiatement `router.refresh()`. Le rafraîchissement pouvait recharger `/login` avant la fin de la navigation.
2. Le client ne respectait que `/activation` et remplaçait les autres destinations renvoyées par l’API par `/dashboard`.
3. La destination après connexion ne tenait pas compte du périmètre réellement accessible par le compte.
4. L’ancienne règle exigeait des attributions métier explicites même pour un super-administrateur, ce qui masquait les sections non attribuées et refusait leurs routes.
5. Les écritures de tentative, d’audit et de dernière connexion étaient attendues successivement alors qu’elles sont indépendantes.

## Comportement retenu

- Une activation obligatoire redirige vers `/activation`.
- Un super-administrateur redirige vers `/dashboard`.
- Un utilisateur disposant d’au moins un bloc métier actif redirige vers `/dashboard`.
- Un utilisateur ordinaire sans bloc métier redirige vers `/mon-compte`.
- Seules les destinations locales autorisées sont acceptées côté client.
- Le super-administrateur dispose d’un accès complet en lecture et écriture à `AUT-ADM`, `AUT-SPT` et `AUT-COM`.
- Sa navigation affiche le tableau de bord, les fédérations, les acteurs, les compétitions, les équipes nationales, les activités, les documents et les utilisateurs.
- Le proxy applique les mêmes droits que la navigation ; un lien visible n’aboutit donc pas à un refus d’autorisation.
- Les opérations Google Sheets indépendantes de la connexion sont exécutées en parallèle.

## Fichiers principaux concernés

- `app/login/page.tsx` : respect de la destination et suppression du rafraîchissement concurrent.
- `app/api/auth/login/route.ts` : calcul de la destination et parallélisation des opérations indépendantes.
- `lib/auth/login-redirect.ts` : liste fermée des destinations de connexion autorisées.
- `lib/auth/post-login-route.ts` : sélection de la destination selon l’état et les droits du compte.
- `lib/auth/authorization.ts` : accès métier complet du super-administrateur.
- `lib/auth.ts` et `app/api/auth/session/route.ts` : exposition des droits complets à la navigation.
- `components/dashboard/sidebar.tsx` : affichage des sections à partir des droits calculés.

## Validation

- `npm run test:unit` : 64 tests réussis, aucun échec.
- `npx tsc --noEmit` : réussi.
- `npm run lint` : aucune erreur ; un avertissement préexistant subsiste dans `app/dashboard/activites/activites-client.tsx`.
- Parcours Playwright de connexion : 13 tests réussis, notamment la conservation de la destination renvoyée après authentification.

## Non-régression attendue

- Un `VIEWER` ordinaire reste limité à la lecture de ses blocs actifs.
- Un `ADMIN` ordinaire reste limité aux blocs qui lui sont attribués.
- Les comptes inactifs, bloqués, expirés ou sans session valide restent refusés.
- Le dernier super-administrateur actif reste protégé contre la neutralisation.

## Section Site web

La navigation principale comprend une section repliable « Site web », visible par le super-administrateur et par les comptes disposant de `AUT-COM` en lecture. Son libellé ouvre le sous-menu sans être un lien. Elle regroupe, dans l’ordre : Sliders, Communiqués, Actualités, Galeries, Historique, Gouvernance, Jeux, Athlètes, Entités, Événements et Documents site web. Toutes ces entrées utilisent exclusivement le préfixe `/dashboard/site-web` afin de rester distinctes des écrans administratifs existants.

La page Sliders lit et écrit l’onglet `SLIDERS_SITE` du classeur `10_SITE_WEB_CONTENUS` via `GET/POST /api/site-web/sliders` et `PUT /api/site-web/sliders/[id]`. La matrice applique `AUT-COM` en lecture ou écriture selon la méthode. Les statuts proviennent de `STATUTS_PUBLICATION` dans `00_REFERENTIELS`; les images sont stockées exclusivement dans le dossier Drive `SLIDERS`, configuré par `GOOGLE_DRIVE_SITE_WEB_SLIDERS_FOLDER_ID`.

## Addendum — accueil, navigation immédiate et fraîcheur des données

Une seconde inspection du parcours authentifié a identifié trois défauts complémentaires :

- la barre latérale attendait un appel client à `/api/auth/session` avant d’afficher ses liens ;
- la section principale « Acteurs » était seulement un bouton d’ouverture du sous-menu et ne permettait pas d’ouvrir `/dashboard/acteurs` ;
- les statistiques d’accueil cumulaient le cache mémoire Sheets et six caches d’agrégats sans durée explicite.

Le layout authentifié calcule désormais les droits côté serveur et transmet immédiatement la navigation à la barre latérale. Le calcul utilise une seule lecture des autorisations pour un compte ordinaire et aucune lecture d’autorisation supplémentaire pour un super-administrateur. Chaque section principale possède un lien ; « Acteurs » utilise un lien distinct du bouton qui ouvre ou ferme ses sous-sections.

Le tableau de bord vide le cache Sheets avant chaque chargement d’accueil et ses six agrégats ne sont plus conservés dans `unstable_cache`. Les lectures restent parallèles et tolèrent l’indisponibilité isolée d’une section. Le bouton « Actualiser » vide toujours le cache et rafraîchit `/dashboard`.

Après cet addendum, 67 tests unitaires, TypeScript, ESLint sans erreur bloquante et le build Next.js de production réussissent. Les tests ajoutés vérifient l’affichage immédiat des huit sections du super-administrateur, la destination cliquable de chaque section principale et l’effacement du cache avant les lectures d’accueil.

L’inspection des journaux a ensuite révélé que les pages Athlètes et les agrégats associés demandaient l’onglet inexistant `ATHLETE`. Le classeur ACTEURS expose réellement `ATHLETES`, `COACHS`, `OFFICIELS`, `MEDECINS`, `ARBITRES` et `AUTRES`. Les noms techniques sont désormais centralisés dans `lib/acteurs/sheets.ts` et réutilisés par les pages, les API, les activités, les statistiques d’accueil et le téléversement de médias. Cette correction évite l’erreur Google Sheets `Unable to parse range: 'ATHLETE'!A:Z`.
# Mise Ã  jour â€” harmonisation Google Sheets

La cartographie exhaustive des neuf classeurs, de leurs onglets et de leurs en-tÃªtes est maintenue dans [google-sheets-workbooks.md](../mappings/google-sheets-workbooks.md). Le snapshot machine est dans `docs/mappings/google-sheets-schema-snapshot.json` et se rÃ©gÃ©nÃ¨re avec `node --env-file=.env.local scripts/audit-google-sheets-mappings.mjs`.

Les mappings ont Ã©tÃ© alignÃ©s pour les activitÃ©s, documents, compÃ©titions, affiliations d'officiels, Ã©quipes nationales, fÃ©dÃ©rations et structures territoriales. Les noms fonctionnels de l'interface sont conservÃ©s par des adaptateurs vers les noms physiques des feuilles, notamment `observation`, `id_statut_*`, `id_niveau_competition`, `nom_officiel` et les campagnes d'Ã©quipes nationales.
