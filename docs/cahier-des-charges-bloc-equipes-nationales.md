# Cahier des charges fonctionnel — Bloc « Équipes nationales »

**Projet :** Plateforme de gestion du Comité Olympique Congolais (COC)
**Version :** 1.0
**Date :** 13 septembre 2026
**Statut :** Proposition détaillée pour validation métier

## 1. Objet du document

Le présent cahier des charges définit les besoins fonctionnels et non fonctionnels du bloc **Équipes nationales** du tableau de bord du Comité Olympique Congolais.

Ce bloc doit permettre de gérer une équipe nationale dans la durée, ses campagnes ponctuelles, les athlètes sélectionnés, son encadrement, ses engagements dans les compétitions et les documents qui lui sont rattachés.

Une équipe nationale ne doit pas être confondue avec :

- une campagne, qui correspond à une mobilisation datée de l’équipe pour un objectif précis ;
- une sélection d’athlètes, qui correspond à une décision de retenir un athlète dans une campagne ;
- une participation effective à une compétition ;
- une délégation ou une équipe constituée ponctuellement pour une seule compétition.

## 2. Objectifs

Le bloc doit permettre au COC de :

- disposer d’un registre central, fiable et actualisé des équipes nationales ;
- identifier chaque équipe par sa fédération, son sport, sa discipline, sa catégorie d’âge, son sexe et sa saison ;
- conserver l’historique des campagnes et des affectations du staff ;
- suivre les sélections d’athlètes sans les confondre avec leur participation effective ;
- visualiser les engagements de chaque campagne dans les programmes de compétition ;
- centraliser les documents liés aux équipes ;
- contrôler la complétude, la cohérence et la provenance des données ;
- fournir une consultation adaptée aux ordinateurs, tablettes et téléphones.

## 3. Périmètre fonctionnel

### 3.1 Fonctionnalités incluses

Le périmètre comprend :

1. le tableau de bord synthétique des équipes nationales ;
2. la liste, la recherche, le filtrage et la pagination ;
3. la création et la modification d’une équipe nationale ;
4. la consultation de la fiche détaillée ;
5. la gestion des campagnes ;
6. la gestion des sélections d’athlètes ;
7. la gestion du staff permanent ou temporaire ;
8. la consultation des engagements dans les compétitions ;
9. la consultation des documents associés ;
10. le contrôle de la qualité des données ;
11. la gestion des droits de lecture et d’écriture ;
12. la traçabilité des opérations sensibles.

### 3.2 Hors périmètre

Sont exclus de ce bloc :

- la création des fédérations, sports, disciplines, saisons et autres référentiels ;
- la gestion complète des fiches individuelles des athlètes et membres du staff ;
- la création des compétitions et de leurs programmes ;
- la gestion des participations effectives, résultats et médailles, traitée dans le bloc Compétitions ;
- la génération automatique d’un classement sportif non fourni par une source officielle ;
- la suppression physique des données historiques.

## 4. Utilisateurs et habilitations

### 4.1 Profils concernés

- **Super-administrateur :** accès complet en lecture et en écriture.
- **Utilisateur autorisé Gestion sportive (`AUT-SPT`) :** accès au bloc selon son niveau d’action, lecture ou écriture.
- **Utilisateur sans autorisation Gestion sportive :** aucun accès aux pages ni aux API du bloc.

### 4.2 Matrice simplifiée des droits

| Fonction | Lecture | Écriture |
|---|---:|---:|
| Consulter le tableau de bord et la liste | Oui | Sans objet |
| Consulter une fiche équipe | Oui | Sans objet |
| Créer ou modifier une équipe | Oui | Utilisateur habilité |
| Créer ou modifier une campagne | Oui | Utilisateur habilité |
| Ajouter ou modifier une sélection | Oui | Utilisateur habilité |
| Ajouter, modifier ou clôturer une affectation de staff | Oui | Utilisateur habilité |
| Consulter les engagements | Oui | Gestion depuis le bloc Compétitions |
| Consulter les documents | Selon l’autorisation Documents | Depuis le bloc Documents |

