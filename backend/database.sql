-- ==========================================================
-- STRUCTURE POUR DIJKSTRA (Graphes)
-- ==========================================================
CREATE TABLE IF NOT EXISTS noeuds_reseau (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL UNIQUE,
    type ENUM('CENTRALE', 'VILLAGE', 'FOYER') DEFAULT 'VILLAGE'
);

CREATE TABLE IF NOT EXISTS connexions_reseau (
    id INT AUTO_INCREMENT PRIMARY KEY,
    source_id INT NOT NULL,
    destination_id INT NOT NULL,
    distance FLOAT NOT NULL, -- Utilisé comme "poids" pour Dijkstra
    FOREIGN KEY (source_id) REFERENCES noeuds_reseau(id) ON DELETE CASCADE,
    FOREIGN KEY (destination_id) REFERENCES noeuds_reseau(id) ON DELETE CASCADE
);

-- ==========================================================
-- STRUCTURE POUR KNAPSACK ET HEAP (Priorités et Optimisation)
-- ==========================================================
CREATE TABLE IF NOT EXISTS demandes_energie (
    id INT AUTO_INCREMENT PRIMARY KEY,
    description VARCHAR(255),
    consommation_requise FLOAT NOT NULL, -- "Weight" pour Knapsack
    priorite INT NOT NULL,             -- "Value" pour Knapsack et Priorité pour Heap
    statut ENUM('en_attente', 'acceptee', 'rejetee') DEFAULT 'en_attente',
    date_demande DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================================
-- STRUCTURE POUR SEGMENT TREE (Historique Temporel)
-- ==========================================================
CREATE TABLE IF NOT EXISTS consommation_historique (
    id INT AUTO_INCREMENT PRIMARY KEY,
    valeur FLOAT NOT NULL,
    date_heure DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================================
-- DONNÉES DE TEST POUR DIJKSTRA
-- ==========================================================
INSERT INTO noeuds_reseau (nom, type) VALUES ('Centrale', 'CENTRALE'), ('Village_A', 'VILLAGE'), ('Village_B', 'VILLAGE'), ('Village_C', 'VILLAGE');

INSERT INTO connexions_reseau (source_id, destination_id, distance) VALUES 
(1, 2, 5),  -- Centrale -> Village_A (5km)
(1, 3, 10), -- Centrale -> Village_B (10km)
(2, 3, 2),  -- Village_A -> Village_B (2km)
(2, 4, 8),  -- Village_A -> Village_C (8km)
(3, 4, 1);  -- Village_B -> Village_C (1km)