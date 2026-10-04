# Cartographie des classeurs Google Sheets

GÃ©nÃ©rÃ© le 2026-09-24T21:07:15.715Z. Ce document ne contient ni identifiant de classeur ni donnÃ©e mÃ©tier : uniquement les onglets et leurs en-tÃªtes.

## Blocs d'autorisation

- `AUT-ADM` : administration, rÃ©fÃ©rentiels, activitÃ©s et documents.
- `AUT-SPT` : fÃ©dÃ©rations, structures territoriales, acteurs, compÃ©titions et Ã©quipes nationales.
- `AUT-COM` : communication; aucune source Google Sheets dÃ©diÃ©e n'est actuellement configurÃ©e.
- `SUPER_ADMIN` : utilisateurs, rÃ´les, sessions et audit; donne aussi accÃ¨s Ã  tous les blocs.

## RÃ¨gle de mapping

Les noms ci-dessous sont les noms physiques. L'interface conserve ses noms fonctionnels historiques via des adaptateurs explicites. Toute nouvelle colonne doit d'abord Ãªtre ajoutÃ©e au classeur, puis au mapping et Ã  ses tests.

## REFERENTIEL â€” AUT-ADM

Classeur : **00_REFERENTIELS**. Variable : `GOOGLE_SHEETS_REFERENTIEL_SPREADSHEET_ID`.

- **SPORTS** : `id_sport`, `nom_sport`, `description`, `sport_olympique`, `statut`
- **DISCIPLINES** : `id_discipline`, `id_sport`, `nom_discipline`, `observations`
- **ENTITES** : `id_entite`, `id_categorie_entite`, `nom_officiel`, `sigle`, `adresse_siege`, `telephone`, `email`, `site_web`, `statut`, `observations`
- **FEDERATIONS** : `id_federation`, `id_entite`, `id_sport`, `statut_reconnaissance_ministere`, `date_reconnaissance_nationale`, `statut_affiliation_coc`, `date_affiliation_coc`, `id_entite_continentale`, `date_affiliation_continentale`, `id_entite_internationale`, `date_affiliation_internationale`, `statut`, `observations`, `logo_drive_id`, `logo_drive_url`
- **PROVINCES** : `id_province`, `nom_province`, `statut`, `observations`
- **VILLES** : `id_ville`, `id_province`, `nom_ville`, `statut`, `observations`
- **CATEGORIES_ENTITES** : `id_categorie_entite`, `nom_categorie_entite`, `observations`
- **TYPES_STRUCTURE** : `id_type_structure`, `nom_type_structure`, `description`, `observations`
- **CATEGORIES_CLUB** : `id_categorie_club`, `id_federation`, `nom_categorie_club`, `observations`
- **SEXES** : `id_sexe`, `nom_sexe`, `observation`
- **TYPES_ACTEURS** : `id_type_acteur`, `nom_type_acteur`, `description`, `statut`, `observations`
- **CATEGORIES_AGE** : `id_categorie_age`, `id_federation`, `id_sport`, `id_discipline`, `nom_categorie_age`, `age_min`, `age_max`, `observations`
- **SPECIALITES_MEDECIN** : `id_specialite_sante`, `nom_specialite_sante`, `description`, `observations`
- **GRADES_ARBITRE** : `id_grade_arbitre`, `id_federation`, `id_sport`, `id_discipline`, `nom_grade`, `description`, `observations`
- **FONCTIONS_OFFICIEL** : `id_fonction_acteur`, `nom_fonction`, `observations`
- **TYPES_ACTIVITE** : `id_type_activite`, `nom_type_activite`, `id_federation`, `observation`
- **ROLES_ENTITE_ACTIVITE** : `id_role_entite_activite`, `nom_role_entite_activite`, `observation`
- **TYPES_DOCUMENT** : `id_type_document`, `nom_type_document`, `observations`
- **SAISONS** : `id_saison`, `nom_saison`, `date_debut`, `date_fin`, `statut`, `observation`
- **ROLES_STAFF_EQUIPE_NATIONALE** : `id_role_staff`, `id_type_acteur`, `nom_role_staff`, `observation`
- **STATUTS_CAMPAGNE** : `id_statut_campagne`, `nom_statut_campagne`, `observation`
- **TYPES_COMPETITION** : `id_type_competition`, `nom_type_competition`, `portee_sportive`, `niveau_competition`, `description`, `statut`, `observations`
- **FORMATS_PARTICIPATION** : `id_format_participation`, `nom_format_participation`, `description`, `observations`
- **UNITES_MESURE** : `id_unite_mesure`, `nom_unite_mesure`, `type_mesure`, `observations`
- **TYPES_RESULTAT** : `id_type_resultat`, `id_federation`, `id_sport`, `id_discipline`, `nom_type_resultat`, `id_unite_mesure`, `sens_performance`, `description`, `statut`, `observations`
- **EPREUVES** : `id_epreuve`, `id_federation`, `id_sport`, `id_discipline`, `nom_epreuve`, `id_format_participation`, `id_type_resultat`, `description`, `observations`
- **RESULTATS_SYNTHETIQUES** : `id_resultat_synthetique`, `nom_resultat_synthetique`, `description`, `observations`
- **DECISIONS_RESULTATS** : `id_decision_resultat`, `id_federation`, `id_sport`, `id_discipline`, `nom_decision`, `description`, `statut`, `observations`
- **NIVEAUX_COMPETITION** : `id_niveau_competition`, `nom_niveau_competition`, `observation`
- **STATUTS_COMPETITION** : `id_statut_competition`, `nom_statut_competition`, `observation`
- **STATUTS_PARTICIPATION_ATHLETE** : `id_statut_participation`, `nom_statut_participation`, `observation`
- **STATUTS_SELECTION** : `id_statut_selection`, `nom_statut_selection`, `observation`
- **STATUTS_ENGAGEMENT_PROGRAMME** : `id_statut_engagement`, `nom_statut_engagement`, `observation`
- **STATUTS_VALIDATION_RESULTAT** : `id_statut_validation_resultat`, `nom_statut_validation_resultat`, `observation`
- **DISTINCTIONS_SPORTIVES** : `id_distinction`, `id_federation`, `id_sport`, `id_discipline`, `nom_distinction`, `description`, `statut`, `observations`
- **STATUTS_RESULTAT** : `id_statut_resultat`, `nom_statut_resultat`, `observation`
- **TYPES_ADVERSAIRES** : `id_type_adversaire`, `nom_type_adversaire`, `observation`
- **STATUTS_PUBLICATION** : `id_statut_publication`, `nom_statut_publication`, `observation`

