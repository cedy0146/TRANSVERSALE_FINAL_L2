# EléctriMada - Mobile (Expo)

## Objectif
L’application mobile doit reproduire l’interface et les parcours du site `frontend_jsp` (offline-first + FR/MG).

## Lancement
```bash
cd mobile
npm install
npm start --web
```

## Structure
- `mobile/src/` : écrans, navigation, services API, i18n, stockage offline.
- La logique métier/algorithmes reste côté backend (Express).

## Notes
Le projet est conçu pour fonctionner même sans internet :
- lecture/écriture via stockage local (AsyncStorage)
- appels API opportunistes quand la connexion revient.

