# TODO - Changement id Utilisateur en AUTO_INCREMENT

- [ ] Mettre à jour la table MySQL Utilisateur: convertir `id` en INT AUTO_INCREMENT.
- [ ] Modifier `backend/src/models/Utilisateur.js` :
  - [ ] Retirer génération uuidv4()
  - [ ] Ne plus insérer `id` (laisser MySQL générer)
  - [ ] Retourner `result.insertId` au lieu de l’UUID.
- [ ] Vérifier les endpoints qui utilisent `:id` (UtilisateurController) : ils devraient continuer à marcher avec un id numérique.
- [ ] Mettre à jour tests Postman : utiliser un body register/login avec `username` + `password` au niveau racine.
- [ ] (Optionnel) Nettoyer `UNIQUE`/types si MySQL refuse la modification (selon contraintes existantes).