## STRUCTURE_TERRITORIALE â€” AUT-SPT

Classeur : **01_STRUCTURE_TERRITORIALE**. Variable : `GOOGLE_SHEETS_STRUCTURE_TERRITORIALE_SPREADSHEET_ID`.

- **HIERARCHIE** : `id_hierarchie`, `id_federation`, `id_type_structure`, `niveau_hierarchique`, `observations`
- **LIGUES** : `id_ligue_coc`, `id_ligue_federation`, `id_federation`, `id_province`, `nom_ligue`, `sigle_ligue`, `date_creation`, `date_reconnaissance`, `telephone`, `email`, `statut`, `observations`
- **ENTENTES** : `id_entente_coc`, `id_entente_federation`, `id_federation`, `id_structure_parent_coc`, `id_ville`, `nom_entente`, `sigle_entente`, `date_creation`, `date_reconnaissance`, `telephone`, `email`, `statut`, `observations`
- **CERCLES** : `id_cercle_coc`, `id_cercle_federation`, `id_federation`, `id_ville`, `nom_cercle`, `sigle_cercle`, `date_creation`, `date_reconnaissance`, `telephone`, `email`, `statut`, `observations`, `id_structure_parent_coc`
- **CLUBS** : `id_club_coc`, `id_club_federation`, `id_federation`, `id_structure_parent_coc`, `id_categorie_club`, `id_province`, `id_ville`, `nom_club`, `sigle_club`, `date_creation`, `date_affiliation`, `telephone`, `email`, `statut`, `observations`
- **EQUIPES** : `id_equipe_coc`, `id_equipe_federation`, `id_federation`, `id_club_coc`, `id_sport`, `id_discipline`, `id_categorie_age`, `id_sexe`, `nom_equipe`, `statut`, `observations`
- **PERSONNES_CONTACT_ENTITES** : `id_contact_entite`, `id_entite`, `id_type_acteur`, `id_acteur_coc`, `fonction_contact`, `est_contact_principal`, `statut`, `observation`

## ACTEURS â€” AUT-SPT

Classeur : **02_ACTEURS**. Variable : `GOOGLE_SHEETS_ACTEURS_SPREADSHEET_ID`.

