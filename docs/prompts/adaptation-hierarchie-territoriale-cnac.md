# Prompt — Adaptation de la hiérarchie territoriale CNAC

Copier le prompt ci-dessous pour lancer le lot d’implémentation. Il porte uniquement sur `cnac-cible`.

---

## Prompt à exécuter

Tu es un ingénieur logiciel senior chargé d’adapter le bloc **Structure territoriale** du SaaS CNAC. Tu dois d’abord vérifier le modèle réel CNAC, puis implémenter une gestion configurable des types et niveaux territoriaux. Le besoin inclut le type **Zone**, que l’utilisateur indique avoir défini, mais dont la présence et le stockage doivent être vérifiés dans les ressources CNAC avant tout changement.

### Objectif métier

La hiérarchie ne doit plus être une succession d’entités codées en dur (`Ligue`, `Entente`, `Cercle`, `Club`, `Équipe`). Chaque fédération doit pouvoir configurer ses propres niveaux, leur ordre et leurs relations parent-enfant à partir des types territoriaux disponibles dans le référentiel CNAC.

Exemples de configurations à prendre en charge, sans les imposer à toutes les fédérations :

- Fédération → Zone → Ligue → Club ;
- Fédération → Ligue → Entente → Club ;
- Fédération → Ligue → Cercle → Club ;
- Fédération → Ligue → Club ;
- toute autre composition validée des types CNAC.

Une fédération ne doit pas être obligée de créer les niveaux d’une autre fédération. L’absence d’un niveau, par exemple Entente ou Zone, est une configuration valide.

### Sources de vérité et limites

1. Modifier uniquement `cnac-cible`. Ne modifier ni `coc-cible`, ni `febaco-reference`, ni aucun autre projet de référence.
2. N’utiliser que les classeurs et données CNAC. Ne jamais lire ni mapper un classeur COC.
3. Les en-têtes relevés dans `docs/mappings/cnac-schema-verified.json` le 2 octobre 2026 indiquent actuellement :
   - `TYPES_STRUCTURE` dans le classeur `REFERENTIEL` : `id_type_structure`, `nom_type_structure`, `description`, `observations` ;
   - `HIERARCHIE` dans `STRUCTURE_TERRITORIALE` : `id_hierarchie`, `id_federation`, `id_type_structure`, `niveau_hierarchique`, `observations` ;
   - des feuilles d’instances séparées pour `LIGUES`, `ENTENTES`, `CERCLES`, `CLUBS` et `EQUIPES`.
4. Le schéma CNAC vérifié ne répertorie pas de feuille `ZONES`. Le code actuel ne contient pas non plus de ressource `zones`. Ne suppose donc pas qu’une entrée `ZONE` dans `TYPES_STRUCTURE` suffit à stocker et administrer des zones : un type de référentiel, une ligne `HIERARCHIE` et une fiche réelle de structure sont trois choses différentes.
5. Avant toute édition, relire les documents CNAC et, si les accès locaux le permettent, vérifier les **noms et en-têtes uniquement** des feuilles CNAC réelles : existence et libellé exact du type Zone dans `TYPES_STRUCTURE`, feuille existante pouvant stocker ses instances, relations parentales et identifiants. Ne pas afficher, copier ou consigner de données personnelles ou de secrets.
6. Si la feuille ou les colonnes nécessaires aux instances de Zone n’existent pas, ne crée ni feuille ni colonne dans Google Sheets sans accord explicite. Présente le schéma minimal proposé, les impacts et le point bloquant; n’implémente pas une fausse écriture dans une feuille d’un autre type.
7. Ne prends pas `lib/federations/schema.ts`, ses `SHEET_COLUMNS` ou ses identifiants historiques COC comme contrat physique CNAC. Pour le bloc connecté, le contrat physique CNAC est `lib/cnac/schema.ts` et le service dédié `lib/cnac/sheets.ts`.
8. Ne change pas l’authentification dans ce lot. Conserve la règle actuelle : mutations territoriales locales `POST`/`PUT` uniquement en développement, mode démo et origine loopback; aucune ouverture d’écriture en production. Ne réactive pas les suppressions physiques.
9. Ne lis ni ne modifies `.env.local`; ne demande pas de secret à l’utilisateur et ne l’inclus dans aucun livrable.

### État du code à prendre en compte

