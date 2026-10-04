# Interface Fédérations

## Existant et sources analysés

La liste et la fiche légère utilisent le référentiel Fédérations sans charger les structures territoriales. La fiche reprend la structure visuelle des détails Acteurs : en-tête du dashboard, bouton de retour, carte synthétique permanente et carte principale responsive.

Les sources sont les suivantes :

- `FEDERATIONS` fournit l’identifiant, le sport rattaché, les statuts et dates d’affiliation, les identifiants des entités continentale et internationale, le statut technique et les observations ;
- `ENTITES` fournit les noms officiels, sigles, coordonnées et sites web des organisations ;
- `SPORTS` résout le libellé du sport ;
- `CATEGORIES_ENTITES` résout la catégorie de la fédération nationale ;
- `AUTRES` fournit les personnes liées à une entité par `id_entite`, avec leur identifiant, nom, type d’acteur utilisé comme fonction, téléphone, e-mail et statut.

## Fiche détaillée

L’en-tête permanent affiche le nom officiel, le sigle, l’identifiant de la fédération, le sport et le statut technique. Ces informations ne sont pas répétées dans le contenu des onglets. Le sport de rattachement demandé pour le périmètre national est donc présenté une seule fois dans cet en-tête.

La fiche comporte trois onglets :

- **National** : catégorie de l’entité, reconnaissance ministérielle et sa date, affiliation au COC et sa date, observations. Les deux statuts utilisent des badges visuellement distincts.
- **Continental** : entité résolue depuis `id_entite_continentale` vers `ENTITES`, date d’affiliation, coordonnées, site externe accessible et contacts actifs issus de `AUTRES`.
- **International** : entité résolue depuis `id_entite_internationale` vers `ENTITES`, date d’affiliation, coordonnées, site externe accessible et contacts actifs issus de `AUTRES`.

Une donnée simple absente affiche `Non renseigné`. Une absence de rattachement continental ou international produit un état vide explicite. Une référence présente mais introuvable dans `ENTITES` est signalée sans exposer l’identifiant technique brut et sans provoquer de 404.

## Contacts et limites du modèle

Les personnes de contact proviennent exclusivement de `PERSONNES_CONTACT_ENTITES`. Une affiliation ou un rattachement ne crée jamais implicitement un contact. L’interface résout le nom, le téléphone et l’e-mail depuis `COACHS`, `MEDECINS`, `ARBITRES`, `OFFICIELS` ou `AUTRES`; une donnée absente affiche `Non renseigné`. Les athlètes sont interdits. Un seul contact principal actif est admis par entité, et la désactivation porte uniquement sur la relation.

## Règles de présentation

- sur le tableau de bord, le détail des statuts est présenté dans un tableau synthétique, comme les autres blocs, sans cartes secondaires ni icônes ;
- aucune donnée n’est inventée ni répétée entre l’en-tête et les onglets ;
- les identifiants de rattachement sont toujours résolus en libellés d’entités ;
- les liens de site web s’ouvrent dans un nouvel onglet avec une indication accessible ;
- la disposition reste en une colonne sur petit écran et reprend la grille `1 + 2` des fiches Acteurs sur grand écran ;
- les autorisations existantes de la famille `/dashboard/federations/*` restent inchangées.

## Logo

L’audit direct de la feuille a confirmé que `FEDERATIONS` possède déjà `logo_drive_id` et `logo_drive_url` : aucune colonne n’a été créée. Le logo est stocké dans le dossier serveur `GOOGLE_DRIVE_FEDERATION_LOGOS_FOLDER_ID`, puis ces deux valeurs permettent de retrouver et d’afficher le fichier sans exposer le dossier au navigateur. La liste affiche le logo juste après l’identifiant et la fiche conserve un repli neutre sur les initiales lorsque l’image est absente ou inaccessible.

La modification est réservée à `AUT-SPT:WRITE`. Le nouveau fichier est envoyé avant la mise à jour de la ligne ; en cas d’échec Sheets il est supprimé, et après réussite l’ancien fichier est supprimé. Une seule référence reste donc active pour une fédération.

## Vérifications

- tests unitaires de résolution des contacts actifs `ENTITES` / `AUTRES` ;
- test structurel des trois onglets et de la grille responsive ;
- vérifications TypeScript, ESLint et build Next.js.