- **ATHLETES** : `id_athlete_coc`, `id_federation`, `id_athlete_federation`, `id_national`, `id_international`, `nom_complet`, `id_sexe`, `date_de_naissance`, `lieu_de_naissance`, `nationalite`, `telephone`, `email`, `adresse`, `numero_passeport`, `date_de_delivrance_passeport`, `date_expiration_passeport`, `statut`, `avatar_drive_id`, `avatar_drive_url`, `passeport_drive_id`, `passeport_drive_url`, `observations`
- **COACHS** : `id_coach_coc`, `id_federation`, `id_coach_federation`, `id_national`, `id_international`, `nom_complet`, `id_sexe`, `date_de_naissance`, `lieu_de_naissance`, `nationalite`, `telephone`, `email`, `adresse`, `numero_passeport`, `date_de_delivrance_passeport`, `date_expiration_passeport`, `statut`, `avatar_drive_id`, `avatar_drive_url`, `passeport_drive_id`, `passeport_drive_url`, `observations`
- **OFFICIELS** : `id_officiel_coc`, `id_entite`, `id_officiel_entite`, `id_national`, `id_international`, `nom_complet`, `id_sexe`, `date_de_naissance`, `lieu_de_naissance`, `nationalite`, `telephone`, `email`, `adresse`, `numero_passeport`, `date_de_delivrance_passeport`, `date_expiration_passeport`, `statut`, `avatar_drive_id`, `avatar_drive_url`, `passeport_drive_id`, `passeport_drive_url`, `observations`
- **MEDECINS** : `id_medecin_coc`, `id_entite`, `id_medecin_entite`, `id_national`, `id_international`, `nom_complet`, `id_sexe`, `date_de_naissance`, `lieu_de_naissance`, `nationalite`, `id_specialite_sante`, `telephone`, `email`, `adresse`, `numero_passeport`, `date_de_delivrance_passeport`, `date_expiration_passeport`, `statut`, `avatar_drive_id`, `avatar_drive_url`, `passeport_drive_id`, `passeport_drive_url`, `observations`
- **ARBITRES** : `id_arbitre_coc`, `id_federation`, `id_arbitre_federation`, `id_national`, `id_international`, `nom_complet`, `id_sexe`, `date_de_naissance`, `lieu_de_naissance`, `nationalite`, `telephone`, `email`, `adresse`, `numero_passeport`, `date_de_delivrance_passeport`, `date_expiration_passeport`, `statut`, `avatar_drive_id`, `avatar_drive_url`, `passeport_drive_id`, `passeport_drive_url`, `observations`
- **AUTRES** : `id_autre_acteur_coc`, `id_entite`, `id_autre_acteur_entite`, `nom_complet`, `id_sexe`, `date_de_naissance`, `lieu_de_naissance`, `nationalite`, `type_autre_acteur`, `telephone`, `email`, `adresse`, `numero_passeport`, `date_de_delivrance_passeport`, `date_expiration_passeport`, `statut`, `avatar_drive_id`, `avatar_drive_url`, `passeport_drive_id`, `passeport_drive_url`, `observations`

## ACTEURS_AFFILIATIONS â€” AUT-SPT

Classeur : **03_ACTEURS_AFFILIATIONS**. Variable : `GOOGLE_SHEETS_ACTEURS_AFFILIATIONS_SPREADSHEET_ID`.

- **OFFICIELS_AFFILIATIONS** : `id_affiliation_officiel`, `id_officiel`, `id_fonction_officiel`, `id_entite`, `date_debut`, `date_fin`, `motif_fin`, `observation`

## ACTIVITES â€” AUT-ADM

Classeur : **05_ACTIVITES**. Variable : `GOOGLE_SHEETS_ACTIVITES_SPREADSHEET_ID`.

- **ACTIVITES** : `id_activite`, `id_type_activite`, `id_entite_organisatrice`, `nom_activite`, `titre_public`, `resume`, `date_debut`, `date_fin`, `pays`, `ville`, `lieu`, `id_statut_activite`, `observation`
- **ACTIVITES_ENTITES** : `id_activite_entite`, `id_activite`, `id_entite`, `id_role_entite_activite`, `observation`
- **ACTIVITES_PARTICIPANTS** : `id_participation`, `id_activite`, `id_acteur_coc`, `id_type_acteur`, `id_activite_entite`, `observation`
- **ACTIVITES_QUALIFICATIONS** : `id_qualification_activite`, `id_participation`, `type_qualification`, `id_valeur_avant`, `id_valeur_apres`, `observation`

## DOCUMENTS â€” AUT-ADM

Classeur : **06_DOCUMENTS**. Variable : `GOOGLE_SHEETS_DOCUMENTS_SPREADSHEET_ID`.

- **DOCUMENTS** : `id_document`, `nom_document`, `id_type_document`, `date_document`, `id_entite_origine`, `type_objet_lie`, `id_objet_lie`, `version`, `drive_document_id`, `observation`

## COMPETITIONS â€” AUT-SPT

Classeur : **07_COMPETITIONS**. Variable : `GOOGLE_SHEETS_COMPETITIONS_SPREADSHEET_ID`.