- L’écran de paramétrage existe à `/dashboard/federations/[id]/parametres`, avec les onglets **Hiérarchie territoriale** et **Éléments de la structure**.
- Le formulaire de hiérarchie lit `TYPES_STRUCTURE` et écrit les niveaux de fédération dans `HIERARCHIE`.
- Les listes, champs, relations et ressources d’instances restent actuellement spécialisées par feuilles fixes (`LIGUES`, `ENTENTES`, `CERCLES`, `CLUBS`, `EQUIPES`).
- `lib/cnac/territorial-model.ts` déduit les parents en faisant correspondre des noms à un ensemble fixe de types. `resolveTerritorialRows` et les mappeurs exposent eux aussi des champs d’ancêtres spécifiques.
- `lib/cnac/territorial-handler.ts` route les mutations par ressource; `app/api/federations/[resource]/route.ts` expose ces actions. La page et le service ne deviennent pas génériques simplement parce que `HIERARCHIE` accepte un `id_type_structure`.
- Les noms internes hérités `*_coc` subsistent comme alias dans plusieurs composants. Ne les renomme pas en masse dans ce lot; ne les écris jamais à la place des en-têtes physiques CNAC.

### Fonctionnalités attendues

#### 1. Administration des types

- Fournir une section explicite **Types de structure territoriale** accessible depuis le parcours de paramétrage/référentiels CNAC, pour consulter les types réellement présents dans `TYPES_STRUCTURE` et ajouter un type tel que Zone si l’utilisateur confirme qu’il n’y existe pas déjà.
- Lire et écrire uniquement les colonnes réellement vérifiées de `TYPES_STRUCTURE`.
- Générer les identifiants côté serveur; un identifiant existant est immuable.
- Ne pas autoriser les doublons d’identifiant ni de nom après normalisation, sauf règle métier contraire validée.
- Un type référencé par `HIERARCHIE` ne doit pas être supprimé. Comme le schéma vérifié de `TYPES_STRUCTURE` ne porte pas de statut, ne simule pas une désactivation en écrivant une colonne inventée. Préserve le type et explique son état d’utilisation.
- Les modifications d’un libellé doivent mettre à jour l’affichage sans changer l’identifiant référencé.

#### 2. Hiérarchie configurable par fédération

- Dans la fiche fédération, afficher les niveaux configurés triés par `niveau_hierarchique`, avec type, position, actions disponibles et aperçu lisible de la chaîne.
- Permettre d’ajouter un niveau en sélectionnant un type existant dans `TYPES_STRUCTURE` et un rang valide. Permettre de modifier son rang selon les contraintes ci-dessous.
- Les niveaux et rangs sont propres à la fédération; aucune valeur globale codée en dur ne doit imposer Ligue, Entente, Cercle ou Zone.
- Détecter les rangs manquants, les rangs dupliqués et les types répétés. Refuser les configurations ambiguës; ne pas décider silencieusement si la répétition d’un même type est autorisée.
- Une hiérarchie vide ou partielle doit être affichée comme telle, sans fabriquer de niveaux par défaut.

#### 3. Fiches des structures

- Les cartes, tableaux, formulaires, routes, validations, sélecteurs de parent, labels, aperçus, compteurs et diagnostics doivent être produits à partir des niveaux configurés et des ressources d’instances réellement disponibles.
- Toute instance territoriale est rattachée à une fédération et, sauf au premier niveau après la fédération, à un parent direct du niveau précédent configuré. Le parent doit appartenir à la même fédération.
- Un niveau supérieur supplémentaire, dont Zone, doit disposer d’un moyen vérifié de créer, lire, modifier et sélectionner ses instances. Ne transforme pas une Zone en Ligue, en Cercle ou en autre feuille existante pour contourner l’absence de stockage.
- Si le classeur CNAC a déjà une feuille générique compatible, utilise-la en respectant strictement ses en-têtes et documente son mapping. Si aucune feuille adaptée n’existe, bloque la CRUD des instances et demande l’accord sur une migration CNAC minimale avant toute modification des classeurs.
- Les champs affichés doivent dépendre du schéma réel de la ressource. N’invente pas les colonnes province, ville, sigle, statut, date ou contact pour une nouvelle structure si elles ne sont pas confirmées.
- Ne masque pas les anomalies de données : parent absent, parent d’une autre fédération, doublon, cycle et configuration de hiérarchie incohérente doivent être diagnostiqués clairement.

#### 4. Changements de hiérarchie et conservation des données

