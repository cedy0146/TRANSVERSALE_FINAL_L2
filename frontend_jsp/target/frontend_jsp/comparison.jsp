<%@ page isELIgnored="true" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ include file="WEB-INF/header.jspf" %>

  <main class="main-content">

    <!-- En-tête simplifié -->
    <div class="page-header">
      <div>
        <h1 class="page-title">⚖️ Comparaison des Algorithmes</h1>
        <p class="page-subtitle">Knapsack DP vs FIFO — données en temps réel depuis la DB</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-outline btn-sm" onclick="loadComparison()">🔄 Actualiser</button>
        <button class="btn btn-primary" id="btn-run" onclick="runLiveComparison()">▶ Lancer comparaison live</button>
      </div>
    </div>

    <!-- Tableau comparatif — 4 colonnes max, sans "Coupures évitées" -->
    <div class="card" style="margin-bottom:20px;">
      <div class="card-header">
        <span class="card-title">📊 Comparatif des Méthodes</span>
        <span class="badge badge-amber" id="meta-badge">Source : DB</span>
      </div>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Algorithme</th>
              <th>Complexité</th>
              <th>Satisfaction</th>
              <th>Temps</th>
            </tr>
          </thead>
          <tbody id="comparison-tbody">
            <tr><td colspan="4" style="text-align:center;padding:32px;color:var(--c-text-3);">
              <span class="spin" style="display:inline-block">⟳</span> Chargement...
            </td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Section live — masquée par défaut -->
    <div id="live-section" style="display:none;">

      <!-- 3 KPIs clés uniquement -->
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px;" id="live-kpis"></div>

      <!-- Résumé côte à côte SANS donut — juste les chiffres importants -->
      <div class="grid-2" style="margin-bottom:20px;">

        <div class="card" style="border-top:3px solid var(--amber-400);">
          <div class="card-header">
            <span class="card-title">🎒 Knapsack DP</span>
            <span class="badge badge-green">Recommandé</span>
          </div>
          <div id="knapsack-summary"></div>
        </div>

        <div class="card" style="border-top:3px solid var(--warm-300);">
          <div class="card-header">
            <span class="card-title">📋 FIFO Naïf</span>
            <span class="badge badge-gray">Baseline</span>
          </div>
          <div id="fifo-summary"></div>
        </div>

      </div>

      <!-- Gain algorithmique condensé -->
      <div class="card" style="margin-bottom:20px;" id="gain-card">
        <div class="card-header">
          <span class="card-title">📈 Gain Algorithmique</span>
        </div>
        <div id="gain-content"></div>
      </div>

      <!-- UN seul tableau fusionné Knapsack vs FIFO -->
      <div class="card" style="padding:0;">
        <div class="card-header" style="padding:14px 20px;">
          <span class="card-title">✅ Demandes acceptées</span>
          <div style="display:flex;gap:8px;">
            <span class="badge badge-green">Knapsack : <span id="badge-knapsack-acc">0</span></span>
            <span class="badge badge-gray">FIFO : <span id="badge-fifo-acc">0</span></span>
          </div>
        </div>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID Foyer</th>
                <th>Quantité</th>
                <th>Criticité</th>
                <th>Utilité</th>
                <th style="text-align:center;">Knapsack</th>
                <th style="text-align:center;">FIFO</th>
              </tr>
            </thead>
            <tbody id="tbody-merged"></tbody>
          </table>
        </div>
      </div>

    </div>

  </main>

</div>
<div id="toast-container"></div>

<script src="js/app.js"></script>
<script>
Auth.guard();

async function loadComparison() {
  const tbody = document.getElementById('comparison-tbody');
  try {
    const data = await fetch(API_BASE + '/demo/comparison').then(r => r.json());
    if (!data.success) throw new Error(data.message);
    const meta = data.meta || {};
    document.getElementById('meta-badge').textContent =
      `${meta.snapshot?.reqCount ?? '?'} demandes · ${meta.snapshot?.capacity ?? '?'} kWh`;
    tbody.innerHTML = data.results.filter(r => r.name !== 'Égal (approx)').map(r => `
      <tr style="${r.best ? 'background:var(--amber-50);' : ''}">
        <td>
          <span style="font-weight:700;">${r.name}</span>
          ${r.best ? ' <span class="badge badge-amber" style="margin-left:4px;">⭐ Optimal</span>' : ''}
        </td>
        <td><span class="badge badge-purple" style="font-family:var(--mono);">${r.complexity}</span></td>
        <td>
          <div style="display:flex;align-items:center;gap:8px;">
            <div style="width:80px;height:6px;background:var(--c-surface-2);border-radius:3px;overflow:hidden;">
              <div style="height:100%;width:${r.satisfaction};background:${r.best ? '#f59e0b' : 'var(--warm-300)'};border-radius:3px;"></div>
            </div>
            <span style="font-family:var(--mono);font-size:.85rem;font-weight:600;">${r.satisfaction}</span>
          </div>
        </td>
        <td><span style="font-family:var(--mono);color:var(--c-text-3);">${r.time}</span></td>
      </tr>`).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:24px;color:var(--c-danger);">Erreur : ${err.message}</td></tr>`;
    Toast.error('Erreur chargement : ' + err.message);
  }
}

