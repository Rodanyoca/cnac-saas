# Plan d'harmonisation par lots

## Contexte

Le travail d'harmonisation vise à aligner l'application COC sur le système visuel de référence FEBACO sans casser la logique métier existante ni les règles d'autorisation.

La stratégie retenue suit une progression par lots indépendants :

1. stabiliser les fondations visuelles ;
2. harmoniser la structure globale de navigation ;
3. corriger les composants de contenu et les cartes ;
4. réviser les interactions et les états de chargement ;
5. finaliser les éléments de détail et la cohérence globale.

---

## Lot 1 — Fondations visuelles et design tokens

### Objectif
Aligner les variables CSS de base, la palette, les surfaces, les bordures et les couleurs de texte pour passer d'un thème générique à un thème institutionnel sombre inspiré de FEBACO.

### Livrables attendus
- tokens de couleur centralisés ;
- palette marine / bleu / or / accent ;
- fond de page harmonisé ;
- variables Tailwind réexposées ;
- états de sélection et de focus cohérents.

### État actuel
- Implémentation réalisée dans [coc-cible/app/globals.css](../../app/globals.css).
- Le thème sombre institutionnel a été défini avec les couleurs de référence et les variables `--background`, `--sidebar`, `--primary`, `--accent`, etc.
- Vérification effectuée : le fichier est bien présent dans le dépôt et la syntaxe CSS est cohérente.

### Blocages / points de vigilance
- Le thème ne suffit pas à rendre l'interface harmonisée sans ajuster les layouts et composants de navigation.
- Il faut éviter de surcharger la couleur COC avec trop de références FEBACO.

---

## Lot 2 — Navigation et structure de dashboard

### Objectif
Adapter la navigation principale du tableau de bord à la structure FEBACO tout en conservant les règles d'accès COC actuellement calculées par `dashboardNavigation` et `visibleDashboardNavigation`.

### Livrables attendus
- sidebar plus ligne directe, institutionnelle et compacte ;
- groupes de navigation hiérarchiques ;
- états actifs / survol / sous-menu cohérents ;
- branding COC et non FEBACO.

### État actuel
- Adaptation réalisée dans les composants de navigation :
  - [coc-cible/components/dashboard/sidebar.tsx](../../components/dashboard/sidebar.tsx)
  - [coc-cible/components/dashboard/header.tsx](../../components/dashboard/header.tsx)
  - [coc-cible/app/dashboard/layout.tsx](../../app/dashboard/layout.tsx)
- Le code métier de permissions est bien conservé ; l'adaptation est visuelle et structurelle.
- L'application a été maintenue dans une logique de composition COC, avec filtre d'accès conservé.

### Blocages / points de vigilance
- Il faut préserver la logique d'autorisation et éviter de réécrire le système de navigation en dur.
- Le fichier de sidebar doit rester cohérent avec les routes réelles du projet et les accès autorisés.

---

## Lot 3 — Cartes, tableaux et contenus de dashboard

### Objectif
Uniformiser les composants les plus représentatifs du dashboard : cartes de synthèse, tableaux, headers de sections, états vides et badges.

### Livrables attendus
- surfaces uniformisées ;
- tableaux avec style institutionnel ;
- titres et sous-titres alignés;
- cartes de metrics plus lisibles et plus cohérentes.

### État actuel
- Adaptation réalisée sur les sections de synthèse, cartes, tableaux, badges et états vides du dashboard.

---

## Lot 4 — États d'interaction et composants d'UI

### Objectif
Harmoniser les composants génériques de formulaire et d'action : boutons, champs, sélecteurs, badges, toasts, tableaux de filtres, menus contextuels.

### Livrables attendus
- boutons avec hiérarchie claire ;
- focus states robustes ;
- menus et modales cohérents ;
- density visuelle plus proche du système de référence.

### État actuel
- Adaptation largement réalisée sur les boutons, champs, sélecteurs, formulaires, modales, upload, recherche et actions de rafraîchissement.

---

## Lot 5 — Finition visuelle et robustesse UX

### Objectif
Faire une passe de cohérence globale sur la qualité du rendu, la lisibilité, la densité, les contrastes et les petits détails d'interface.

### Livrables attendus
- validation visuelle globale ;
- correctifs finaux de contraste / taille / espacement ;
- nettoyage de composants dégradés ou trop génériques.

### État actuel
- En cours : la page de connexion est harmonisée avec le modèle institutionnel FEBACO ; la validation responsive et la passe finale restent à effectuer.

---

## Point d'arrêt réel

Le travail est arrivé à la phase de finition visuelle. Les lots 1 à 4 sont réalisés, avec le lot 5 en cours. La logique métier, l'authentification et les règles d'autorisation sont conservées.

L'écart observé est donc principalement le suivant :

- fondation visuelle : OK
- navigation institutionnelle : réalisée
- composants de contenu : réalisés
- interactions et formulaires : réalisés
- page de connexion : adaptée au modèle visuel FEBACO
- finition UX : en cours

---

## Suite recommandée

La suite logique est de terminer le lot 5 avec :

1. la validation visuelle desktop et mobile ;
2. le test des parcours de connexion et de navigation ;
3. la vérification des contrastes et espacements ;
4. la correction du warning React restant dans `athlete-sport-history.tsx`, si l'objectif est zéro warning.

La configuration `.env.local` est considérée comme traitée séparément et ne constitue plus un blocage de l'adaptation UI.

---

## Référence des fichiers clefs

- [coc-cible/app/globals.css](../../app/globals.css)
- [coc-cible/components/dashboard/sidebar.tsx](../../components/dashboard/sidebar.tsx)
- [coc-cible/components/dashboard/header.tsx](../../components/dashboard/header.tsx)
- [coc-cible/app/dashboard/layout.tsx](../../app/dashboard/layout.tsx)
- [coc-cible/lib/navigation/dashboard-navigation.ts](../../lib/navigation/dashboard-navigation.ts)
- [coc-cible/lib/auth.ts](../../lib/auth.ts)
