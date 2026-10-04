# Historique sportif de la fiche Athlète

La fiche Athlète présente chaque équipe nationale une seule fois, selon son identifiant stable. Les campagnes constituent l’historique des sélections, tandis que les participations effectives sont affichées séparément par compétition et programme.

La participation est résolue uniquement par la chaîne `sélection → participation → engagement → programme → compétition`. Une sélection sans participation reste visible et n’est jamais interprétée comme une présence effective. Les doublons techniques sont éliminés par `id_participation_acteur` ; des participations distinctes restent des lignes distinctes.

Les activités ne sont plus présentées dans la fiche détaillée d’un athlète. Cette décision d’interface ne supprime ni les activités ni les participations aux activités du modèle général. Aucun classeur, en-tête ou contenu Google Sheets n’est modifié par cette fonctionnalité de lecture.
