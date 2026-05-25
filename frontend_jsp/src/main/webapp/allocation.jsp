<%@ page isELIgnored="true" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ include file="WEB-INF/header.jspf" %>

  <main class="main-content">

    <div class="page-header">
      <div>
        <h1 class="page-title">🎯 Allocation d'Énergie</h1>
        <p class="page-subtitle">Algorithme Knapsack — Distribution optimale de l'énergie solaire</p>
      </div>
    </div>

    <!-- Explications algo — version améliorée -->
    <div class="alert alert-info" style="margin-bottom:20px;">
      <span class="alert-icon">ℹ️</span>
      <div class="alert-body">
        <div class="alert-title" style="font-size:0.95rem;font-weight:700;margin-bottom:6px;">
          Algorithme Knapsack actif
        </div>
        <div class="alert-message" style="display:flex;flex-direction:column;gap:4px;">
          <span>Priorise les foyers selon <strong>leur criticité</strong>, <strong>leurs jours sans électricité</strong> et <strong>leur consommation historique</strong>.</span>
          <span style="color:var(--c-text-3);font-size:0.82rem;">Lancez une allocation pour distribuer l'énergie disponible dans les batteries aux demandes en attente.</span>
        </div>
      </div>
    </div>

    <!-- Actions principales -->
    <div class="grid-2" style="margin-bottom:24px;">

      <!-- Lancer allocation -->
      <div class="card" style="text-align:center;padding:32px;">
        <div style="font-size:48px;margin-bottom:16px;">⚡</div>
        <h3 style="font-size:1.1rem;font-weight:700;margin-bottom:8px;">Lancer l'Allocation</h3>
        <p style="font-size:0.875rem;color:var(--c-text-2);margin-bottom:20px;">
          Distribue l'énergie disponible aux foyers ayant des demandes en attente, en respectant les priorités.
        </p>
        <button class="btn btn-primary" id="btn-lancer" onclick="lancerAllocation()" style="padding:12px 32px;">
          ⚡ Lancer l'allocation
        </button>
      </div>

      <!-- Comparer méthodes -->
      <div class="card" style="text-align:center;padding:32px;">
        <div style="font-size:48px;margin-bottom:16px;">📊</div>
        <h3 style="font-size:1.1rem;font-weight:700;margin-bottom:8px;">Comparer les Méthodes</h3>
        <p style="font-size:0.875rem;color:var(--c-text-2);margin-bottom:20px;">
          Compare les algorithmes d'allocation (Knapsack vs autres) pour choisir la meilleure stratégie.
        </p>
        <button class="btn btn-outline" id="btn-comparer" onclick="comparerMethodes()" style="padding:12px 32px;">
          📊 Comparer les méthodes
        </button>
      </div>
    </div>

    <!-- Prévision solaire -->
    <div class="card" style="margin-bottom:20px;">
      <div class="card-header">
        <span class="card-title">☀️ Prévision Production Solaire</span>
      </div>
      <p style="font-size:0.875rem;color:var(--c-text-2);margin-bottom:16px;">
        Entrez l'historique de production solaire (kWh) pour obtenir une prévision via moyenne mobile.
      </p>
      <div style="display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap;">
        <div class="form-group" style="flex:1;min-width:220px;margin:0;">
          <label class="form-label">Historique de production (kWh, séparés par virgule)</label>
          <input type="text" class="form-control" id="historique-solaire"
                 placeholder="Ex: 8.5, 9.2, 7.8, 10.1, 9.5, 8.3">
        </div>
        <button class="btn btn-success" id="btn-prevision" onclick="lancerPrevision()" style="margin-bottom:1px;">
          ☀️ Calculer prévision
        </button>
      </div>
      <div id="prevision-result" style="margin-top:16px;display:none;"></div>
    </div>

    <!-- Résultats allocation -->
    <div id="allocation-result" style="display:none;"></div>

    <!-- Résultats comparaison -->
    <div id="comparaison-result" style="display:none;"></div>

  </main>

</div>
<div id="toast-container"></div>

<script src="js/app.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
<script>
Auth.guard();

let chartCompar = null;

async function lancerAllocation() {
  setLoading('btn-lancer', true);
  const resultEl = document.getElementById('allocation-result');
  resultEl.style.display = 'none';

  try {
    const result = await API.alloc.lancer();
    resultEl.style.display = 'block';
    renderAllocationResult(result);
    Toast.success('Allocation terminée avec succès !');
  } catch (err) {
    Toast.error('Erreur allocation: ' + err.message);
  } finally {
    setLoading('btn-lancer', false);
  }
}

