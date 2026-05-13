-- ============================================================
--  ELECTRIMADA — Schéma complet de la base de données MySQL
--  Généré à partir du code source du projet
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- ============================================================
-- 1. TABLE : Foyer
--    Représente un foyer (ménage) dans le village
-- ============================================================
CREATE TABLE IF NOT EXISTS Foyer (
    id                       VARCHAR(36)   NOT NULL,
    nom                      VARCHAR(255)  NOT NULL,
    type_priorite            ENUM('CRITIQUE','HAUTE','NORMALE','FAIBLE')
                                           NOT NULL DEFAULT 'NORMALE',
    jours_sans_electricite   INT           NOT NULL DEFAULT 0,
    consommation_historique  JSON          NOT NULL DEFAULT ('[]'),
    created_at               DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at               DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                                           ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 2. TABLE : Utilisateur
--    Comptes utilisateurs (responsable ou villageois)
-- ============================================================
CREATE TABLE IF NOT EXISTS Utilisateur (
    id         VARCHAR(36)               NOT NULL,
    username   VARCHAR(100)              NOT NULL,
    password   VARCHAR(255)              NOT NULL,  -- haché en production
    role       ENUM('RESPONSABLE','VILLAGEOIS','ADMIN')
                                         NOT NULL DEFAULT 'VILLAGEOIS',
    foyer_id   VARCHAR(36)              DEFAULT NULL,
    created_at DATETIME                 NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_username (username),
    CONSTRAINT fk_utilisateur_foyer
        FOREIGN KEY (foyer_id)
        REFERENCES Foyer (id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 3. TABLE : Batterie
--    Batteries de stockage d'énergie solaire du village
-- ============================================================
CREATE TABLE IF NOT EXISTS Batterie (
    id               INT UNSIGNED   NOT NULL AUTO_INCREMENT,
    capacite_totale  FLOAT          NOT NULL COMMENT 'Capacité totale en Wh',
    capacite_actuelle FLOAT         NOT NULL COMMENT 'Charge actuelle en Wh',
    seuil_critique   FLOAT          NOT NULL COMMENT 'Seuil d\'alerte en Wh',
    historique       JSON           NOT NULL DEFAULT ('[]'),
    created_at       DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP
                                    ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 4. TABLE : DemandeEnergie
--    Demandes d'électricité soumises par les foyers
-- ============================================================
CREATE TABLE IF NOT EXISTS DemandeEnergie (
    id               VARCHAR(36)                          NOT NULL,
    foyer_id         VARCHAR(36)                          NOT NULL,
    quantite_kwh     FLOAT                                NOT NULL,
    heure_souhaitee  DATETIME                             NOT NULL,
    niveau_criticite ENUM('CRITIQUE','HAUTE','NORMALE','FAIBLE')
                                                         NOT NULL,
    est_acceptee     TINYINT(1)                           NOT NULL DEFAULT 0,
    created_at       DATETIME                             NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME                             NOT NULL DEFAULT CURRENT_TIMESTAMP
                                                         ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_demande_foyer
        FOREIGN KEY (foyer_id)
        REFERENCES Foyer (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 5. TABLE : Rapport
--    Rapports journaliers / périodiques de consommation
-- ============================================================
CREATE TABLE IF NOT EXISTS Rapport (
    id                  VARCHAR(36)  NOT NULL,
    consommation_totale FLOAT        NOT NULL COMMENT 'kWh consommés sur la période',
    batterie_debut      FLOAT        NOT NULL COMMENT 'Niveau batterie en début de période (Wh)',
    batterie_fin        FLOAT        NOT NULL COMMENT 'Niveau batterie en fin de période (Wh)',
    alertes             JSON         NOT NULL DEFAULT ('[]'),
    created_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 6. TABLE : Rapport_Demande
--    Table de liaison Rapport ↔ DemandeEnergie (N:M)
-- ============================================================
CREATE TABLE IF NOT EXISTS Rapport_Demande (
    rapport_id VARCHAR(36) NOT NULL,
    demande_id VARCHAR(36) NOT NULL,
    PRIMARY KEY (rapport_id, demande_id),
    CONSTRAINT fk_rd_rapport
        FOREIGN KEY (rapport_id)
        REFERENCES Rapport (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_rd_demande
        FOREIGN KEY (demande_id)
        REFERENCES DemandeEnergie (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 7. TABLE : noeuds_reseau
--    Nœuds du réseau électrique (sources, jonctions, foyers)
--    Utilisés par l'algorithme de Dijkstra
-- ============================================================
CREATE TABLE IF NOT EXISTS noeuds_reseau (
    id         INT UNSIGNED  NOT NULL AUTO_INCREMENT,
    nom        VARCHAR(255)  NOT NULL,
    type       ENUM('SOURCE','JONCTION','FOYER','BATTERIE')
                             NOT NULL DEFAULT 'JONCTION',
    created_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_noeud_nom (nom)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 8. TABLE : connexions_reseau
--    Arêtes pondérées du réseau électrique (Dijkstra)
-- ============================================================
CREATE TABLE IF NOT EXISTS connexions_reseau (
    id              INT UNSIGNED  NOT NULL AUTO_INCREMENT,
    source_id       INT UNSIGNED  NOT NULL,
    destination_id  INT UNSIGNED  NOT NULL,
    perte_energie   FLOAT         NOT NULL DEFAULT 0
                                  COMMENT 'Perte en % ou en Wh sur ce tronçon',
    created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_connexion (source_id, destination_id),
    CONSTRAINT fk_conn_source
        FOREIGN KEY (source_id)
        REFERENCES noeuds_reseau (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_conn_dest
        FOREIGN KEY (destination_id)
        REFERENCES noeuds_reseau (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 9. TABLE : historique_meteo
--    Historique de production solaire et données météo
--    Alimenté par le service météo + cron
-- ============================================================
CREATE TABLE IF NOT EXISTS historique_meteo (
    id                   INT UNSIGNED  NOT NULL AUTO_INCREMENT,
    date_jour            DATE          NOT NULL,
    production_kwh       FLOAT         DEFAULT NULL,
    index_ensoleillement FLOAT         DEFAULT NULL
                                       COMMENT 'Indice 0-1 représentant l\'ensoleillement',
    created_at           DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_meteo_date (date_jour)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 10. TABLE : system_logs
--     Journal système applicatif (logger.js)
--     Accessible via GET /api/logs (admin seulement)
-- ============================================================
CREATE TABLE IF NOT EXISTS system_logs (
    id         INT UNSIGNED                             NOT NULL AUTO_INCREMENT,
    niveau     ENUM('INFO','WARNING','ERROR','SUCCESS')  NOT NULL DEFAULT 'INFO',
    message    TEXT                                     NOT NULL,
    meta       JSON                                     DEFAULT NULL,
    created_at DATETIME                                 NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_logs_niveau     (niveau),
    INDEX idx_logs_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- Réactivation des contraintes
-- ============================================================
SET FOREIGN_KEY_CHECKS = 1;
