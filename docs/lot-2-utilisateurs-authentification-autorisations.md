# LOT 2 — Utilisateurs, authentification et autorisations

Statut : décisions fonctionnelles et architecturales figées avant implémentation.

## 1. Périmètre et sources

Le LOT 2 ajoute les utilisateurs, l'activation des comptes, la gestion du compte courant, les autorisations et l'administration des accès. L'interface de connexion livrée au LOT 1 est conservée visuellement.

Google Sheets reste la couche de données. Les documents institutionnels présents dans `docs/` sont des sources du référentiel et des exigences, mais leur intégration documentaire reste séparée du code d'authentification.

Le présent LOT remplace, pour l'application COC, l'ancien modèle `auth_user_id`, `role` et `USER_PERIMETRES` décrit dans le cahier des charges. L'écart est intentionnel : l'authentification est locale, les secrets sont représentés uniquement par des empreintes non réversibles et les accès sont attribués par blocs fonctionnels.

Toutes les dates et échéances métier de ce LOT sont interprétées dans le fuseau `Africa/Kinshasa`. Les instants persistés utilisent un format ISO 8601 non ambigu avec décalage ou UTC ; leur affichage et les limites de journée utilisent `Africa/Kinshasa`.

## 2. Schéma des feuilles

### 2.1 `USERS`

| Colonne | Règle |
| --- | --- |
| `id_user` | Identifiant stable, unique et non réutilisé |
| `nom_complet` | Obligatoire |
| `email` | Obligatoire, unique après normalisation par suppression des espaces périphériques et passage en minuscules |
| `password_hash` | Empreinte `scrypt` versionnée ; jamais un mot de passe en clair |
| `type_user` | `ADMIN` ou `VIEWER` uniquement |
| `est_super_admin` | Booléen explicite, faux par défaut |
| `doit_changer_mot_de_passe` | Booléen explicite |
| `statut` | `ACTIF`, `INACTIF` ou `BLOQUE` |
| `date_creation` | Instant de création |
| `date_modification_mot_de_passe` | Instant du dernier remplacement effectif |
| `derniere_connexion` | Instant de la dernière authentification réussie complète |
| `session_version` | Entier positif incrémenté lors des événements de révocation |
| `date_expiration_acces_temporaire` | Instant d'expiration de l'accès temporaire, vide hors activation ou réinitialisation |

`password_hash` utilise un format auto-descriptif de la forme `scrypt$v1$N=65536,r=8,p=1,l=64$<sel>$<empreinte>`. Le sel contient 16 octets aléatoires et l'empreinte 64 octets. L'implémentation réserve au moins 128 Mio à l'appel `scrypt`, compare en temps constant et refuse tout format ou paramètre non reconnu. Le format permet d'augmenter ultérieurement les paramètres et de renouveler une empreinte après authentification.

### 2.2 `USER_AUTORISATIONS`

| Colonne | Règle |
| --- | --- |
| `id_user_autorisation` | Identifiant stable et unique |
| `id_user` | Référence vers `USERS.id_user` |
| `id_bloc_autorisation` | Référence vers `BLOCS_AUTORISATION.id_bloc_autorisation` |
| `statut` | `ACTIF` ou `INACTIF` |
| `date_debut` | Date obligatoire et inclusive |
| `date_fin` | Date facultative et inclusive |

Une attribution accorde un accès seulement si elle est `ACTIF`, si sa date de début est atteinte et si sa date de fin est absente ou non dépassée. Plusieurs périodes historiques sont permises, mais deux périodes actives ou futures du même utilisateur et du même bloc ne peuvent pas se chevaucher. Une attribution retirée est fermée ou désactivée, jamais supprimée.

Les colonnes actuelles `peut_creer`, `peut_modifier` et `peut_supprimer` sont abandonnées par le modèle cible.

### 2.3 `BLOCS_AUTORISATION`

| Identifiant | Libellé | Couverture |
| --- | --- | --- |
| `AUT-ADM` | `ADMINISTRATION` | Activités, participants aux activités et documents |
| `AUT-SPT` | `GESTION SPORTIVE` | Structures, acteurs, affiliations, licences, équipes nationales, compétitions, participants et résultats |
| `AUT-COM` | `COMMUNICATION` | Articles, galeries, partenaires et contenus du site web |

