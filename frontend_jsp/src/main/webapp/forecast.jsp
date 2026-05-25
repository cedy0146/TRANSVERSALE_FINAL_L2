<%@ page isELIgnored="true" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ include file="WEB-INF/header.jspf" %>

  <main class="main-content">

    <div class="page-header">
      <div>
        <h1 class="page-title">☀️ Prévision Solaire</h1>
        <p class="page-subtitle">Estimation de la production de demain — Algorithme Moyenne Glissante · O(k)</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" id="btn-prevision" onclick="lancerPrevision()">▶ Calculer la prévision</button>
      </div>
    </div>

    <!-- Saisie historique -->
    <div class="card" style="margin-bottom:20px;">
      <div class="card-header">
        <span class="card-title">📅 Historique de production (kWh/jour)</span>
        <span class="badge badge-amber">7 derniers jours recommandés</span>
      </div>
      <p style="font-size:.82rem;color:var(--c-text-3);margin-bottom:14px;">
        Saisissez la production solaire des jours précédents (kWh). Séparez les valeurs par des virgules.
        <strong>Exemple :</strong> 4.2, 5.1, 3.8, 6.0, 5.5, 4.9, 5.3
      </p>
      <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end;">
        <div class="form-group" style="flex:1;min-width:260px;margin:0;">
          <label class="form-label">Historique (kWh séparés par virgules)</label>
          <input type="text" class="form-control" id="input-historique"
            placeholder="Ex: 4.2, 5.1, 3.8, 6.0, 5.5, 4.9, 5.3"
            value="4.2, 5.1, 3.8, 6.0, 5.5, 4.9, 5.3">
        </div>
        <div class="form-group" style="width:120px;margin:0;">
          <label class="form-label">Fenêtre (jours)</label>
          <input type="number" class="form-control" id="input-fenetre" value="7" min="2" max="30">
        </div>
        <div class="form-group" style="margin:0;">
          <label class="form-label">Méthode</label>
          <select class="form-control" id="input-methode">
            <option value="false">Moyenne simple</option>
            <option value="true">Moyenne pondérée</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Résultat — masqué par défaut -->
    <div id="result-section" style="display:none;">

      <!-- KPIs principaux -->
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px;" id="forecast-kpis"></div>

      <!-- Graphe historique + prévision -->
      <div class="grid-2" style="margin-bottom:20px;">

        <div class="card">
          <div class="card-header">
            <span class="card-title">📈 Historique & Prévision</span>
            <span class="badge badge-amber" id="badge-methode">—</span>
          </div>
          <div id="chart-container" style="padding:8px 0;">
            <svg id="forecast-chart" width="100%" height="180"></svg>
          </div>
          <div style="display:flex;gap:12px;margin-top:8px;flex-wrap:wrap;" id="chart-legend"></div>
        </div>

        <div class="card">
          <div class="card-header">
            <span class="card-title">🔋 Énergie disponible demain</span>
          </div>
          <div id="dispo-content" style="padding:8px 0;"></div>
        </div>

      </div>

      <!-- Tableau comparatif Baseline vs Pondérée -->
      <div class="card" style="margin-bottom:20px;">
        <div class="card-header">
          <span class="card-title">⚖️ Comparaison des méthodes — Baseline vs Optimisé</span>
          <span class="badge badge-purple" style="font-family:var(--mono);">O(k)</span>
        </div>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Méthode</th>
                <th>Estimation (kWh)</th>
                <th>Confiance</th>
                <th>Données utilisées</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody id="compare-tbody"></tbody>
          </table>
        </div>
      </div>

      <!-- Explication algorithmique — pour la démo prof -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">🧮 Détail algorithmique</span>
          <span class="badge badge-gray">Famille : Streaming / Fenêtrage</span>
        </div>
        <div id="algo-detail" style="font-size:.83rem;color:var(--c-text-2);line-height:1.8;"></div>
      </div>

    </div>

  </main>

