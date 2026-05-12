<%-- network.jsp --%>
<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ElectriMada - Réseau Électrique</title>
    <!-- Inclure vos CSS ici -->
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <div class="app-layout">
        <main class="main-content">
            <div class="page-header">
                <div>
                    <h1 class="page-title">🗺️ Réseau Électrique (Dijkstra)</h1>
                    <p class="page-subtitle">Optimisation du routage de l'énergie entre les nœuds</p>
                </div>
                <button class="btn btn-primary" onclick="calculatePath()">⚡ Calculer Chemin Optimal</button>
            </div>

            <div class="grid-2">
                <div class="card">
                    <div class="card-header"><span class="card-title">Topologie du Réseau</span></div>
                    <div id="networkGraph" style="height: 300px; display: flex; align-items: center; justify-content: center; background: var(--bg-secondary); border-radius: var(--radius-sm);">
                        <p class="text-muted">Graphique interactif en attente</p>
                    </div>
                </div>

                <div class="card" id="path-result-card" style="display:none;">
                    <div class="card-header">
                        <span class="card-title">Résultat de l'Optimisation</span>
                    </div>
                    <div class="stat-value" id="path-distance">0 km</div>
                    <div id="path-visualizer" style="margin-top:20px;"></div>
                </div>
            </div>
        </main>
    </div>

    <script src="js/app.js"></script>
    <script>
        async function calculatePath() {
            try {
                let data = await fetch('/api/demo/dijkstra').then(r => r.json());
                if(data.success) {
                    document.getElementById('path-result-card').style.display = 'block';
                    document.getElementById('path-distance').textContent = data.result.distance + " km";
                    document.getElementById('path-visualizer').textContent = "Chemin: " + data.result.path.join(' → ');
                }
            } catch (err) {
                console.error("Erreur Dijkstra:", err);
            }
        }
    </script>
</body>
</html>