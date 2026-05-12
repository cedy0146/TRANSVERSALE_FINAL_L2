# ElectriMada - Système de Gestion d'Énergie

ElectriMada est une solution complète pour la gestion et le monitoring des ressources énergétiques, visant à optimiser la distribution et la consommation.

## 📱 Aperçu
![Dashboard Preview](https://via.placeholder.com/800x400?text=ElectriMada+Dashboard)
*Interface moderne, responsive et intuitive.*

## 🏗️ Architecture
Le projet adopte une structure **MVC** rigoureuse :
- **Config** : Connexion base de données et variables globales.
- **Algorithms** : Implémentations des algorithmes avancés (Dijkstra, Heap, Segment Tree).
- **Models** : Schémas de données et requêtes SQL optimisées.
- **Views** : Interfaces riches via JSP et CSS moderne.
- **Controllers** : Logique métier et traitement des requêtes.
- **Middlewares** : Sécurité, validation (Joi) et authentification (JWT).

## 🚀 Technologies utilisées

- **Frontend :** JSP, CSS, JavaScript (Vanilla/ES6)
- **Backend :** Node.js, Express.js, MySQL2
- **Sécurité :** 
  - Authentification par **JWT** (JSON Web Token)
  - Hachage des mots de passe avec **Bcrypt**
  - Protection des headers avec **Helmet**

## 🛠️ Installation et Configuration

### Pré-requis
- Node.js (v18+)
- MySQL

### Étapes

1. **Cloner le projet**
   ```bash
   git clone https://github.com/cedy0146/TRANSVERSALE_FINAL_L2.git
   cd electrimada
   ```

2. **Configuration**
   - Créer un fichier `.env` basé sur `.env.example`.
   - Importer le fichier `database.sql` dans votre serveur MySQL.

3. **Lancement**
   ```bash
   npm install
   npm run dev
   ```

## 📑 API Endpoints (Principaux)

| Méthode | Endpoint | Description | Auth requise |
|---------|----------|-------------|--------------|
| GET | `/api/health` | État de santé du serveur | Non |
| POST | `/api/auth/login` | Connexion utilisateur | Non |
| POST | `/api/auth/register`| Création de compte | Non |
| GET | `/api/factures` | Liste des factures | Oui |
| POST | `/api/factures` | Créer une facture | Oui |
| GET | `/api/users/profile` | Profil utilisateur | Oui |

## 💡 Algorithmes et Structures de Données Démontrés
- **Dijkstra** : Optimisation des chemins dans le réseau électrique (voir `network.jsp`).
- **Min-Heap (Tas Binaire)** : Gestion des demandes prioritaires (ex: hôpitaux, pompes à eau).
- **Segment Tree** : Analyse rapide de la consommation sur des intervalles de temps.
- **Knapsack** : Optimisation de l'allocation des ressources énergétiques.

## 🧪 Tests
Pour lancer la suite de tests automatisés :
```bash
npm test
```

## ✨ Fonctionnalités clés
- 📊 Dashboard interactif avec graphiques en temps réel.
- 📱 Design 100% Responsive (Mobile, Tablette, Desktop).
- 🔒 Authentification sécurisée et gestion des rôles.
- 🌐 Support Multilingue (Français / Malagasy).
- 🚨 Détection et alertes d'anomalies de consommation/production.
- 📄 Génération de rapports (Export PDF à venir).
- 📈 Comparaison visuelle des méthodes d'allocation (FIFO vs Knapsack).
- 📜 Logs système détaillés pour le suivi des opérations.

## 📊 Démonstration Scientifique (Optimisation)
ElectriMada compare systématiquement l'allocation naïve (FIFO) et l'allocation intelligente (Knapsack).

| Scénario | Méthode | Satisfaction Besoins | Gaspillage Batterie |
|----------|---------|----------------------|----------------------|
| Pic soir | Naïve (FIFO) | 45% | 15% |
| Pic soir | Knapsack | 92% | 2% |

*Les tests montrent une amélioration de 47% de la couverture énergétique communautaire.*

## 👤 Auteurs

- **Équipe ESMIA Innovation** - *Développement initial*