Toute tentative non autorisée doit retourner un refus explicite, sans exposer de données métier.

## 5. Définitions métier

- **Équipe nationale :** unité relativement stable rattachée à une fédération et à un sport, éventuellement caractérisée par une discipline, une catégorie d’âge et un sexe.
- **Saison :** période de référence à laquelle appartient l’équipe. Les dates de l’équipe sont celles de cette saison.
- **Campagne :** période durant laquelle l’équipe est mobilisée pour un objectif déterminé.
- **Sélection :** décision datée concernant un athlète dans une campagne.
- **Staff :** ensemble des coachs, médecins, officiels et arbitres affectés à l’équipe pour une période déterminée.
- **Engagement :** rattachement d’une campagne à un programme précis d’une compétition.
- **Participation effective :** présence ou situation réelle d’un acteur dans une compétition ; elle ne peut pas être déduite d’une sélection.

## 6. Parcours fonctionnels

### 6.1 Tableau de bord et liste

La page principale doit afficher :

- le nombre total d’équipes nationales ;
- le nombre d’équipes actives ;
- le nombre d’équipes inactives ;
- le nombre distinct de membres actifs ;
- un bouton **Nouvelle équipe nationale** pour les utilisateurs autorisés en écriture.

La liste doit proposer :

- une recherche libre sur le nom, l’identifiant, la fédération, le sport, la discipline, la catégorie, le sexe et le statut ;
- un filtre par fédération ;
- un filtre par statut : tous, actif ou inactif ;
- un tri alphabétique par nom d’équipe ;
- une pagination de 10, 20 ou 50 éléments ;
- l’accès à la fiche détaillée ;
- un état vide global et un état vide après filtrage ;
- un affichage en tableau sur grand écran et en cartes sur mobile.

Colonnes attendues sur grand écran :

| Colonne | Contenu |
|---|---|
| Équipe nationale | Nom et identifiant technique |
| Fédération | Libellé de la fédération |
| Sport / discipline | Libellés issus des référentiels |
| Catégorie / sexe | Catégorie d’âge et sexe |
| Membres actifs | Nombre d’acteurs distincts actifs |
| Statut | Actif ou inactif |
| Action | Ouverture de la fiche |

### 6.2 Création d’une équipe nationale

Le formulaire doit contenir :

| Champ | Obligatoire | Source / format | Règle |
|---|---:|---|---|
| Fédération | Oui | Référentiel des fédérations | Doit exister et être active selon les règles du référentiel |
| Sport | Oui | Référentiel des sports | Doit être cohérent avec la fédération |
| Discipline | Non | Référentiel des disciplines | Filtrée selon le sport lorsqu’une relation existe |
| Nom de l’équipe nationale | Oui | Texte | Valeur nettoyée, non vide |
| Catégorie d’âge | Non | Référentiel | « Non renseignée » si absente |
| Sexe | Non | Référentiel | « Non renseigné » si absent |
| Saison | Oui | Référentiel des saisons | Détermine la période de l’équipe |
| Statut | Oui | `ACTIF` ou `INACTIF` | `ACTIF` par défaut à la création |
| Observations | Non | Texte multiligne | Informations complémentaires uniquement |

À l’enregistrement, le système doit :

- vérifier les champs obligatoires et les référentiels ;
- générer un identifiant unique et non modifiable ;
- empêcher un doublon métier correspondant à la même fédération, au même sport, à la même discipline, à la même catégorie, au même sexe et à la même saison ;
- enregistrer l’auteur et la date de l’opération dans le journal d’audit ;
- afficher une confirmation ;
- rediriger vers la fiche de l’équipe créée.

### 6.3 Modification d’une équipe nationale

Les éléments suivants sont immuables après création :

- l’identifiant de l’équipe ;
- la fédération ;
- le sport.