</div>
<div id="toast-container"></div>
<script src="js/app.js"></script>
<script>
Auth.guard();

async function lancerPrevision() {
  const raw = document.getElementById('input-historique').value;
  const fenetre = parseInt(document.getElementById('input-fenetre').value) || 7;
  const ponderee = document.getElementById('input-methode').value === 'true';

  const historique = raw.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
  if (historique.length < 2) { Toast.warning('Entrez au moins 2 valeurs séparées par des virgules.'); return; }

  setLoading('btn-prevision', true);
  try {
    // Appel simple (méthode choisie)
    const res = await fetch(API_BASE + '/allocation/prevision-solaire', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ historique, options: { fenetre, ponderee } })
    }).then(r => r.json());

    // Appel baseline (moyenne simple) pour comparaison
    const resBaseline = await fetch(API_BASE + '/allocation/prevision-solaire', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ historique, options: { fenetre, ponderee: false } })
    }).then(r => r.json());

    // Appel pondéré pour comparaison
    const resPondere = await fetch(API_BASE + '/allocation/prevision-solaire', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ historique, options: { fenetre, ponderee: true } })
    }).then(r => r.json());

    // Batterie pour calcul disponible
    let batteries = [];
    try { batteries = await API.batteries.getAll(); } catch(e) {}
    const bat = batteries[0] || { capacite_actuelle: 0, capacite_totale: 10000, seuil_critique: 1000 };

    document.getElementById('result-section').style.display = 'block';
    renderKpis(res, bat);
    renderChart(historique, res);
    renderDispo(res, bat);
    renderCompare(resBaseline, resPondere, ponderee);
    renderAlgoDetail(historique, fenetre, res);

    document.getElementById('badge-methode').textContent =
      ponderee ? 'Pondérée (optimisée)' : 'Simple (baseline)';

    Toast.success('Prévision calculée !');
  } catch (err) {
    Toast.error('Erreur : ' + err.message);
  } finally {
    setLoading('btn-prevision', false);
  }
}

function renderKpis(res, bat) {
  const pct = res.confiance_pct ?? 0;
  const confColor = pct >= 70 ? 'var(--green-600)' : pct >= 40 ? 'var(--amber-600)' : 'var(--c-danger)';
  document.getElementById('forecast-kpis').innerHTML = `
    <div style="background:var(--amber-50);padding:16px;border-radius:var(--radius-sm);border:1px solid var(--amber-200);text-align:center;">
      <div style="font-size:.69rem;color:var(--amber-600);text-transform:uppercase;font-weight:600;margin-bottom:4px;">Estimation demain</div>
      <div style="font-family:var(--mono);font-size:2rem;font-weight:800;color:var(--amber-700);">${res.estimation_kwh ?? '—'} kWh</div>
      <div style="font-size:.72rem;color:var(--c-text-3);margin-top:4px;">[ ${res.min_kwh} – ${res.max_kwh} kWh ]</div>
    </div>
    <div style="background:var(--c-surface-2);padding:16px;border-radius:var(--radius-sm);border:1px solid var(--c-border);text-align:center;">
      <div style="font-size:.69rem;color:var(--c-text-3);text-transform:uppercase;font-weight:600;margin-bottom:4px;">Confiance</div>
      <div style="font-family:var(--mono);font-size:2rem;font-weight:800;color:${confColor};">${pct}%</div>
      <div style="font-size:.72rem;color:var(--c-text-3);margin-top:4px;">écart-type : ${res.ecart_type ?? '—'} kWh</div>
    </div>
    <div style="background:var(--c-surface-2);padding:16px;border-radius:var(--radius-sm);border:1px solid var(--c-border);text-align:center;">
      <div style="font-size:.69rem;color:var(--c-text-3);text-transform:uppercase;font-weight:600;margin-bottom:4px;">Données utilisées</div>
      <div style="font-family:var(--mono);font-size:2rem;font-weight:800;color:var(--c-text-1);">${res.donnees_utilisees ?? '—'}</div>
      <div style="font-size:.72rem;color:var(--c-text-3);margin-top:4px;">sur ${document.getElementById('input-historique').value.split(',').length} saisies</div>
    </div>`;
}