La gestion des utilisateurs, des autorisations et des référentiels découle exclusivement de `est_super_admin`; elle ne fait pas partie de `AUT-ADM`.

### 2.4 `AUTH_TENTATIVES`

Feuille technique append-only utilisée pour la protection contre les tentatives répétées :

| Colonne | Règle |
| --- | --- |
| `id_tentative` | Identifiant unique |
| `identifiant_hash` | Empreinte pseudonymisée de l'adresse normalisée |
| `ip_hash` | Empreinte pseudonymisée de l'adresse réseau disponible |
| `date_tentative` | Instant de la tentative |
| `resultat` | `ECHEC`, `SUCCES` ou `REFUS_BLOCAGE_TEMPORAIRE` |
| `request_id` | Identifiant de corrélation non secret |

Le mot de passe, l'adresse en clair, le cookie et les secrets ne sont jamais inscrits dans cette feuille. Un succès clôt la série d'échecs antérieure. Le dixième échec dans la fenêtre de trente minutes déclenche un blocage automatique de trente minutes. Ce blocage est calculé à partir du journal et ne change pas `USERS.statut`. Les tentatives contre un compte inconnu suivent le même traitement observable.

Les empreintes d'identifiant et d'adresse réseau utilisent HMAC-SHA-256 avec une clé de télémétrie distincte, fournie par la plateforme de déploiement sans lecture ni modification d'un fichier d'environnement. Les lignes de tentatives sont conservées 90 jours, sous réserve d'une exigence institutionnelle plus stricte.

### 2.5 `JOURNAL_OPERATIONS`

Feuille d'audit append-only :

| Colonne | Règle |
| --- | --- |
| `id_operation` | Identifiant unique |
| `id_user` | Auteur connu ; vide lorsque l'identité n'est pas authentifiée |
| `action` | Action canonique |
| `type_objet` | Type de cible |
| `id_objet` | Identifiant de cible lorsque disponible |
| `date_operation` | Instant de l'action |
| `resultat` | `SUCCES` ou `ECHEC` |
| `request_id` | Identifiant de corrélation |
| `details_non_sensibles` | Contexte minimal, structuré et expurgé |

Le journal couvre les créations de comptes, activations, changements et réinitialisations de mot de passe, changements d'adresse, statuts, types, qualité de super-administrateur, attributions et retraits d'autorisation, révocations et opérations administratives échouées. Aucun mot de passe, accès temporaire, hash de mot de passe, cookie ou secret n'est journalisé.

Le journal d'audit est conservé au minimum 24 mois. Une durée institutionnelle supérieure prévaut sans changer son schéma.

## 3. Politique d'authentification

- Mot de passe de 12 à 128 caractères.
- Les phrases de passe et le collage sont autorisés.
- Aucune règle artificielle de composition n'impose majuscule, chiffre ou symbole.
- Les mots de passe manifestement courants ou compromis sont refusés.
- Aucune expiration périodique automatique.
- Un mot de passe permanent doit différer de l'accès temporaire présenté.
- Le hachage utilise `scrypt` fourni par `node:crypto`, un sel aléatoire par secret, des paramètres enregistrés dans l'empreinte et une comparaison en temps constant.
- Aucun mot de passe ou accès temporaire n'est stocké, affiché à nouveau ou journalisé en clair.
- Les réponses de connexion restent génériques pour un compte absent, inactif, bloqué, temporairement bloqué ou des identifiants incorrects.

L'accès temporaire est généré aléatoirement, comporte 20 caractères, est affiché une seule fois au super-administrateur et expire après 24 heures. Sa transmission s'effectue hors bande, par un canal distinct de celui utilisé pour communiquer l'adresse du compte.

## 4. Sessions et révocation

Une session expire huit heures après son émission, sans prolongation silencieuse et sans option « rester connecté ». Le cookie est `HttpOnly`, `Secure` en production et `SameSite=Lax`.

La session contient au minimum l'identifiant utilisateur, sa `session_version`, sa date d'émission et son expiration. Le serveur recharge sans cache le compte et les autorisations nécessaires lors de chaque page protégée et de chaque action sensible. Une indisponibilité ou une incohérence de la source d'autorisation provoque un refus sécurisé.