Le nom, la discipline, la catégorie d’âge, le sexe, la saison, le statut et les observations peuvent être modifiés par un utilisateur habilité, sous réserve de ne pas invalider des campagnes ou engagements existants.

Une équipe ne doit pas être supprimée physiquement. Elle doit être rendue inactive afin de préserver l’historique.

### 6.4 Fiche détaillée

La fiche doit présenter un en-tête avec le nom, l’identifiant et le statut, puis les onglets suivants :

1. **Général** ;
2. **Campagnes** ;
3. **Sélections** ;
4. **Staff** ;
5. **Engagements** ;
6. **Documents**.

Un résumé de qualité des données doit être affiché avant les onglets. Une défaillance d’une source secondaire ne doit pas empêcher la consultation des autres sections disponibles.

### 6.5 Onglet Général

L’onglet doit afficher : identifiant, fédération, sport, discipline, catégorie, sexe, statut, date de début de saison, date de fin de saison et observations.

Les valeurs absentes doivent être affichées explicitement comme **Non renseigné**, **Non applicable**, **Inconnu** ou **Source indisponible**, selon le cas. Une valeur manquante ne doit pas être remplacée silencieusement par une donnée supposée.

### 6.6 Gestion des campagnes

Une campagne appartient à une seule équipe nationale.

Champs d’une campagne :

| Champ | Obligatoire | Règle |
|---|---:|---|
| Identifiant | Généré | Unique et immuable |
| Nom de la campagne | Oui | Intitulé explicite |
| Date de début | Oui | Date ISO valide |
| Date de fin | Oui | Supérieure ou égale à la date de début |
| Objectif | Non | Description de l’objectif sportif |
| Statut | Oui | Valeur du référentiel `STATUTS_CAMPAGNE` |
| Observation | Non | Texte libre |

Règles particulières :

- les dates doivent rester comprises dans la période de la saison de l’équipe ;
- une campagne ne peut pas être rattachée à une autre équipe après création ;
- les campagnes sont affichées dans l’ordre chronologique ;
- toute modification doit immédiatement actualiser les périodes proposées dans le formulaire de sélection ;
- une campagne déjà utilisée par un engagement ne peut pas être supprimée ; elle doit être clôturée ou changer de statut selon le référentiel.

### 6.7 Gestion des sélections d’athlètes

Une sélection doit toujours appartenir à une campagne existante de l’équipe.

Champs :

| Champ | Obligatoire | Règle |
|---|---:|---|
| Campagne | Oui | Immuable après création |
| Athlète | Oui | Immuable après création, choisi dans le registre des athlètes |
| Statut de sélection | Oui | `PRESELECTIONNE`, `SELECTIONNE`, `REMPLACANT`, `NON_RETENU` ou `RETIRE` |
| Date de sélection | Oui | Comprise dans la période de la campagne |
| Poste | Non | Selon le sport concerné |
| Catégorie de poids | Non | Selon le sport concerné |
| Grade sportif | Non | Selon le sport concerné |
| Observation | Non | Justification ou précision utile |

Le système doit :

- empêcher qu’un même athlète soit ajouté deux fois à la même campagne ;
- permettre l’évolution du statut sans perdre l’historique de la décision ;
- afficher au minimum l’athlète, la campagne, le statut, la date et l’observation ;
- rappeler qu’une sélection ne constitue pas une participation effective à une compétition ;
- refuser toute sélection orpheline ou datée hors de la campagne.

### 6.8 Gestion du staff

Les types d’acteurs autorisés sont : coach, médecin, officiel et arbitre. L’athlète est géré dans les sélections et non comme membre du staff.

Champs d’une affectation :

| Champ | Obligatoire | Règle |
|---|---:|---|
| Type d’acteur | Oui | Immuable après création |
| Acteur | Oui | Immuable après création et existant dans le registre correspondant |
| Rôle | Oui | Issu du référentiel des rôles |
| Date de début | Oui | Date valide |
| Date de fin | Non | Supérieure ou égale à la date de début |
| Statut | Oui | `ACTIF` ou `INACTIF` |
| Observations | Non | Texte libre |

