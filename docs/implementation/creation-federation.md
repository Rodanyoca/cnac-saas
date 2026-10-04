# Création d’une fédération

La vue `/dashboard/federations` expose aux administrateurs disposant de `AUT-SPT` un volet de création. L’action `POST /api/federations` reçoit un formulaire multipart, valide les références et le logo, puis génère côté serveur les identifiants `RDCENTnnn` et `FEDnnn`.

L’opération téléverse d’abord le logo facultatif avec le mécanisme Drive commun, écrit ensuite `ENTITES`, puis `FEDERATIONS`, et relit les deux relations. En cas d’échec après une création partielle, la ligne `ENTITES` et le fichier nouvellement téléversé sont compensés. Le client conserve ses champs en cas de refus et ajoute immédiatement la représentation normalisée à la liste après succès.