- Avant de réordonner, retirer ou remplacer un niveau, détecter les structures enfants et les relations qui deviendraient invalides.
- Ne déplace, ne réaffecte et ne supprime aucune fiche automatiquement lors d’un changement d’ordre.
- En présence d’enfants, soit proposer une opération de migration explicitement confirmée et vérifiable, soit refuser le changement avec le nombre et la nature des relations bloquantes. Pas de perte silencieuse.
- La suppression physique d’une ligne `HIERARCHIE` n’est pas permise par défaut. Le libellé d’interface « désactiver » doit correspondre à une vraie désactivation persistée; si le schéma CNAC n’a pas de champ de statut, retire l’action destructive et documente le besoin de migration plutôt que d’effacer une ligne.
- Préserver les identifiants CNAC existants, toutes les données non concernées et les valeurs historiques.

### Exigences d’interface

- Garder l’identité et les composants CNAC existants. Suivre la référence visuelle autorisée sans copier une règle métier COC.
- Présenter clairement trois notions distinctes : définition d’un type territorial, activation/ordre d’un type dans la hiérarchie d’une fédération, fiches réelles de ce type.
- Rendre visible l’action d’ajout au bon endroit; ne pas obliger l’utilisateur à modifier Sheets à la main pour voir Zone dans la liste.
- Quand le classeur manque du stockage requis, afficher un blocage explicite avec la feuille ou les colonnes manquantes; ne jamais montrer un formulaire qui ne peut pas persister les données.
- Préserver clavier, focus, états de chargement/erreur/succès, confirmations non destructives et usage mobile/desktop.

### Exigences techniques

- Garder les lectures dans le service CNAC dédié et vérifier chaque feuille par `cnacWorkbook`; aucun fallback vers le service Sheets historique ou vers un classeur COC.
- Centraliser le mapping entre `id_type_structure`, rang, ressource d’instances et colonnes réelles; éviter les chaînes `if/else` répétées dans les composants.
- Valider toutes les mutations côté serveur : ressource autorisée, identifiant interne, appartenance fédération, parent, rang, références, doublons et conflits avec des enfants.
- Écrire uniquement les cellules nécessaires via les services CNAC existants. Tenir compte du fait que Google Sheets ne fournit pas de transaction entre `REFERENTIEL` et `STRUCTURE_TERRITORIALE`; définir l’ordre, l’idempotence et la réponse aux échecs partiels.
- Invalider le cache CNAC après toute écriture et relire les données avant une mutation pour résoudre les lignes par identifiant, sans numéro de ligne fourni par le navigateur.
- Respecter la politique d’accès actuellement en place. L’authentification future n’est pas un prétexte pour élargir la surface accessible en production.

### Tests et critères d’acceptation

Ajouter des tests ciblés qui prouvent au minimum :

1. Une fédération configurée avec Zone → Ligue → Club affiche les trois niveaux dans cet ordre et propose le parent du niveau précédent.
2. Une autre fédération configurée seulement avec Ligue → Club ne reçoit ni Zone ni Entente par défaut.
3. Un type présent dans `TYPES_STRUCTURE` mais sans ressource d’instances ne produit pas de fausse fiche éditable; l’interface explique le manque de stockage.
4. Ajouter un type qui existe déjà ne crée pas de doublon; ajouter un nouveau type n’invente pas de colonne.
5. Un parent absent, dupliqué, d’une autre fédération ou créant un cycle est refusé côté serveur.
6. Un changement de rang avec des descendants ne déplace et n’efface aucune donnée silencieusement.
7. Une erreur Sheets, un classeur non CNAC ou un en-tête manquant produit un diagnostic explicite, pas une liste vide.
8. Les mutations de production restent soumises aux contrôles d’accès; le mode local n’autorise que les actions territoriales déjà prévues en développement sur origine loopback.
9. Les identifiants des anciennes lignes et toutes les cellules non modifiées sont conservés.

Exécuter les tests unitaires/intégration pertinents, `npm run lint` et `npm run build`. Vérifier au navigateur la hiérarchie et les fiches en desktop et mobile si les ressources réelles le permettent. Ne pas effectuer de migration, création ou réécriture de masse dans Google Sheets sans accord explicite.

### Rapport final obligatoire

Présenter :

- le modèle CNAC réellement vérifié et les feuilles/en-têtes utilisés ;
- les comportements ajoutés et les écrans/routes concernés ;
- les tests et contrôles exécutés ;
- les limites ou migrations encore nécessaires, notamment si le classeur ne stocke pas les instances de Zone ;
- toute action Sheets qui n’a pas été effectuée.

Ne déclare pas Zone « prise en charge » tant qu’une instance Zone peut être créée, relue, modifiée, reliée à son parent et validée à partir d’un schéma CNAC réel.

---