Fonctionnalités attendues :

- recherche de l’acteur par type ;
- proposition automatique d’un rôle compatible avec le type choisi ;
- filtres **Actifs**, **Historique** et **Tous** ;
- clôture d’une affectation active en renseignant le statut inactif et une date de fin ;
- refus des périodes incohérentes ;
- prévention des affectations actives en doublon pour le même acteur, le même rôle et la même équipe.

### 6.9 Consultation des engagements

L’onglet Engagements est alimenté par le bloc Compétitions. La création d’un engagement ne doit pas se faire directement sur l’équipe.

Chaque ligne doit afficher :

- la compétition ;
- la discipline du programme ;
- la campagne engagée ;
- la période de la compétition ;
- le statut de l’engagement.

La relation obligatoire est : **équipe nationale → campagne → engagement → programme de compétition**. Toute relation directe entre une équipe permanente et une compétition est interdite.

Un engagement doit conserver sa provenance : fédération source et date de transmission. Une provenance incomplète doit être signalée dans le contrôle de qualité.

### 6.10 Consultation des documents

L’onglet Documents doit afficher les documents liés à l’équipe, sous réserve des autorisations du bloc Documents.

Pour chaque document :

- nom ;
- type ;
- taille ;
- disponibilité du fichier ;
- lien vers sa fiche.

Si l’utilisateur ne possède pas l’autorisation nécessaire, l’interface doit indiquer que les documents ne sont pas accessibles, sans révéler leur contenu. La création, la modification et le dépôt des fichiers restent gérés dans le bloc Documents.

## 7. Règles de gestion transversales

| Référence | Règle |
|---|---|
| RG-01 | Une équipe nationale appartient à une seule fédération et à un seul sport. |
| RG-02 | Une équipe appartient obligatoirement à une saison. |
| RG-03 | Les dates visibles de l’équipe proviennent de sa saison ; elles ne sont pas saisies en double. |
| RG-04 | La date de fin d’une période ne peut pas précéder sa date de début. |
| RG-05 | Une campagne doit être entièrement comprise dans la saison de l’équipe. |
| RG-06 | Une sélection doit être datée dans la campagne concernée. |
| RG-07 | Campagne et athlète sont immuables après création d’une sélection. |
| RG-08 | Une sélection ne prouve pas une participation effective. |
| RG-09 | Une équipe n’est engagée dans une compétition qu’au moyen d’une campagne et d’un programme. |
| RG-10 | Une donnée historique utilisée ne doit pas être supprimée physiquement. |
| RG-11 | Les libellés des fédérations, sports, disciplines, catégories, sexes, saisons, rôles et statuts proviennent des référentiels. |
| RG-12 | Une référence inconnue doit être signalée ; elle ne doit pas être corrigée automatiquement. |
| RG-13 | Les identifiants générés sont uniques, stables et non réutilisables. |
| RG-14 | Toute écriture doit être validée côté serveur, même si le formulaire applique déjà des contrôles. |
| RG-15 | Le calcul des membres actifs tient compte du statut et de la date de fin. |

## 8. Qualité et intégrité des données

Le système doit calculer et afficher :

- un taux de complétude de la fiche ;
- un taux de provenance des engagements ;
- la liste des anomalies et l’action corrective recommandée.

Anomalies minimales à détecter :

- équipe incomplète ;
- schéma de source invalide ou colonnes manquantes ;
- source indisponible ;
- sélection rattachée à une campagne inconnue ;
- engagement rattaché à une campagne inconnue ;
- affectation de staff sans date de début ;
- provenance d’engagement incomplète ;
- référence absente des référentiels.

Une anomalie bloquante doit empêcher l’écriture concernée. Une anomalie informative ne doit pas bloquer la consultation des autres sections.

## 9. Exigences d’interface et d’expérience utilisateur

