< %-- comparison.jsp --%>
<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ElectriMada - Comparaison des Méthodes d'Allocation</title>
    <!-- Inclure vos CSS ici -->
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <h1>Comparaison des Méthodes / Fampitahana ny fomba fizarana</h1>
    <p>Efficacité des algorithmes d'allocation / Fahomby ny fizarana herinaratra.</p>

    <div id="comparisonTable">
        <table>
            <thead>
                <tr>
                    <th>Algorithme / Algorithma</th>
                    <th>Complexité / Saro-pahasarotana</th>
                    <th>Satisfaction / Fahafaham-po</th>
                    <th>Temps / Fotoana (ms)</th>
                    <th>Coupures / Fahatapahana</th>
                </tr>
            </thead>
            <tbody id="comparison-data">
                <!-- Chargement dynamique... -->
            </tbody>
        </table>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', async () => {
            let tbody = document.getElementById('comparison-data');
            try {
                let response = await fetch('/api/demo/comparison');
                let data = await response.json();
                if (data.success) {
                    tbody.innerHTML = data.results.map(r => `
                        <tr style="${r.best ? 'background: #e1f5fe; font-weight: bold;' : ''}">
                            <td>${r.name}</td><td>${r.complexity}</td><td>${r.satisfaction}</td><td>${r.time}</td><td>${r.cuts}</td>
                        </tr>
                    `).join('');
                }
            } catch (err) {
                tbody.innerHTML = '<tr><td colspan="5">Erreur de chargement</td></tr>';
            }
        });
    </script>
</body>
</html>