function renderAllocationResult(result) {
  const el = document.getElementById('allocation-result');
  const acceptees = result.demandesAcceptees || result.accepted || [];
  const refusees  = result.demandesRefusees  || result.refused  || [];
  const batApres  = result.baterie_apres   || result.batterie_apres || '—';
  const batAvant  = result.batterie_avant  || '—';
  const totalAlloue = result.totalAlloue   || result.total_alloue || 0;

  el.innerHTML = `
    <div class="card fade-in" style="margin-bottom:16px;">
      <div class="card-header">
        <span class="card-title">✅ Résultat de l'Allocation</span>
        <span class="badge badge-green">${acceptees.length} demandes acceptées</span>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:20px;">
        <div style="background:var(--c-surface-2);padding:14px;border-radius:var(--radius-sm);text-align:center;">
          <div style="font-size:0.7rem;color:var(--c-text-3);text-transform:uppercase;letter-spacing:0.5px;">Demandes acceptées</div>
          <div style="font-size:1.8rem;font-weight:700;font-family:var(--mono);color:#10b981;">${acceptees.length}</div>
        </div>
        <div style="background:var(--c-surface-2);padding:14px;border-radius:var(--radius-sm);text-align:center;">
          <div style="font-size:0.7rem;color:var(--c-text-3);text-transform:uppercase;letter-spacing:0.5px;">Demandes refusées</div>
          <div style="font-size:1.8rem;font-weight:700;font-family:var(--mono);color:var(--c-danger);">${refusees.length}</div>
        </div>
        <div style="background:var(--c-surface-2);padding:14px;border-radius:var(--radius-sm);text-align:center;">
          <div style="font-size:0.7rem;color:var(--c-text-3);text-transform:uppercase;letter-spacing:0.5px;">Énergie allouée</div>
          <div style="font-size:1.8rem;font-weight:700;font-family:var(--mono);color:var(--c-accent);">${fmt.kWh(totalAlloue)}</div>
        </div>
      </div>

      <div style="background:var(--c-surface-2);padding:16px;border-radius:var(--radius-sm);margin-bottom:16px;">
        <div style="font-size:0.75rem;color:var(--c-text-3);text-transform:uppercase;margin-bottom:10px;">Flux d'énergie</div>
        <div class="energy-flow">
          <div class="energy-node">
            <div class="energy-node-circle" style="border-color:#f59e0b;color:#f59e0b;">☀️</div>
            <div style="font-size:0.75rem;margin-top:4px;">Production solaire</div>
          </div>
          <div class="energy-connector"></div>
          <div class="energy-node">
            <div class="energy-node-circle" style="border-color:var(--c-accent);color:var(--c-accent);">🔋</div>
            <div style="font-size:0.75rem;margin-top:4px;">Batterie</div>
            <div style="font-size:0.7rem;color:var(--c-text-3);">${fmt.wh(batApres)}</div>
          </div>
          <div class="energy-connector"></div>
          <div class="energy-node">
            <div class="energy-node-circle" style="border-color:#10b981;color:#10b981;">🏠</div>
            <div style="font-size:0.75rem;margin-top:4px;">${acceptees.length} foyers</div>
          </div>
        </div>
      </div>

      ${acceptees.length ? `
        <div>
          <div style="font-size:0.8rem;font-weight:600;color:var(--c-text-2);margin-bottom:8px;">DEMANDES ACCEPTÉES</div>
          ${acceptees.map(d => `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:var(--glow-green);border:1px solid rgba(34,211,160,0.2);border-radius:var(--radius-sm);margin-bottom:4px;">
              <span style="font-size:0.8rem;font-family:var(--mono);">${typeof d === 'object' ? (d.id || d.foyer_id || JSON.stringify(d)).substring(0,20) : String(d).substring(0,20)}</span>
              <span class="badge badge-green">✅ Allouée</span>
            </div>`).join('')}
        </div>` : ''}

      ${refusees.length ? `
        <div style="margin-top:12px;">
          <div style="font-size:0.8rem;font-weight:600;color:var(--c-text-2);margin-bottom:8px;">DEMANDES REFUSÉES (énergie insuffisante)</div>
          ${refusees.map(d => `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:rgba(255,86,86,0.08);border:1px solid rgba(255,86,86,0.2);border-radius:var(--radius-sm);margin-bottom:4px;">
              <span style="font-size:0.8rem;font-family:var(--mono);">${typeof d === 'object' ? (d.id || d.foyer_id || JSON.stringify(d)).substring(0,20) : String(d).substring(0,20)}</span>
              <span class="badge badge-red">❌ Refusée</span>
            </div>`).join('')}
        </div>` : ''}
    </div>
  `;
}