- L’interface doit être en français et utiliser une terminologie métier homogène.
- Les boutons d’écriture doivent être masqués pour un utilisateur en lecture seule.
- Chaque formulaire doit identifier visuellement les champs obligatoires.
- Les erreurs doivent être affichées près du champ lorsque possible et résumées par une notification claire.
- Un bouton ne doit pas pouvoir être soumis plusieurs fois pendant un enregistrement.
- Après une écriture réussie, la vue doit afficher les données actualisées, sans données obsolètes issues du cache.
- Les listes et tableaux doivent rester utilisables sur mobile sans défilement horizontal obligatoire.
- Les contrôles doivent être accessibles au clavier et disposer de libellés compréhensibles par les lecteurs d’écran.
- Les états de chargement, vide, erreur, accès refusé et source indisponible doivent être distincts.
- Les dates doivent être saisies au format standard et affichées au format français.

## 10. Exigences techniques et non fonctionnelles

### 10.1 Sécurité

- Vérification de l’authentification et de l’autorisation sur chaque page et chaque route API.
- Validation et nettoyage de toutes les entrées côté serveur.
- Aucun secret, identifiant de stockage ou détail technique sensible dans les messages d’erreur utilisateur.
- Journalisation de l’auteur, de l’action, de la cible, de la date, du résultat et, pour une modification sensible, des valeurs avant/après.

### 10.2 Performance et disponibilité

- Affichage initial de la liste visé en moins de 3 secondes dans les conditions normales d’exploitation.
- Recherche et filtrage visés en moins de 500 ms après chargement des données.
- Une indisponibilité des documents, sélections ou engagements ne doit pas rendre toute la fiche indisponible.
- Les lectures suivant une écriture doivent contourner ou invalider le cache concerné.

### 10.3 Compatibilité et accessibilité

- Compatibilité avec les versions récentes de Chrome, Edge, Firefox et Safari.
- Mise en page responsive à partir de 320 px de largeur.
- Contrastes, focus, libellés et navigation clavier conformes au minimum aux principes WCAG 2.1 niveau AA.

### 10.4 Conservation

- Les données historiques doivent être conservées.
- Les corrections ne doivent pas casser les relations existantes.
- Une stratégie de sauvegarde et de restauration des feuilles sources doit être définie par l’exploitation.

## 11. Sources de données attendues

Le bloc s’appuie au minimum sur les ensembles suivants :

- `EQUIPES_NATIONALES` ;
- `CAMPAGNES_EQUIPES_NATIONALES` ;
- `SELECTIONS_ATHLETES` ;
- `EQUIPES_NATIONALES_MEMBRES` ou la table cible équivalente des affectations ;
- `AFFECTATIONS_STAFF` pour le modèle de campagne lorsqu’il est activé ;
- `SAISONS` ;
- `STATUTS_CAMPAGNE` ;
- fédérations, sports, disciplines, catégories d’âge, sexes et rôles ;
- compétitions, programmes et engagements ;
- registre des acteurs ;
- documents liés aux entités.

Les en-têtes obligatoires doivent être contrôlés avant toute écriture. Toute évolution de schéma doit être documentée et migrée sans perte de données.

## 12. Critères d’acceptation

### CA-01 — Accès

**Étant donné** un utilisateur sans autorisation Gestion sportive, **quand** il tente d’ouvrir le bloc ou son API, **alors** l’accès est refusé sans exposition de données.

### CA-02 — Création valide

**Étant donné** des référentiels disponibles, **quand** un utilisateur habilité renseigne tous les champs obligatoires, **alors** l’équipe est créée avec un identifiant unique et sa fiche s’ouvre.

### CA-03 — Données obligatoires

**Quand** la fédération, le sport, le nom, la saison ou le statut manque, **alors** l’enregistrement est refusé avec un message explicite.

### CA-04 — Doublon

**Étant donné** une équipe ayant la même combinaison métier dans la même saison, **quand** une nouvelle création identique est demandée, **alors** elle est refusée.

### CA-05 — Campagne hors saison

**Quand** les dates d’une campagne dépassent les bornes de la saison de l’équipe, **alors** l’enregistrement est refusé.