async function runLiveComparison() {
  setLoading('btn-run', true);
  document.getElementById('live-section').style.display = 'none';
  try {
    const data = await API.alloc.comparer();
    const opt = data.optimise || {}, naif = data.naif || {};
    const amelioration = data.amelioration_utilite_pct ?? 0;

    document.getElementById('live-section').style.display = 'block';

    // 3 KPIs
    document.getElementById('live-kpis').innerHTML = `
      <div style="background:var(--amber-50);padding:16px;border-radius:var(--radius-sm);border:1px solid var(--amber-200);text-align:center;">
        <div style="font-size:.69rem;color:var(--amber-600);text-transform:uppercase;font-weight:600;margin-bottom:4px;">Amélioration</div>
        <div style="font-family:var(--mono);font-size:2rem;font-weight:800;color:var(--amber-700);">+${amelioration}%</div>
      </div>
      <div style="background:var(--c-surface-2);padding:16px;border-radius:var(--radius-sm);border:1px solid var(--c-border);text-align:center;">
        <div style="font-size:.69rem;color:var(--c-text-3);text-transform:uppercase;font-weight:600;margin-bottom:4px;">Utilité Knapsack</div>
        <div style="font-family:var(--mono);font-size:2rem;font-weight:800;color:var(--green-600);">${opt.utilite_totale ?? '—'}</div>
      </div>
      <div style="background:var(--c-surface-2);padding:16px;border-radius:var(--radius-sm);border:1px solid var(--c-border);text-align:center;">
        <div style="font-size:.69rem;color:var(--c-text-3);text-transform:uppercase;font-weight:600;margin-bottom:4px;">Utilité FIFO</div>
        <div style="font-family:var(--mono);font-size:2rem;font-weight:800;color:var(--c-text-2);">${naif.utilite_totale ?? '—'}</div>
      </div>`;

    // Résumés sans donut
    renderSummary('knapsack-summary', opt);
    renderSummary('fifo-summary', naif);

    // Gain
    document.getElementById('gain-content').innerHTML = `
      <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;">
        <div style="flex:1;min-width:200px;font-size:.84rem;color:var(--c-text-2);line-height:1.8;">
          Knapsack gagne <strong style="color:var(--amber-600);">${amelioration}% d'utilité</strong>
          et sauvegarde <strong style="color:var(--amber-600);">${data.critiques_sauves_optimise ?? 0} demandes critiques</strong>
          contre ${data.critiques_sauves_naif ?? 0} pour le FIFO.<br>
          <span style="font-size:.79rem;color:var(--c-text-3);">
            Énergie — Knapsack : <strong style="font-family:var(--mono);">${fmt.kWh(opt.energie_utilisee_kwh ?? 0)}</strong>
            · FIFO : <strong style="font-family:var(--mono);">${fmt.kWh(naif.energie_utilisee_kwh ?? 0)}</strong>
          </span>
        </div>
        <div style="background:linear-gradient(135deg,var(--amber-50),var(--elec-50));border:1px solid var(--amber-200);padding:16px 24px;border-radius:var(--radius-sm);text-align:center;">
          <div style="font-size:.68rem;color:var(--c-text-3);text-transform:uppercase;font-weight:600;">Score recommandé</div>
          <div style="font-size:1.5rem;font-weight:800;color:var(--amber-700);font-family:var(--mono);">Knapsack DP</div>
          <div style="font-size:.73rem;color:var(--c-text-3);">O(n·W) — Prog. dynamique</div>
        </div>
      </div>`;

    // Tableau fusionné
    renderMergedTable(opt.acceptees || [], naif.acceptees || []);
    Toast.success('Comparaison terminée !');
  } catch (err) {
    Toast.error('Erreur : ' + err.message);
  } finally {
    setLoading('btn-run', false);
  }
}

