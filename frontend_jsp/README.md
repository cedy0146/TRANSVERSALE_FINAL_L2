# EclectriDB — Frontend JSP

Système de gestion d'énergie solaire — Interface web en JSP/HTML/JS pur.

## Structure du projet

```
frontend_jsp/
├── css/
│   └── style.css           # Styles principaux (mode sombre/clair, animations)
├── js/
│   └── app.js              # JavaScript partagé (API, Toast, Auth, ThemeManager)
├── WEB-INF/
│   ├── web.xml             # Descripteur de déploiement Java EE / Jakarta EE
│   └── header.jspf         # Fragment JSP : navbar + sidebar (inclus dans chaque page)
├── login.jsp               # Page de connexion / inscription
├── dashboard.jsp           # Tableau de bord principal (KPI, batteries, demandes)
├── foyers.jsp              # Gestion CRUD des foyers
├── batteries.jsp           # Surveillance des batteries
├── demandes.jsp            # Demandes d'énergie (CRUD + acceptation)
├── allocation.jsp          # Algorithme Knapsack + prévision solaire
├── rapports.jsp            # Historique des rapports d'allocation
├── utilisateurs.jsp        # Gestion des comptes utilisateurs
├── error404.jsp            # Page d'erreur 404
└── README.md
```

## Déploiement

### Prérequis
- **Backend** : Node.js `>= 18` — lancez `npm install && node src/server.js` dans `/backend`
- **Base de données** : MySQL avec les tables `Foyer`, `Batterie`, `DemandeEnergie`, `Rapport`, `Utilisateur`, `Rapport_Demande`
- **Serveur d'applications** : Apache Tomcat 10+ ou tout serveur compatible Jakarta EE 5

### Étapes

1. **Démarrer le backend** :
   ```bash
   cd backend
   npm install
   node src/server.js
   # → http://localhost:3000
   ```

2. **Déployer le frontend** :
   - Copiez le dossier `frontend_jsp/` dans le répertoire `webapps/` de Tomcat
   - Renommez-le `eclectridb` → accessible sur `http://localhost:8080/eclectridb`
   - OU compilez un fichier `.war` :
     ```bash
     cd frontend_jsp && jar -cvf eclectridb.war .
     cp eclectridb.war $TOMCAT_HOME/webapps/
     ```

3. **Accéder à l'application** :
   - Login : `http://localhost:8080/eclectridb/login.jsp`

### Configuration API

L'URL du backend est définie dans `js/app.js` :
```javascript
const API_BASE = 'http://localhost:3000/api';
```
Modifiez cette valeur si le backend tourne sur un hôte/port différent.

## Fonctionnalités

| Page | Fonctionnalités |
|------|-----------------|
| Login | Connexion, inscription, validation mot de passe |
| Dashboard | KPI temps réel, état batteries, demandes en attente, graphique foyers |
| Foyers | CRUD complet, filtres par priorité, historique consommation |
| Batteries | Vue cartes + tableau, alertes seuil critique, auto-refresh 15s |
| Demandes | CRUD, filtres criticité/statut, acceptation rapide |
| Allocation | Knapsack, comparaison méthodes, prévision solaire (moyenne mobile) |
| Rapports | Lecture + suppression, détail alertes |
| Utilisateurs | Création via API auth, suppression, rôles RESPONSABLE/VILLAGEOIS |

## Critères IHM (Bastien & Scapin) respectés

- **Compatibilité** : Navigation calquée sur le flux métier réel (demande → allocation → rapport)
- **Homogénéité** : Design system cohérent (couleurs, typographie, espacement via CSS variables)
- **Concision** : Informations affichées au besoin (badges, tooltips), pas de surcharge visuelle
- **Pilotage** : L'utilisateur contrôle la navigation, boutons retour, filtres interactifs
- **Rétroaction** : Toast notifications sur chaque action (succès/erreur), spinners de chargement
- **Guidage** : Labels clairs, placeholders, messages d'erreur précis, états vides explicites
- **Flexibilité** : Mode sombre/clair, recherche et filtres, raccourcis clavier (Échap pour fermer modal)
- **Signifiance** : Icônes + texte sur tous les boutons et éléments de navigation
- **Assistance** : Messages d'erreur de l'API affichés directement à l'utilisateur

## Design

- **Thème** : Industriel / Futuriste — adapté à un système de gestion d'infrastructure énergétique
- **Polices** : Space Grotesk (interface) + JetBrains Mono (données numériques)
- **Animations** : fadeInUp au chargement, slideDown navbar, toasts, shimmer skeleton, progress bars
- **Mode sombre** (défaut) et **mode clair** — persisté en localStorage