`session_version` est incrémentée lors de :

- changement volontaire du mot de passe ;
- réinitialisation administrative ;
- passage à `INACTIF` ou `BLOQUE` ;
- déblocage ou réactivation ;
- changement de `type_user` ;
- attribution, modification ou retrait d'une autorisation ;
- modification de `est_super_admin` ;
- révocation explicite de toutes les sessions.

Après un changement volontaire de mot de passe, une nouvelle session peut remplacer celle qui a initié l'action. Toutes les sessions portant l'ancienne version deviennent invalides.

## 5. Règles d'autorisation serveur

Une autorisation n'est jamais déduite de l'absence d'une ligne.

| Profil | Lecture d'un bloc attribué | Modification d'un bloc attribué | Administration des utilisateurs et référentiels |
| --- | --- | --- | --- |
| `VIEWER` | Oui | Non | Non |
| `ADMIN` | Oui | Oui | Non |
| Super-administrateur | Tous les blocs | Tous les blocs | Oui |

Le super-administrateur reçoit un accès complet en lecture et écriture aux trois blocs métier. Il accède également aux utilisateurs, autorisations et référentiels.

Chaque route serveur déclare le bloc et l'action qu'elle exige. Le contrôle vérifie successivement : session valide, compte `ACTIF`, activation terminée, version de session courante, qualité de super-administrateur, puis, pour un compte ordinaire, type autorisé et attribution explicite et valide du bloc. Le masquage d'un bouton ne constitue jamais un contrôle d'accès.

Le dernier super-administrateur actif ne peut pas être désactivé, bloqué, rétrogradé ni privé de sa qualité. Cette protection est appliquée côté serveur, y compris lorsqu'il agit sur son propre compte.

Comme Google Sheets n'offre pas de transaction multi-feuilles, chaque commande administrative possède un `request_id` idempotent, relit les lignes concernées immédiatement avant écriture et ne confirme le succès qu'après vérification de toutes les écritures attendues. Un échec partiel produit un résultat d'audit explicite et une compensation sûre ; il ne doit jamais être masqué par une réponse de succès.

## 6. Parcours d'interface

### 6.1 Connexion existante

La composition visuelle du LOT 1 n'est pas redessinée. Après validation :

- accès temporaire valide ou `doit_changer_mot_de_passe = TRUE` : redirection vers l'activation ;
- compte pleinement actif : redirection vers le dashboard ;
- tout refus : message générique existant, sans révéler l'état du compte.

### 6.2 Création par le super-administrateur

Le super-administrateur saisit identité, adresse, type et autorisations initiales. L'adresse est contrôlée sans sensibilité à la casse. Si elle existe déjà, il doit utiliser le compte existant. Après confirmation, le système crée le compte, génère l'accès temporaire, affiche celui-ci une seule fois et fournit une action explicite de copie.

### 6.3 Activation

Avant activation, seules la page d'activation, la lecture minimale de session, le remplacement du secret et la déconnexion sont accessibles. L'utilisateur saisit l'accès temporaire, choisit et confirme son mot de passe permanent, puis reçoit une nouvelle session.

### 6.4 Mon compte

La page affiche l'identité, l'adresse, le type, le statut et les blocs attribués en lecture seule. Elle permet le changement volontaire du mot de passe après vérification du mot de passe courant. Le LOT 2 ne permet pas à l'utilisateur de modifier lui-même son adresse.

### 6.5 Administration des utilisateurs

Réservée au super-administrateur :

- liste recherchable et filtrable par type, statut et qualité de super-administrateur ;
- création d'un utilisateur ;
- détail et historique minimal ;
- modification de l'identité, de l'adresse, du type et du statut ;
- attribution, programmation, fermeture ou retrait des blocs ;
- réinitialisation de l'accès ;
- révocation de toutes les sessions.

Un changement d'adresse déclenche une nouvelle activation, un nouvel accès temporaire et la révocation des sessions. Une réinitialisation remplace l'ancienne empreinte, fixe l'expiration à 24 heures et rend les sessions existantes invalides.

### 6.6 États interdits

- `INACTIF` : connexion interdite jusqu'à réactivation administrative.
- `BLOQUE` : blocage administratif permanent jusqu'au déblocage par un super-administrateur.
- blocage automatique : connexion interdite pendant 30 minutes après dix échecs ; aucune intervention administrative requise.

