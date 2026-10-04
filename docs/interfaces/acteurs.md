# Interfaces Acteurs — catégorie Autres

La catégorie **Autres** est accessible sous `/dashboard/acteurs/autres`. Elle fournit une liste responsive avec recherche (identité, fonction, entité ou fédération), filtres de fonction, rattachement et statut, pagination, états vide et erreur, ainsi que les routes de détail, création et modification.

## Mapping réel de `AUTRES`

La feuille contrôlée le 1er septembre 2026 contient les en-têtes suivants : `id_autre_acteur_coc`, `id_entite`, `id_autre_acteur_entite`, `id_national`, `id_international`, `nom_complet`, `id_sexe`, `date_de_naissance`, `lieu_de_naissance`, `nationalite`, `type_autre_acteur`, `telephone`, `email`, `adresse`, `numero_passeport`, `date_de_delivrance_passeport`, `date_expiration_passeport`, `statut`, `avatar_drive_id`, `avatar_drive_url`, `passeport_drive_id`, `passeport_drive_url`, `observations`.

L’identité suit donc la règle des autres feuilles Acteurs : `nom_complet` est utilisé seul, sans colonnes dupliquées pour nom, postnom et prénom. `id_entite` référence `ENTITES.id_entite`. Une fédération est résolue indirectement lorsque `FEDERATIONS.id_entite` correspond à ce rattachement ; son libellé n’est jamais copié dans `AUTRES`. `id_sexe` référence `SEXES.id_sexe`.

La colonne physique `id_national` reste présente dans la feuille pour préserver sa structure, mais la catégorie `AUTRES` n’en dépend pas : elle n’est ni demandée, ni affichée, ni validée, ni modifiée par l’interface. `id_autre_acteur_coc` demeure l’identifiant technique de la ligne.

La feuille était vide lors du contrôle. Aucun champ indispensable n’est absent. Il n’existe pas de référentiel dédié aux fonctions (`type_autre_acteur`) ni aux statuts dans les feuilles associées vérifiées : les fonctions déjà présentes dans `AUTRES` alimentent les suggestions, et les statuts suivent les valeurs Acteurs existantes `ACTIF` / `INACTIF`.

La lecture requiert une attribution active `AUT-SPT`. La création et la modification sont réservées à un utilisateur `ADMIN` disposant d’une attribution active `AUT-SPT`; ces règles sont appliquées côté serveur et les commandes d’écriture sont masquées en lecture seule.
