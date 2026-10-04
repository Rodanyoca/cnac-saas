# Contexte du projet

## Objet du dépôt

Ce dépôt contient la V1 du système de gestion du Comité Olympique Congolais (COC). L'application centralise progressivement les données institutionnelles et sportives du COC : fédérations et structures territoriales, acteurs, activités, documents, compétitions, équipes nationales, référentiels et indicateurs de pilotage.

La V1 est une application web Next.js. Dans l'architecture actuelle, Google Sheets sert principalement de stockage structuré et Google Drive de stockage documentaire. Cette architecture constitue une implémentation du système ; elle ne doit pas être confondue avec les principes nationaux et métier définis par les documents de référence.

## Documents de référence

### `snds.pdf`

Le **Standard national des données sportives (SNDS)** définit le cadre commun de structuration des données du mouvement sportif congolais. Il décrit notamment :

- les concepts et blocs de données communs ;
- les principes d'identification et de non-duplication ;
- les relations entre acteurs, organisations et objets sportifs ;
- les affiliations, licences et historiques ;
- les référentiels et règles de qualité ;
- les principes de gouvernance et d'évolution du standard ;
- l'application progressive du standard selon les responsabilités des organisations.

Le SNDS est indépendant de la technologie employée. Ses principes doivent rester applicables si Google Sheets et Google Drive sont remplacés ultérieurement par une base transactionnelle, un stockage objet ou une autre infrastructure.

### `cahier-des-charges-coc.pdf`

Le **Cahier des charges du système de gestion du Comité Olympique Congolais** traduit le cadre du SNDS dans le contexte fonctionnel du COC. Il décrit les capacités attendues du SaaS, notamment :

- l'authentification et les rôles ;
- le tableau de bord et les indicateurs ;
- les fédérations et structures territoriales ;
- les acteurs et leurs relations ;
- les activités ;
- les documents ;
- les compétitions ;
- les équipes nationales ;
- les utilisateurs, l'administration et les contenus ;
- les exigences de qualité, de sécurité, d'exploitation et de documentation.

Ce document constitue la référence fonctionnelle du système. Il décrit la cible attendue, qui peut être plus large que les fonctions effectivement terminées dans la V1.

## Hiérarchie documentaire

En cas d'interprétation ou d'évolution, utiliser l'ordre suivant :

1. les lois, règlements et décisions officiellement applicables ;
2. le SNDS pour les concepts, identifiants, relations et règles communes ;
3. le cahier des charges du COC pour les exigences fonctionnelles du système ;
4. les annexes et référentiels validés pour les valeurs détaillées ;
5. le code et les tests pour constater le comportement effectivement implémenté.

Le code ne doit pas être considéré comme la définition normative d'une règle métier lorsqu'il diverge d'un document validé. Une divergence doit être qualifiée comme écart, dette, transition ou modification documentaire à valider.

## Relation entre les documents et la V1

Le dépôt matérialise une première mise en œuvre opérationnelle. Plusieurs choix sont spécifiques à cette version :

- répartition des données entre plusieurs classeurs et feuilles ;
- cache mémoire destiné à limiter les quotas Google Sheets ;
- invalidation manuelle ou applicative des agrégats ;
- génération de certains identifiants à partir des données existantes ;
- compensations applicatives entre Google Drive et Google Sheets ;
- dégradation partielle des interfaces lorsqu'une source est indisponible.

Ces choix ne doivent pas être élevés automatiquement au rang de règles SNDS. Les enseignements universels à préserver sont notamment :

- utiliser des identifiants stables plutôt que des noms comme relations ;
- centraliser les référentiels ;
- conserver l'historique lorsqu'une relation évolue ;
- distinguer une valeur absente, inconnue, invalide ou indisponible ;
- valider les règles métier côté serveur ;
- orchestrer une opération métier interdépendante par une commande unique ;
- définir la cohérence, la compensation et la reprise des écritures multiples ;
- protéger les documents selon leur niveau de confidentialité ;
- préserver les identifiants et relations lors des évolutions du modèle.

## Principaux domaines couverts par le dépôt

- **Authentification** : comptes, sessions signées et contrôle des rôles.
- **Dashboard** : synthèses territoriales, acteurs, activités, compétitions, équipes nationales et documents.
- **Fédérations** : consultation des fédérations et résolution de leurs entités et sports.
- **Structure territoriale** : hiérarchies, ligues, ententes, clubs et anomalies.
- **Acteurs** : athlètes, entraîneurs, officiels, médecins et arbitres.
- **Affiliations** : relations institutionnelles actuelles et historiques des acteurs concernés.
- **Activités** : activités, entités participantes et participants individuels.
- **Équipes nationales** : équipes, membres, rôles et périodes d'appartenance.
- **Compétitions** : compétitions et engagements des équipes nationales.
- **Documents** : métadonnées, rattachements métier et fichiers privés.
- **Référentiels** : valeurs contrôlées utilisées par les formulaires et validations.

## Règles de contribution

Toute évolution significative devrait :

1. identifier le besoin métier et le bloc SNDS concerné ;
2. vérifier si la modification introduit une valeur, une relation, une exception ou un nouveau concept ;
3. préserver les identifiants et relations existants, ou documenter la migration ;
4. distinguer la règle universelle du détail propre à l'architecture V1 ;
5. mettre à jour les validations serveur, les tests et la documentation ;
6. vérifier les droits d'accès et la confidentialité ;
7. documenter les effets sur le cache et les opérations multi-stockages ;
8. faire valider toute modification normative avant de la présenter comme partie du SNDS.

## Traçabilité des fichiers intégrés

Les deux PDF présents dans ce dossier sont des copies des documents transmis au projet. Ils sont conservés sous des noms stables afin de permettre leur référencement depuis le dépôt :

- `docs/snds.pdf` : 26 pages ;
- `docs/cahier-des-charges-coc.pdf` : 29 pages.

Les fichiers sources externes ne sont pas modifiés par leur intégration dans le dépôt.