async function comparerMethodes() {
  setLoading('btn-comparer', true);
  const resultEl = document.getElementById('comparaison-result');
  resultEl.style.display = 'none';

  try {
    const result = await API.alloc.comparer();
    resultEl.style.display = 'block';
    renderComparaison(result);
    Toast.info('Comparaison terminée.');
  } catch (err) {
    Toast.error('Erreur comparaison: ' + err.message);
  } finally {
    setLoading('btn-comparer', false);
  }
}

function renderComparaison(result) {
  const el = document.getElementById('comparaison-result');
  const methods = result.methods || result.methodes || [];

  let content = `
    <div class="card fade-in">
      <div class="card-header">
        <span class="card-title">📊 Comparaison des Méthodes d'Allocation</span>
      </div>`;

  if (methods.length > 0) {
    content += `
      <canvas id="chart-comparaison" style="max-height:260px;margin-bottom:16px;"></canvas>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;">
        ${methods.map((m, i) => `
          <div style="padding:14px;background:var(--c-surface-2);border-radius:var(--radius-sm);border:1px solid var(--c-border);">
            <div style="font-weight:600;margin-bottom:8px;">${m.name || m.nom || 'Méthode ' + (i+1)}</div>
            <div style="font-family:var(--mono);font-size:1.4rem;font-weight:700;color:var(--c-accent);">${m.score || m.valeur || '—'}</div>
            <div style="font-size:0.75rem;color:var(--c-text-3);margin-top:4px;">${m.description || ''}</div>
          </div>`).join('')}
      </div>`;
  } else {
    content += `<pre style="background:var(--c-surface-2);padding:16px;border-radius:var(--radius-sm);font-size:0.8rem;overflow-x:auto;color:var(--c-text-2);">${JSON.stringify(result, null, 2)}</pre>`;
  }
  content += '</div>';
  el.innerHTML = content;

  if (methods.length > 0) {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const ctx = document.getElementById('chart-comparaison').getContext('2d');
    if (chartCompar) chartCompar.destroy();
    chartCompar = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: methods.map(m => m.name || m.nom || 'Méthode'),
        datasets: [{
          label: 'Score / Valeur',
          data: methods.map(m => m.score || m.valeur || 0),
          backgroundColor: ['#4a9eff','#22d3a0','#f5b820','#ff5656'],
          borderRadius: 6,
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: isDark ? '#8892a4' : '#4a5568' }, grid: { color: isDark ? '#1e2434' : '#e5eaf8' } },
          y: { ticks: { color: isDark ? '#8892a4' : '#4a5568' }, grid: { color: isDark ? '#1e2434' : '#e5eaf8' } }
        }
      }
    });
  }
}

async function lancerPrevision() {
  const input = document.getElementById('historique-solaire').value.trim();
  if (!input) { Toast.warning('Entrez des valeurs historiques.'); return; }

  const historique = input.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
  if (historique.length < 2) { Toast.warning('Entrez au moins 2 valeurs.'); return; }

  setLoading('btn-prevision', true);
  const resultEl = document.getElementById('prevision-result');
  try {
    const result = await API.alloc.previsionSolaire({ historique });
    resultEl.style.display = 'block';

    const prevision = result.prevision || result.prediction || result.forecast || result.valeur || result;
    resultEl.innerHTML = `
      <div class="alert alert-success">
        <span class="alert-icon">☀️</span>
        <div class="alert-body">
          <div class="alert-title">Prévision calculée (Moyenne Mobile)</div>
          <div class="alert-message">
            Production prévue : <strong style="font-family:var(--mono);font-size:1.1rem;">${typeof prevision === 'number' ? fmt.kWh(prevision) : JSON.stringify(prevision)}</strong>
            <br>Basé sur ${historique.length} valeurs historiques.
          </div>
        </div>
      </div>`;
    Toast.success('Prévision calculée !');
  } catch (err) {
    Toast.error('Erreur prévision: ' + err.message);
    resultEl.style.display = 'none';
  } finally {
    setLoading('btn-prevision', false);
  }
}
</script>
</body>
</html>
