# T12 — Formulaires, actions et autorisations

## Résultat

Les mutations Compétitions et Équipes nationales utilisent maintenant une frontière serveur commune. Cette frontière ne remplace pas la couche Google Sheets existante : elle l'encadre avec les contrôles d'accès, l'idempotence de requête et la journalisation.

## Contrat serveur

Chaque mutation V1 :

1. exige une session valide (`401` sinon) ;
2. contrôle `AUT-SPT:WRITE` avec la matrice centrale (`403` sinon) ;
3. accepte `x-request-id` et refuse un identifiant déjà journalisé (`409`) ;
4. exécute la commande métier et ses validations existantes ;
5. journalise le succès ou l'échec dans `JOURNAL_OPERATIONS` avec l'utilisateur, l'action, le type d'objet et l'identifiant, sans donnée sensible ;
6. invalide les pages et tags concernés après succès.

En l'absence d'un identifiant fourni par un ancien client, le serveur calcule une empreinte de l'utilisateur, de la cible et du contenu sur une fenêtre courte. Un double envoi identique est ainsi refusé sans bloquer une modification légitime ultérieure. Les nouveaux appels peuvent fournir un UUID pour piloter explicitement l'idempotence.

## Matrice d'accès

| Profil | Lecture `AUT-SPT` active | Écriture `AUT-SPT` active |
|---|---:|---:|
| VIEWER attribué | Oui | Non |
| ADMIN sans attribution active | Non | Non |
| ADMIN attribué dans la période | Oui | Oui |
| Super-administrateur | Oui | Oui |

Les boutons restent masqués via `canEdit`, mais cette présentation n'est jamais considérée comme une protection. Les routes contrôlent chaque requête forgée directement.

## Routes harmonisées

- compétitions et programmes ;
- campagnes et engagements ;
- membres, sélections et participants effectifs ;
- résultats et corrections versionnées ;
- segments et performances individuelles.

L'ancienne mutation `/api/competitions/[id]/equipes-nationales` est retirée (`410`) après autorisation : le seul parcours V1 est l'engagement d'une campagne dans un programme.

Les lectures secondaires historiques (`[id]` et recherche d'acteurs) contrôlent aussi désormais `AUT-SPT:READ` côté serveur.

## Comportement des formulaires

- ajout et modification restent présentés dans les volets existants ;
- le bouton d'enregistrement est désactivé pendant la requête ;
- le volet n'est fermé qu'après un succès ;
- une erreur de validation affiche son message et conserve toutes les valeurs ;
- le state local et les invalidations Next.js actualisent la vue après succès.

## Vérifications

`tests/unit/competitions-t12.test.ts` couvre VIEWER, ADMIN sans attribution, attribution expirée/active, 401/403, répétition de requête, audit succès/échec, frontières V1, route retirée, lectures secondaires et conservation de saisie.

Aucune feuille Google Sheets n'a été modifiée pendant l'implémentation ou les tests.