### CA-06 — Sélection hors campagne

**Quand** une date de sélection se trouve hors de la période de campagne, **alors** le formulaire et le serveur refusent l’enregistrement.

### CA-07 — Distinction sélection/participation

**Étant donné** un athlète sélectionné, **alors** aucune participation effective à une compétition n’est créée automatiquement.

### CA-08 — Affectation du staff

**Quand** un membre du staff est ajouté avec un type, un acteur, un rôle, une date de début et un statut valides, **alors** l’affectation apparaît dans la vue correspondante.

### CA-09 — Clôture du staff

**Quand** une affectation active est clôturée, **alors** elle devient inactive, possède une date de fin et reste consultable dans l’historique.

### CA-10 — Engagement

**Alors** aucun engagement ne peut exister sans campagne et sans programme de compétition valides.

### CA-11 — Résilience

**Étant donné** une source secondaire indisponible, **quand** la fiche est ouverte, **alors** les sections disponibles restent consultables et la section défaillante affiche une erreur localisée.

### CA-12 — Responsive

**Quand** la liste ou la fiche est consultée sur un écran étroit, **alors** les données essentielles restent lisibles sous forme de cartes ou de colonnes réduites.

### CA-13 — Fraîcheur

**Quand** une équipe, une campagne, une sélection ou une affectation est enregistrée, **alors** la donnée actualisée apparaît immédiatement après confirmation.

### CA-14 — Qualité

**Étant donné** une relation orpheline ou une donnée obligatoire absente, **alors** le résumé de qualité affiche l’anomalie, sa portée et l’action corrective attendue.

## 13. Indicateurs de suivi

- nombre total d’équipes actives et inactives ;
- répartition des équipes par fédération et par sport ;
- taux de fiches complètes ;
- nombre de campagnes actives ;
- nombre d’athlètes sélectionnés par campagne et par statut ;
- nombre de membres de staff actifs ;
- taux d’engagements avec provenance complète ;
- nombre d’anomalies bloquantes et non bloquantes ;
- délai moyen de mise à jour après transmission d’une fédération.

## 14. Livrables attendus

- pages de liste, création et détail des équipes nationales ;
- composants de gestion des campagnes, sélections et affectations du staff ;
- routes API sécurisées et validations serveur ;
- intégration des référentiels, compétitions, engagements et documents ;
- résumé de qualité des données ;
- journal d’audit des écritures ;
- tests unitaires des règles métier ;
- tests d’intégration des routes API ;
- tests de parcours critiques et d’affichage responsive ;
- documentation utilisateur courte pour les agents du COC.

## 15. Conditions de recette

La recette sera prononcée lorsque :

- tous les critères d’acceptation prioritaires sont validés ;
- aucune anomalie bloquante ou critique de sécurité n’est ouverte ;
- les droits lecture/écriture sont testés pour chaque profil ;
- les règles de dates, de doublons et d’intégrité relationnelle sont couvertes par des tests ;
- les écrans principaux sont validés sur ordinateur et mobile ;
- les référentiels et feuilles de production possèdent les en-têtes attendus ;
- un représentant métier du COC valide la terminologie, les statuts et les rôles.

## 16. Points à faire valider par le métier

Avant mise en production définitive, le COC doit confirmer :

1. la définition exacte du doublon d’équipe nationale ;
2. les statuts autorisés pour les campagnes et leurs transitions ;
3. la liste officielle des rôles de staff par type d’acteur ;
4. la possibilité ou non de modifier la saison d’une équipe déjà utilisée ;
5. les règles de chevauchement des campagnes et des affectations ;
6. les documents obligatoires par équipe ou par campagne ;
7. la durée légale ou administrative de conservation des données ;
8. le niveau de détail attendu dans le journal d’audit ;
9. les objectifs de performance applicables à la connexion Internet réelle des utilisateurs ;
10. les indicateurs qui doivent apparaître sur le tableau de bord de direction.