- **COMPETITIONS** : `id_competition`, `nom_competition`, `id_type_competition`, `id_niveau_competition`, `edition`, `est_multisport`, `date_debut`, `date_fin`, `pays`, `ville`, `lieu`, `id_statut_competition`, `observation`
- **PROGRAMMES_COMPETITION** : `id_programme_competition`, `id_competition`, `id_epreuve`, `id_categorie_age`, `id_sexe`, `date_debut`, `date_fin`, `observation`
- **ENGAGEMENTS_CAMPAGNES_PROGRAMMES** : `id_engagement_campagne`, `id_programme_competition`, `id_campagne`, `id_statut_engagement`, `date_engagement`, `id_federation_source`, `reference_source`, `observation`
- **PARTICIPATIONS_ACTEURS_COMPETITION** : `id_participation_acteur`, `id_engagement_campagne`, `id_acteur_coc`, `id_type_acteur`, `id_selection`, `id_affectation_staff`, `id_statut_participation`, `date_statut`, `id_participation_remplacement`, `observation`
- **RESULTATS** : `id_resultat`, `id_resultat_logique`, `numero_version`, `id_resultat_precedent`, `est_version_courante`, `id_engagement_campagne`, `id_programme_competition`, `id_unite_participante`, `date_resultat`, `phase`, `type_adversaire`, `nom_adversaire`, `pays_adversaire`, `id_resultat_synthetique`, `valeur_coc`, `valeur_adversaire`, `id_unite_mesure`, `id_decision_resultat`, `id_statut_resultat`, `motif_correction`, `observation`
- **UNITES_PARTICIPANTES** : `id_unite_participante`, `id_engagement_campagne`, `type_unite`, `id_participation_acteur`, `nom_unite`, `observation`
- **MEMBRES_UNITES_PARTICIPANTES** : `id_membre_unite`, `id_unite_participante`, `id_participation_acteur`, `role_membre`, `observation`
- **MEDAILLES** : `id_medaille`, `id_resultat_logique`, `id_distinction`, `date_obtention`, `observation`

## EQUIPES_NATIONALES â€” AUT-SPT

Classeur : **08_EQUIPES_NATIONALES**. Variable : `GOOGLE_SHEETS_EQUIPES_NATIONALES_SPREADSHEET_ID`.

- **EQUIPES_NATIONALES** : `id_equipe_nationale`, `id_federation`, `id_sport`, `id_discipline`, `nom_equipe_nationale`, `id_categorie_age`, `id_sexe`, `id_saison`, `statut`, `observation`
- **CAMPAGNES_EQUIPES_NATIONALES** : `id_campagne`, `id_equipe_nationale`, `nom_campagne`, `date_debut`, `date_fin`, `objectif`, `id_statut_campagne`, `observation`
- **SELECTIONS_ATHLETES** : `id_selection`, `id_campagne`, `id_athlete`, `id_poste`, `id_categorie_poids`, `id_grade_sportif`, `date_selection`, `id_statut_selection`, `observation`
- **AFFECTATIONS_STAFF** : `id_affectation_staff`, `id_campagne`, `id_acteur_coc`, `id_type_acteur`, `id_role_staff`, `date_debut`, `date_fin`, `observation`

## UTILISATEURS â€” SUPER_ADMIN

Classeur : **09_USERS**. Variable : `GOOGLE_SHEETS_USERS_SPREADSHEET_ID`.

- **USERS** : `id_user`, `nom_complet`, `email`, `password_hash`, `type_user`, `est_super_admin`, `doit_changer_mot_de_passe`, `statut`, `date_creation`, `date_modification_mot_de_passe`, `derniere_connexion`, `session_version`, `date_expiration_acces_temporaire`
- **USER_AUTORISATIONS** : `id_user_autorisation`, `id_user`, `id_bloc_autorisation`, `statut`, `date_debut`, `date_fin`
- **AUTH_TENTATIVES** : `id_tentative`, `identifiant_hash`, `ip_hash`, `date_tentative`, `resultat`, `request_id`
- **JOURNAL_OPERATIONS** : `id_operation`, `id_user`, `action`, `type_objet`, `id_objet`, `date_operation`, `resultat`, `request_id`, `details_non_sensibles`

## Anomalies connues

- `TYPES_STRUCTURE` contient deux colonnes portant le mÃªme nom `observations`; elles doivent Ãªtre fusionnÃ©es dans le classeur source.
- Les membres d'Ã©quipes nationales sont modÃ©lisÃ©s par campagnes (`SELECTIONS_ATHLETES` et `AFFECTATIONS_STAFF`), et non par un onglet gÃ©nÃ©rique.
- Les colonnes physiques au singulier (`observation`) sont adaptÃ©es vers `observations` dans le modÃ¨le d'interface.

