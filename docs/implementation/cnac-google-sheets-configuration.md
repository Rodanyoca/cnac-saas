# Configuration CNAC : Structure territoriale et Acteurs

## Périmètre livré

Les listes, fiches, sélecteurs et actions existantes des six types d'acteurs et de la structure territoriale utilisent un service CNAC dédié. Les contacts d'entités utilisent PERSONNES_CONTACT_ENTITES et les acteurs correspondant à leur type. Les rattachements directs ne passent pas par les affiliations.

Les tableaux de bord, statistiques, activités, documents, compétitions, équipes nationales, licences, affiliations, utilisateurs, connexion et chatbot restent hors périmètre. Le service historique ne lit pas les trois classeurs CNAC : cela évite de dynamiser indirectement ces blocs.

Les en-têtes des 28 feuilles ont été vérifiés via le connecteur Google en lecture seule le 2 octobre 2026. Voir [le schéma relevé](../mappings/cnac-schema-verified.json) et [l'audit](cnac-connexion-audit.md). Ce contrôle via le connecteur ne prouve pas les autorisations du compte de service de l'application. Les premières lignes consultées ne constituent pas un inventaire complet des données.

## Configurer sans perdre les paramètres locaux

`.env.local` existant a été conservé. Ne pas le remplacer avec `.env.example`. Créer une copie seulement s'il n'existe pas, puis reporter les variables manquantes et les identifiants de classeurs depuis l'exemple.

```powershell
if (-not (Test-Path -LiteralPath .env.local)) { Copy-Item -LiteralPath .env.example -Destination .env.local }
```

1. Dans le projet Google Cloud du CNAC, activer Google Sheets API et créer ou utiliser un compte de service CNAC.
2. Dans son JSON privé, copier **client_email** vers `GOOGLE_SERVICE_ACCOUNT_EMAIL` et **private_key** vers `GOOGLE_PRIVATE_KEY`. Garder la clé entre guillemets ; les séquences `\n` sont converties en retours à la ligne par le serveur. Ne pas utiliser project_id comme identifiant de classeur. Ne jamais publier ce JSON ou la clé.
3. Reporter les trois identifiants exacts de `.env.example` : REFERENTIEL, STRUCTURE_TERRITORIALE et ACTEURS. Les anciens marqueurs `CNAC-DEMO` ne sont pas des identifiants utilisables.
4. Partager chacun des trois classeurs avec **client_email**. Lecteur suffit pour consulter ; Éditeur est nécessaire sur les classeurs concernés par les écritures existantes. Ne pas partager de classeur COC pour ce lot.
5. Redémarrer le serveur Next après modification de l'environnement (`npm.cmd run dev`). Ouvrir `/dashboard/federations` et `/dashboard/acteurs` puis les six listes. Un problème de configuration, de partage, de quota ou de colonnes est affiché explicitement ; il ne devient pas une liste vide.

Le mode démonstration permet de consulter les données CNAC avec le compte de service configuré. Il **refuse toutes les écritures réelles** car son identité administrateur est fictive. Les droits existants AUT-SPT restent requis. La connexion et le classeur des utilisateurs ne sont pas configurés par ce lot. Garder `CNAC_DEMO_MODE=true` et `NEXT_PUBLIC_CNAC_DEMO_MODE=true` tant que les accès réels CNAC ne sont pas validés séparément ; les passer à false ne crée pas de compte ni de droits. Les identifiants et clés Sheets seuls permettent donc la lecture, pas l'activation d'un administrateur réel.

## Uploads Drive facultatifs

Sheets utilise le compte de service. Les uploads existants utilisent séparément `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `GOOGLE_DRIVE_REFRESH_TOKEN` et les dossiers CNAC `GOOGLE_DRIVE_ACTEURS_AVATARS_FOLDER_ID`, `GOOGLE_DRIVE_ACTEURS_PASSEPORTS_FOLDER_ID`, `GOOGLE_DRIVE_FEDERATION_LOGOS_FOLDER_ID`. Le compte OAuth doit avoir accès à ces dossiers. Sans cette configuration, les uploads des acteurs sont désactivés ; les données textuelles et liens existants sont préservés.

Aucun fichier lié depuis le socle copié n'est dupliqué automatiquement. Un ancien fichier ne peut être supprimé par le remplacement d'un upload que si ses parents Drive confirment son appartenance au dossier CNAC configuré ; sinon il est conservé. Aucun déplacement ni nettoyage Drive n'a été exécuté.

## Vercel

Reporter les mêmes variables **serveur** dans les environnements Vercel concernés, puis redéployer pour prendre en compte les nouvelles valeurs. Aucun déploiement n'a été effectué. Ne pas préfixer la clé privée par NEXT_PUBLIC. Seul le drapeau public de démonstration a vocation à être exposé au navigateur. Vérifier également les accès réels avant d'activer les écritures en production.

## Mappings et garanties

- Les colonnes physiques sont celles du relevé réel : identifiants internes *_cnac, identifiants fédéraux ou d'entités séparés, `observations`, `id_specialite_sante`, `id_entite` pour officiels et médecins. Les anciens noms *_coc restent uniquement des contrats internes de composants.
- Une ligne sans identifiant primaire est ignorée, même avec une case à cocher TRUE. Une feuille réellement vide reste distincte d'une feuille inaccessible ou de colonnes manquantes.
- Les parents territoriaux suivent HIERARCHIE par fédération, y compris CERCLES. Les ancêtres sont dérivés du parent direct. Un parent manquant, cyclique ou d'une autre fédération reste un diagnostic visible.
- Les codes sexe 01 et 02 restent des chaînes. Le code 03 MIXTE est exclu des sélecteurs de personnes. Les valeurs inconnues restent visibles, sans conversion arbitraire en masculin ou actif.
- Les dates civiles acceptent ISO, jj/mm/aaaa et numéros de série Sheets. Les écritures RAW emploient le numéro de série pour préserver le format de cellule existant, sans décalage de fuseau. Voir la [définition Google des dates Sheets](https://developers.google.com/workspace/sheets/api/reference/rest/v4/DateTimeRenderOption). Un format source non reconnu reste visible à la lecture et est refusé à l'écriture.
- Les modifications relisent la feuille et retrouvent la ligne par identifiant interne juste avant l'écriture ; elles touchent uniquement les cellules concernées. Les identifiants internes existants ne changent pas. Les nouvelles lignes reçoivent un UUID préfixé, sans renumérotation des anciennes lignes.
- Les lectures groupées sont mises en cache pendant cinq minutes par défaut. Une écriture ou un échec à réponse incertaine invalide le cache. Les lectures peuvent réessayer ; les mutations ne sont pas réessayées automatiquement, afin d'éviter les doubles ajouts.

Google Sheets n'offre pas ici de transaction multi-classeurs ni de verrou global : une insertion concurrente entre la dernière lecture et la mutation reste possible. La création existante d'une fédération et de son entité peut laisser une création partielle en cas d'échec de la seconde opération ; aucune suppression compensatoire d'entité n'est autorisée par ce service. Une vérification manuelle par identifiant est nécessaire avant de recommencer une mutation dont la réponse est incertaine.

## État local constaté

Au début de l'intervention, les secrets étaient absents. Le fichier `.env.local` a ensuite été renseigné extérieurement pendant le travail, sans édition par l'agent. Les pages du serveur local affichent désormais les listes CNAC réelles ; les vérifications navigateur restent en lecture seule et le mode démonstration refuse les mutations. Aucun secret demandé dans la conversation, aucune écriture Google, migration, push, merge ou déploiement exécuté.
