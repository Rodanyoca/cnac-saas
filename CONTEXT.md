# SaaS du Comité Olympique Congolais

Ce contexte décrit le langage métier partagé du SaaS du COC. Les choix techniques et les règles détaillées sont documentés séparément.

## Identités et accès

**Utilisateur**:
Compte nominatif autorisé à accéder à tout ou partie du SaaS. Il reste distinct d'un acteur sportif, même lorsqu'ils représentent la même personne.
_Éviter_: Acteur, profil, login

**Type d'utilisateur**:
Niveau général d'intervention d'un utilisateur : `ADMIN` ou `VIEWER`.
_Éviter_: Rôle, profil d'accès

**Super-administrateur**:
Utilisateur habilité à gérer les utilisateurs, leurs autorisations et les référentiels. Cette qualité lui donne également un accès complet aux blocs métier et à toutes les sections de navigation.
_Éviter_: Administrateur global, propriétaire

**Bloc d'autorisation**:
Périmètre fonctionnel explicite auquel un utilisateur peut accéder : administration métier, gestion sportive ou communication.
_Éviter_: Rôle, permission implicite

**Autorisation utilisateur**:
Attribution datée et révocable d'un bloc d'autorisation à un utilisateur. L'absence d'une attribution valide signifie un refus d'accès.
_Éviter_: Droit par défaut, permission héritée

## États du compte

**Compte actif**:
Compte autorisé à tenter une authentification, sous réserve de satisfaire les autres contrôles de sécurité.

**Compte inactif**:
Compte désactivé administrativement de manière durable, mais conservé avec son historique.
_Éviter_: Compte supprimé

**Compte bloqué**:
Compte frappé d'un blocage administratif permanent qui exige l'intervention d'un super-administrateur.
_Éviter_: Blocage temporaire

**Blocage temporaire**:
Refus automatique de nouvelles connexions pendant trente minutes après dix échecs de connexion. Il ne modifie pas le statut administratif du compte.
_Éviter_: Compte bloqué

**Activation du compte**:
Première connexion contrôlée au cours de laquelle l'utilisateur remplace son accès temporaire avant d'accéder au SaaS.
_Éviter_: Connexion normale

**Accès temporaire**:
Secret à usage transitoire, valable vingt-quatre heures, remis à l'utilisateur pour activer ou récupérer son compte.
_Éviter_: Mot de passe permanent

## Traçabilité

**Session**:
Accès authentifié limité dans le temps et lié à la version de session courante de l'utilisateur.

**Version de session**:
Compteur du compte dont la modification rend invalides toutes les sessions émises avec une version antérieure.

**Opération auditée**:
Action importante dont l'auteur, la cible, la date et le résultat sont conservés sans secret d'authentification.
_Éviter_: Log technique

## Compétitions et équipes nationales

**Compétition**:
Édition concrète, datée et localisée d’un événement sportif suivie par le COC. En V1, une ligne représente directement cette édition, y compris lorsqu’elle est multisport.
_Éviter_: Modèle récurrent, compétition par sport

**Programme de compétition**:
Déclinaison d’une compétition par épreuve, et éventuellement par catégorie d’âge et sexe. Il porte le contexte sportif dans lequel une campagne s’engage et un résultat est obtenu.
_Éviter_: Nouvelle compétition, discipline recopiée

**Équipe nationale**:
Unité relativement stable rattachée à une fédération, un sport et, le cas échéant, une discipline, une catégorie d’âge et un sexe.
_Éviter_: Sélection, campagne, délégation ponctuelle

**Campagne d’équipe nationale**:
Mobilisation datée d’une équipe nationale pour un objectif déterminé. Elle contient les sélections d’athlètes et les affectations de staff.
_Éviter_: Équipe nationale, compétition

**Engagement de campagne**:
Relation temporelle et sourcée par laquelle une campagne d’équipe nationale est engagée dans un programme de compétition.
_Éviter_: Participation de l’équipe permanente, rattachement compétition-équipe

**Sélection d’athlète**:
Décision datée de retenir ou d’écarter un athlète dans une campagne. Elle ne prouve jamais sa présence effective dans une compétition.
_Éviter_: Participation, engagement

**Participation effective**:
État explicite d’un athlète sélectionné par rapport à un engagement de campagne, notamment participant, absent, forfait ou remplacé.
_Éviter_: Sélection, présence déduite

**Résultat sportif**:
Version sourcée et validable d’un résultat appartenant à un programme et à l’engagement concerné. Ses segments et performances individuelles en sont des détails, jamais des copies dans l’équipe nationale.
_Éviter_: Classement calculé, résultat d’équipe dupliqué

**Classement officiel**:
Classement fourni par une organisation compétente et conservé comme donnée officielle. Aucun classement n’est produit sans règle officielle explicite.
_Éviter_: Classement déduit, ranking automatique
