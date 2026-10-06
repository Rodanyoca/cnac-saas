# Fédérations — écarts et restauration du design

Date : 6 octobre 2026.

À la demande utilisateur, la refonte en rapport institutionnel est abandonnée. Le périmètre de restauration couvre les interfaces des fédérations modifiées pendant cette refonte, y compris les ajustements de colonnes et de typographie qui ont suivi. La référence de restauration est leur version précédant la refonte, présente dans le commit `bb501f3`.

| Élément | Écart introduit par la refonte abandonnée | Design rétabli |
| --- | --- | --- |
| Liste des fédérations | Tableau sobre unique, actions textuelles, logos et badges retirés | Présentation responsive précédente, logos, badges et boutons d’actions |
| Colonnes de la liste | Ajouts de données administratives puis retrait de reconnaissance ministérielle et affiliation COC | Champs et disposition exacts de la liste précédente |
| Fiche détaillée | Page verticale numérotée sans onglets | Onglets Identification et Structure, cartes et blocs précédents |
| Identité et logo | Logo carré et grille de champs en plusieurs colonnes | Composant de logo et panneau d’identité précédents |
| Typographie et bordures | Styles spécifiques compacts puis police commune de 14 px, bordures limitées aux tableaux | Typographie, espacements, bordures et composants précédents |
| Coordonnées et organismes liés | Tables de champs puis grilles responsives | Sections et champs du design précédent |
| Contacts | Mode rapport avec tableau et recherche locale | Cartes de contacts précédentes ; formulaires et API conservés |
| Hiérarchie territoriale | Tableau Ordre / Type / Parent | Résumé visuel précédent |
| Collections territoriales | Tableaux horizontaux communs au desktop et au mobile, actions textuelles | Tableaux desktop et cartes mobile précédents, recherche et pagination conservées |
| Parent direct | Colonne ajoutée pendant la refonte puis retirée | Aucun ajout de colonne au design précédent |
| Chargement | Messages textuels simples | États de chargement précédents |
| Création | Bouton sobre sans icône | Bouton et icône précédents, formulaire inchangé |

Les composants et styles créés uniquement pour le rapport institutionnel sont retirés, ainsi que son test navigateur spécifique. Les tests unitaires de présentation retrouvent leurs attentes antérieures. La projection `hierarchyLevels`, ajoutée uniquement pour le tableau du rapport, est retirée ; les relations, filtres et sources territoriales précédents restent en place.

Les corrections antérieures à cette refonte sont conservées : affiliations des entraîneurs, localisations des athlètes, navigation, écrans Coming soon, connexion et maintien du cadre dashboard en cas d’indisponibilité. Aucun changement des données Google Sheets, des permissions ou des schémas. Aucun push ni déploiement.

La conformité de la restauration est vérifiée par comparaison des dix fichiers rétablis avec leur version avant refonte, puis par les tests pertinents, le lint et le build.

Résultats : aucune différence Git sur les dix fichiers restaurés ; 26 tests ciblés réussis ; build de production réussi ; lint sans erreur avec deux avertissements préexistants. Vérification navigateur des composants réels avec fixtures de test : liste et fiche sur ordinateur/mobile, onglets Identification/Structure, cartes, logos et badges restaurés, absence de débordement de page et d’erreur JavaScript. Captures dans `.cache/federation-report-ui/restored-*.png`. Aucune écriture Google pendant ces contrôles.