## 7. Migration des comptes existants

Les anciennes colonnes `password` et `role` ne sont ni réutilisées ni converties automatiquement. Aucun ancien mot de passe n'est haché pour prolonger sa validité.

Pour chaque compte conservé :

1. créer ou préserver un `id_user` stable ;
2. normaliser et contrôler l'unicité de l'adresse ;
3. traduire l'ancien rôle par une décision explicite, jamais silencieusement ;
4. conserver uniquement un statut reconnu, sinon signaler l'anomalie ;
5. vider toute ancienne donnée de mot de passe en clair ;
6. générer un nouvel accès temporaire haché ;
7. fixer `doit_changer_mot_de_passe = TRUE` et son expiration à 24 heures ;
8. initialiser ou incrémenter `session_version` ;
9. attribuer explicitement les blocs ;
10. auditer le résultat sans secret.

La migration doit être préparée et validée comme une opération distincte. Elle n'est pas exécutée par l'implémentation ordinaire du parcours de connexion.

## 8. Critères de test

### Authentification et secrets

- Aucun stockage, rendu, réponse HTTP ou journal ne contient un mot de passe ou accès temporaire en clair.
- Une empreinte correcte authentifie ; une empreinte altérée ou un format inconnu échoue sans exception exposée.
- Les limites de 12 et 128 caractères et le refus des secrets compromis sont testés.
- L'accès temporaire n'est affiché qu'à sa génération, expire après 24 heures et ne permet pas d'accéder au dashboard.
- Les anciens mots de passe cessent tous de fonctionner après migration.

### Sessions

- Une session expire après huit heures sans glissement.
- Toute modification déclenchant une nouvelle `session_version` invalide les anciens cookies.
- Changer volontairement son mot de passe invalide les autres sessions et renouvelle correctement la session courante.
- Une source d'autorisation indisponible ou incohérente produit un refus, jamais un accès par défaut.

### Statuts et tentatives

- `INACTIF` et `BLOQUE` interdisent connexion et réutilisation des sessions.
- Dix échecs dans la fenêtre déclenchent exactement trente minutes de blocage temporaire sans changer `USERS.statut`.
- Le blocage temporaire se lève automatiquement ; le blocage administratif ne se lève pas automatiquement.
- Un compte inconnu et un compte existant produisent des réponses extérieurement équivalentes.

### Autorisations

- Un `VIEWER` ne peut modifier aucun bloc, même en appelant directement une API.
- Un `ADMIN` peut modifier uniquement un bloc explicitement attribué et valide.
- Une ligne absente, inactive, future ou expirée refuse l'accès.
- Les bornes `date_debut` et `date_fin` sont inclusives selon `Africa/Kinshasa`.
- Deux périodes qui se chevauchent pour un même utilisateur et bloc sont refusées.
- Un super-administrateur gère utilisateurs et référentiels et accède aux trois blocs métier sans attribution supplémentaire.
- Toute route d'écriture est testée côté serveur pour son bloc et son action.

### Administration et audit

- Les adresses normalisées sont uniques et un doublon renvoie vers la gestion du compte existant.
- Le dernier super-administrateur actif ne peut être neutralisé.
- Création, réinitialisation, changement d'adresse, statut, type, super-administration, autorisations et révocation produisent les écritures d'audit attendues.
- Les échecs partiels ne sont pas annoncés comme des succès et ne laissent pas silencieusement un compte dans un état incohérent.
- La répétition d'une même commande avec le même `request_id` ne crée ni compte, ni autorisation, ni écriture d'audit en double.
- Les feuilles techniques ne contiennent aucune donnée d'authentification interdite.

### Interface

- La page de connexion conserve le design du LOT 1.
- Un compte à activer ne peut atteindre que le parcours d'activation et la déconnexion.
- Les actions non autorisées sont absentes de l'interface, sans que cette absence remplace les contrôles serveur.
- Les messages sont compréhensibles sans révéler l'existence, le statut ou le blocage temporaire d'un compte.

## 9. Hors implémentation actuelle

Ce document fige la cible avant développement. Il n'autorise encore aucune modification du code d'authentification, des feuilles Google Sheets ou des fichiers d'environnement.