function renderChart(historique, res) {
  const svg = document.getElementById('forecast-chart');
  const W = svg.parentElement.offsetWidth || 400;
  const H = 180;
  const pad = { l: 40, r: 20, t: 16, b: 30 };
  const allVals = [...historique, res.estimation_kwh, res.max_kwh];
  const maxV = Math.max(...allVals) * 1.1;
  const minV = 0;
  const n = historique.length + 1; // +1 pour prévision
  const xStep = (W - pad.l - pad.r) / (n - 1);
  const yScale = v => H - pad.b - ((v - minV) / (maxV - minV)) * (H - pad.t - pad.b);

  let content = '';

  // Zone d'incertitude (min-max prévision)
  const xLast = pad.l + (n - 1) * xStep;
  const yMin = yScale(res.min_kwh), yMax = yScale(res.max_kwh);
  content += `<rect x="${xLast - 12}" y="${yMax}" width="24" height="${yMin - yMax}" fill="var(--amber-400)" opacity="0.2" rx="3"/>`;

  // Ligne historique
  const pts = historique.map((v, i) => `${pad.l + i * xStep},${yScale(v)}`).join(' ');
  content += `<polyline points="${pts}" fill="none" stroke="#a8a29e" stroke-width="2" stroke-dasharray="5,3"/>`;

  // Ligne vers prévision
  const xPrev = pad.l + (historique.length) * xStep;
  const lastPt = `${pad.l + (historique.length - 1) * xStep},${yScale(historique[historique.length - 1])}`;
  content += `<line x1="${lastPt.split(',')[0]}" y1="${lastPt.split(',')[1]}" x2="${xPrev}" y2="${yScale(res.estimation_kwh)}" stroke="var(--amber-400)" stroke-width="2.5"/>`;

  // Points historique
  historique.forEach((v, i) => {
    content += `<circle cx="${pad.l + i * xStep}" cy="${yScale(v)}" r="4" fill="#a8a29e"/>`;
    content += `<text x="${pad.l + i * xStep}" y="${H - 8}" text-anchor="middle" font-size="9" fill="var(--c-text-3)">J-${historique.length - i}</text>`;
  });

  // Point prévision
  content += `<circle cx="${xPrev}" cy="${yScale(res.estimation_kwh)}" r="6" fill="var(--amber-400)" stroke="white" stroke-width="2"/>`;
  content += `<text x="${xPrev}" y="${yScale(res.estimation_kwh) - 10}" text-anchor="middle" font-size="10" font-weight="700" fill="var(--amber-600)">${res.estimation_kwh}</text>`;
  content += `<text x="${xPrev}" y="${H - 8}" text-anchor="middle" font-size="9" fill="var(--amber-600)" font-weight="600">Dem.</text>`;

  // Axe Y
  [0, maxV / 2, maxV].forEach(v => {
    const y = yScale(v);
    content += `<line x1="${pad.l - 4}" y1="${y}" x2="${W - pad.r}" y2="${y}" stroke="var(--c-border)" stroke-width="1"/>`;
    content += `<text x="${pad.l - 6}" y="${y + 4}" text-anchor="end" font-size="9" fill="var(--c-text-3)">${v.toFixed(1)}</text>`;
  });

  svg.innerHTML = content;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

  document.getElementById('chart-legend').innerHTML = `
    <div style="display:flex;align-items:center;gap:6px;font-size:.75rem;color:var(--c-text-3);">
      <div style="width:20px;height:2px;background:#a8a29e;border-radius:1px;border-top:2px dashed #a8a29e;"></div> Historique
    </div>
    <div style="display:flex;align-items:center;gap:6px;font-size:.75rem;color:var(--amber-600);">
      <div style="width:10px;height:10px;border-radius:50%;background:var(--amber-400);"></div> Prévision J+1
    </div>
    <div style="display:flex;align-items:center;gap:6px;font-size:.75rem;color:var(--c-text-3);">
      <div style="width:14px;height:10px;background:var(--amber-400);opacity:.2;border-radius:2px;"></div> Intervalle de confiance
    </div>`;
}