function renderSummary(id, algo) {
  const acc = (algo.acceptees || []).length;
  const rej = (algo.rejetees || []).length;
  const total = acc + rej;
  const pct = total ? Math.round(acc / total * 100) : 0;
  const critiques = (algo.acceptees || []).filter(d => d.niveau_criticite === 'CRITIQUE').length;
  document.getElementById(id).innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;padding:12px 0 4px;">
      <div style="text-align:center;">
        <div style="font-size:.63rem;color:var(--c-text-3);text-transform:uppercase;font-weight:600;">Acceptées</div>
        <div style="font-family:var(--mono);font-size:1.6rem;font-weight:800;color:var(--green-600);">${acc}</div>
        <div style="font-size:.7rem;color:var(--c-text-3);">/ ${total}</div>
      </div>
      <div style="text-align:center;">
        <div style="font-size:.63rem;color:var(--c-text-3);text-transform:uppercase;font-weight:600;">Critiques</div>
        <div style="font-family:var(--mono);font-size:1.6rem;font-weight:800;color:var(--c-danger);">${critiques}</div>
      </div>
      <div style="text-align:center;">
        <div style="font-size:.63rem;color:var(--c-text-3);text-transform:uppercase;font-weight:600;">Énergie</div>
        <div style="font-family:var(--mono);font-size:1rem;font-weight:700;color:var(--amber-600);margin-top:6px;">${fmt.kWh(algo.energie_utilisee_kwh||0)}</div>
      </div>
    </div>
    <div style="height:6px;background:var(--c-surface-2);border-radius:3px;overflow:hidden;margin:8px 0 0;">
      <div style="height:100%;width:${pct}%;background:var(--amber-400);border-radius:3px;transition:width .4s;"></div>
    </div>
    <div style="font-size:.71rem;color:var(--c-text-3);margin-top:4px;">${pct}% de taux d'acceptation</div>`;
}

function renderMergedTable(knapsackList, fifoList) {
  // Construire un set de tous les foyer_id
  const allIds = new Set([
    ...knapsackList.map(d => d.foyer_id || d.id),
    ...fifoList.map(d => d.foyer_id || d.id)
  ]);
  const kMap = new Map(knapsackList.map(d => [d.foyer_id || d.id, d]));
  const fMap = new Map(fifoList.map(d => [d.foyer_id || d.id, d]));

  document.getElementById('badge-knapsack-acc').textContent = knapsackList.length;
  document.getElementById('badge-fifo-acc').textContent = fifoList.length;

  const critColors = { CRITIQUE: 'red', HAUTE: 'orange', NORMALE: 'amber', FAIBLE: 'green' };
  const tbody = document.getElementById('tbody-merged');

  if (!allIds.size) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--c-text-3);">Aucune demande</td></tr>';
    return;
  }

  // Trier : critiques en premier
  const sorted = [...allIds].sort((a, b) => {
    const ca = (kMap.get(a) || fMap.get(a))?.niveau_criticite || 'FAIBLE';
    const cb = (kMap.get(b) || fMap.get(b))?.niveau_criticite || 'FAIBLE';
    const order = { CRITIQUE:0, HAUTE:1, NORMALE:2, FAIBLE:3 };
    return (order[ca]??3) - (order[cb]??3);
  });

  tbody.innerHTML = sorted.map(id => {
    const d = kMap.get(id) || fMap.get(id);
    const inK = kMap.has(id), inF = fMap.has(id);
    const shortId = String(id).length > 10 ? String(id).substring(0,10) + '…' : id;
    return `<tr>
      <td style="font-family:var(--mono);font-size:.74rem;">${shortId}</td>
      <td style="font-family:var(--mono);">${fmt.kWh(d.quantite_kwh||0)}</td>
      <td><span class="badge badge-${critColors[d.niveau_criticite]||'gray'}">${d.niveau_criticite||'—'}</span></td>
      <td style="font-family:var(--mono);color:var(--amber-600);">${d.utilite??'—'}</td>
      <td style="text-align:center;font-size:1rem;">${inK ? '✅' : '<span style="color:var(--c-text-3);">—</span>'}</td>
      <td style="text-align:center;font-size:1rem;">${inF ? '✅' : '<span style="color:var(--c-text-3);">—</span>'}</td>
    </tr>`;
  }).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  Auth.guard();
  loadComparison();
});
</script>
</body>
</html>