function renderDispo(res, bat) {
  const prodWh = res.estimation_kwh * 1000;
  const chargeApres = Math.min(bat.capacite_totale, bat.capacite_actuelle + prodWh);
  const disponible = Math.max(0, chargeApres - (bat.seuil_critique || 0));
  const pct = bat.capacite_totale > 0 ? Math.round(chargeApres / bat.capacite_totale * 100) : 0;

  document.getElementById('dispo-content').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px;">
      <div style="background:var(--c-surface-2);padding:12px;border-radius:var(--radius-sm);text-align:center;">
        <div style="font-size:.65rem;color:var(--c-text-3);text-transform:uppercase;font-weight:600;">Batterie actuelle</div>
        <div style="font-family:var(--mono);font-size:1.3rem;font-weight:800;color:var(--amber-600);">${fmt.wh(bat.capacite_actuelle)}</div>
      </div>
      <div style="background:var(--c-surface-2);padding:12px;border-radius:var(--radius-sm);text-align:center;">
        <div style="font-size:.65rem;color:var(--c-text-3);text-transform:uppercase;font-weight:600;">Après production</div>
        <div style="font-family:var(--mono);font-size:1.3rem;font-weight:800;color:var(--green-600);">${fmt.wh(chargeApres)}</div>
      </div>
    </div>
    <div style="margin-bottom:8px;">
      <div style="display:flex;justify-content:space-between;font-size:.75rem;margin-bottom:4px;">
        <span style="color:var(--c-text-3);">Charge estimée demain</span>
        <span style="font-weight:700;color:var(--amber-600);">${pct}%</span>
      </div>
      <div style="height:8px;background:var(--c-surface-2);border-radius:4px;overflow:hidden;">
        <div style="height:100%;width:${pct}%;background:var(--amber-400);border-radius:4px;transition:width .4s;"></div>
      </div>
    </div>
    <div style="background:var(--amber-50);border:1px solid var(--amber-200);border-radius:var(--radius-sm);padding:12px;text-align:center;">
      <div style="font-size:.65rem;color:var(--amber-600);text-transform:uppercase;font-weight:600;margin-bottom:4px;">Énergie distribuable</div>
      <div style="font-family:var(--mono);font-size:1.6rem;font-weight:800;color:var(--amber-700);">${fmt.wh(disponible)}</div>
      <div style="font-size:.72rem;color:var(--c-text-3);margin-top:2px;">après seuil critique réservé</div>
    </div>`;
}

function renderCompare(baseline, pondere, isPondereSelected) {
  document.getElementById('compare-tbody').innerHTML = `
    <tr style="${!isPondereSelected ? 'background:var(--amber-50);' : ''}">
      <td>
        <span style="font-weight:700;">Moyenne Simple</span>
        ${!isPondereSelected ? ' <span class="badge badge-amber" style="margin-left:4px;">⭐ Sélectionnée</span>' : ''}
        <div style="font-size:.72rem;color:var(--c-text-3);">Baseline — tous les jours ont le même poids</div>
      </td>
      <td><span style="font-family:var(--mono);font-weight:700;">${baseline.estimation_kwh} kWh</span></td>
      <td>
        <div style="display:flex;align-items:center;gap:8px;">
          <div style="width:60px;height:5px;background:var(--c-surface-2);border-radius:3px;overflow:hidden;">
            <div style="height:100%;width:${baseline.confiance_pct}%;background:#a8a29e;border-radius:3px;"></div>
          </div>
          <span style="font-family:var(--mono);font-size:.83rem;">${baseline.confiance_pct}%</span>
        </div>
      </td>
      <td style="font-family:var(--mono);">${baseline.donnees_utilisees}</td>
      <td><span class="badge badge-gray">Baseline</span></td>
    </tr>
    <tr style="${isPondereSelected ? 'background:var(--amber-50);' : ''}">
      <td>
        <span style="font-weight:700;">Moyenne Pondérée</span>
        ${isPondereSelected ? ' <span class="badge badge-amber" style="margin-left:4px;">⭐ Sélectionnée</span>' : ''}
        <div style="font-size:.72rem;color:var(--c-text-3);">Optimisée — les jours récents ont plus de poids</div>
      </td>
      <td><span style="font-family:var(--mono);font-weight:700;">${pondere.estimation_kwh} kWh</span></td>
      <td>
        <div style="display:flex;align-items:center;gap:8px;">
          <div style="width:60px;height:5px;background:var(--c-surface-2);border-radius:3px;overflow:hidden;">
            <div style="height:100%;width:${pondere.confiance_pct}%;background:var(--amber-400);border-radius:3px;"></div>
          </div>
          <span style="font-family:var(--mono);font-size:.83rem;">${pondere.confiance_pct}%</span>
        </div>
      </td>
      <td style="font-family:var(--mono);">${pondere.donnees_utilisees}</td>
      <td><span class="badge badge-green">✅ Optimisé</span></td>
    </tr>`;
}

function renderAlgoDetail(historique, fenetre, res) {
  const recentes = historique.slice(-fenetre);
  const moy = recentes.length > 0 ? recentes.reduce((s,v) => s+v, 0) / recentes.length : 0;
  document.getElementById('algo-detail').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
      <div>
        <div style="font-weight:700;color:var(--c-text-1);margin-bottom:6px;">Famille : Streaming / Fenêtrage</div>
        <div style="margin-bottom:4px;">Algorithme : <strong>Moyenne Glissante (Moving Average)</strong></div>
        <div style="margin-bottom:4px;">Complexité temps : <span style="font-family:var(--mono);background:var(--c-surface-2);padding:2px 6px;border-radius:4px;">O(k)</span> — k = taille de la fenêtre</div>
        <div style="margin-bottom:4px;">Complexité mémoire : <span style="font-family:var(--mono);background:var(--c-surface-2);padding:2px 6px;border-radius:4px;">O(k)</span></div>
        <div style="margin-top:10px;font-size:.79rem;color:var(--c-text-3);">
          Fenêtre utilisée : <strong>${fenetre} jours</strong><br>
          Valeurs valides : <strong>${res.donnees_utilisees}</strong> / ${historique.length}<br>
          Méthode : <strong>${res.methode}</strong>
        </div>
      </div>
      <div>
        <div style="font-weight:700;color:var(--c-text-1);margin-bottom:6px;">Calcul effectué</div>
        <div style="font-family:var(--mono);font-size:.79rem;background:var(--c-surface-2);padding:12px;border-radius:var(--radius-sm);line-height:1.8;">
          Données : [ ${recentes.join(', ')} ]<br>
          Somme : ${recentes.reduce((s,v)=>s+v,0).toFixed(2)} kWh<br>
          Moyenne : ${moy.toFixed(3)} kWh<br>
          Estimation : <strong style="color:var(--amber-600);">${res.estimation_kwh} kWh</strong><br>
          Confiance : ${res.confiance_pct}%
        </div>
        <div style="margin-top:10px;font-size:.79rem;color:var(--c-text-3);">
          Plan B actif si données manquantes → valeur par défaut : 5.0 kWh
        </div>
      </div>
    </div>`;
}

document.addEventListener('DOMContentLoaded', () => {
  Auth.guard();
});
</script>
</body>
</html>
