<%@ page isELIgnored="true" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ include file="WEB-INF/header.jspf" %>

  <main class="main-content">

    <div class="page-header">
      <div>
        <h1 class="page-title">🗺️ Réseau Électrique — Dijkstra</h1>
        <p class="page-subtitle">Chemin optimal de distribution d'énergie entre les nœuds du village</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-outline btn-sm" onclick="loadNetwork()">🔄 Actualiser</button>
        <button class="btn btn-primary" id="btn-calc" onclick="calculatePath()">⚡ Calculer Chemin Optimal</button>
      </div>
    </div>

    <!-- Explication algorithme -->
    <div class="alert alert-info" style="margin-bottom:20px;">
      <span class="alert-icon">ℹ️</span>
      <div class="alert-body">
        <div class="alert-title">Algorithme de Dijkstra — Routage d'énergie</div>
        <div class="alert-message">
          Trouve le chemin de distribution d'énergie à <strong>coût minimal</strong> entre les nœuds du réseau électrique du village.
          Les nœuds et connexions sont chargés depuis la base de données MySQL (<code>noeuds_reseau</code>, <code>connexions_reseau</code>).
          Complexité : <strong>O((V + E) log V)</strong>.
        </div>
      </div>
    </div>

    <!-- Sélection source / destination depuis DB -->
    <div class="card" style="margin-bottom:20px;">
      <div class="card-header">
        <span class="card-title">⚙️ Paramètres de Calcul</span>
        <span class="badge badge-purple">Données DB</span>
      </div>
      <div style="display:flex;gap:16px;flex-wrap:wrap;align-items:flex-end;">
        <div class="form-group" style="flex:1;min-width:160px;margin:0;">
          <label class="form-label">Nœud source</label>
          <select class="form-control" id="select-source">
            <option value="">Chargement...</option>
          </select>
        </div>
        <div style="font-size:1.5rem;padding-bottom:4px;">→</div>
        <div class="form-group" style="flex:1;min-width:160px;margin:0;">
          <label class="form-label">Nœud destination</label>
          <select class="form-control" id="select-dest">
            <option value="">Chargement...</option>
          </select>
        </div>
        <button class="btn btn-primary" onclick="calculatePath()" style="margin-bottom:1px;">
          ⚡ Calculer
        </button>
      </div>
    </div>

    <!-- Visualisation réseau + résultat -->
    <div class="grid-2" style="margin-bottom:20px;">

      <!-- Graphe SVG dynamique -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">🌐 Topologie du Réseau</span>
          <span class="badge badge-blue" id="node-count">0 nœuds</span>
        </div>
        <div id="network-graph" style="width:100%;height:320px;position:relative;background:var(--bg-secondary);border-radius:var(--radius-sm);overflow:hidden;">
          <div id="graph-placeholder" style="display:flex;height:100%;align-items:center;justify-content:center;color:var(--text-muted);flex-direction:column;gap:8px;">
            <span style="font-size:2rem;">🗺️</span>
            <span style="font-size:0.875rem;">Chargement du graphe depuis la DB...</span>
          </div>
          <svg id="graph-svg" width="100%" height="100%" style="display:none;position:absolute;top:0;left:0;"></svg>
        </div>
      </div>

      <!-- Résultat Dijkstra -->
      <div class="card" id="result-card">
        <div class="card-header">
          <span class="card-title">📍 Résultat du Calcul</span>
          <span class="badge badge-gray" id="result-badge">En attente</span>
        </div>
        <div id="result-placeholder" style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:240px;color:var(--text-muted);gap:8px;">
          <span style="font-size:2.5rem;">⚡</span>
          <span style="font-size:0.875rem;">Lancez le calcul pour voir le chemin optimal</span>
        </div>
        <div id="result-content" style="display:none;">
          <div style="text-align:center;padding:16px 0;">
            <div style="font-size:0.75rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;">Distance / Coût total</div>
            <div class="stat-value" id="path-distance" style="font-size:2rem;color:var(--accent-blue);">—</div>
          </div>
          <div style="background:var(--bg-secondary);border-radius:var(--radius-sm);padding:16px;">
            <div style="font-size:0.75rem;color:var(--text-muted);text-transform:uppercase;margin-bottom:12px;">Chemin optimal</div>
            <div id="path-steps"></div>
          </div>
          <div id="path-metrics" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px;"></div>
        </div>
      </div>
    </div>

    <!-- Tableau des connexions depuis DB -->
    <div class="card" style="padding:0;">
      <div class="card-header" style="padding:16px 20px;">
        <span class="card-title">🔗 Connexions du Réseau (DB)</span>
        <span class="badge badge-blue" id="edge-count">0 connexions</span>
      </div>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Source</th>
              <th>Destination</th>
              <th>Distance / Coût</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody id="edges-tbody">
            <tr><td colspan="4" style="text-align:center;padding:32px;color:var(--text-muted);">
              <span class="spin" style="display:inline-block">⟳</span> Chargement depuis la base de données...
            </td></tr>
          </tbody>
        </table>
      </div>
    </div>

  </main>

</div>
<div id="toast-container"></div>

<script src="js/app.js"></script>
<script>
Auth.guard();

let graphData = { nodes: [], edges: [] };
let highlightPath = [];

// ── Chargement initial depuis la DB via /api/demo/dijkstra ──────────────────
async function loadNetwork() {
  try {
    const data = await fetch(API_BASE + '/demo/dijkstra').then(r => r.json());
    if (!data.success) throw new Error(data.message || 'Erreur API');

    // Extraire nœuds uniques depuis les liens
    const nodeSet = new Set();
    const edges = data.graph_visual || [];
    edges.forEach(e => { nodeSet.add(e.source); nodeSet.add(e.target); });
    const nodes = Array.from(nodeSet);

    graphData = { nodes, edges };

    // Remplir les selects
    const selSrc  = document.getElementById('select-source');
    const selDest = document.getElementById('select-dest');
    [selSrc, selDest].forEach(sel => {
      sel.innerHTML = nodes.map(n => `<option value="${n}">${n}</option>`).join('');
    });
    // Pré-sélectionner source/dest différents
    if (nodes.length > 1) selDest.value = nodes[nodes.length - 1];

    document.getElementById('node-count').textContent = nodes.length + ' nœuds';
    document.getElementById('edge-count').textContent = edges.length + ' connexions';

    renderGraphSVG(nodes, edges, []);
    renderEdgesTable(edges);

  } catch (err) {
    Toast.error('Erreur chargement réseau : ' + err.message);
    document.getElementById('graph-placeholder').innerHTML = `
      <span style="font-size:2rem;">⚠️</span>
      <span style="font-size:0.875rem;color:var(--accent-red);">Impossible de charger les nœuds DB</span>
      <span style="font-size:0.75rem;color:var(--text-muted);">Vérifiez que les tables <code>noeuds_reseau</code> et <code>connexions_reseau</code> existent</span>`;
  }
}

// ── Calcul Dijkstra via API (données DB) ────────────────────────────────────
async function calculatePath() {
  const src  = document.getElementById('select-source').value;
  const dest = document.getElementById('select-dest').value;
  if (!src || !dest) { Toast.warning('Sélectionnez source et destination.'); return; }
  if (src === dest)  { Toast.warning('Source et destination doivent être différents.'); return; }

  setLoading('btn-calc', true);
  try {
    const url = `${API_BASE}/demo/dijkstra?start=${encodeURIComponent(src)}&end=${encodeURIComponent(dest)}`;
    const data = await fetch(url).then(r => r.json());
    if (!data.success) throw new Error(data.message || 'Erreur API');

    const { distance, path } = data.result;
    highlightPath = path || [];

    // Mettre à jour l'affichage
    document.getElementById('result-placeholder').style.display = 'none';
    document.getElementById('result-content').style.display     = 'block';
    document.getElementById('result-badge').textContent = '✅ Calculé';
    document.getElementById('result-badge').className   = 'badge badge-green';

    document.getElementById('path-distance').textContent =
      distance === Infinity ? '∞ (inaccessible)' : distance + ' u.';

    // Étapes du chemin
    const stepsEl = document.getElementById('path-steps');
    if (path && path.length > 0) {
      stepsEl.innerHTML = path.map((node, i) => `
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
          <div style="width:26px;height:26px;border-radius:50%;background:${i === 0 ? 'var(--accent-blue)' : i === path.length-1 ? 'var(--accent-green)' : 'var(--accent-yellow)'};
               display:flex;align-items:center;justify-content:center;font-size:0.7rem;font-weight:700;color:#fff;flex-shrink:0;">${i+1}</div>
          <div style="font-family:var(--font-mono);font-size:0.875rem;font-weight:600;">${node}</div>
          ${i === 0 ? '<span class="badge badge-blue">Source</span>' : i === path.length-1 ? '<span class="badge badge-green">Dest.</span>' : ''}
          ${i < path.length-1 ? '<div style="margin-left:auto;color:var(--text-muted);font-size:0.75rem;">↓</div>' : ''}
        </div>`).join('');
    } else {
      stepsEl.innerHTML = '<div style="color:var(--accent-red);font-size:0.875rem;">Aucun chemin trouvé</div>';
    }

    // Métriques
    document.getElementById('path-metrics').innerHTML = `
      <div style="background:var(--bg-secondary);padding:12px;border-radius:var(--radius-sm);text-align:center;">
        <div style="font-size:0.7rem;color:var(--text-muted);text-transform:uppercase;">Nœuds traversés</div>
        <div style="font-family:var(--font-mono);font-size:1.4rem;font-weight:700;color:var(--accent-blue);">${path ? path.length : 0}</div>
      </div>
      <div style="background:var(--bg-secondary);padding:12px;border-radius:var(--radius-sm);text-align:center;">
        <div style="font-size:0.7rem;color:var(--text-muted);text-transform:uppercase;">Complexité</div>
        <div style="font-family:var(--font-mono);font-size:0.9rem;font-weight:700;color:var(--accent-purple);">O((V+E) log V)</div>
      </div>`;

    // Re-dessiner le graphe avec chemin surligné
    renderGraphSVG(graphData.nodes, graphData.edges, highlightPath);
    Toast.success(`Chemin trouvé : ${path ? path.join(' → ') : 'aucun'}`);

  } catch (err) {
    Toast.error('Erreur Dijkstra : ' + err.message);
  } finally {
    setLoading('btn-calc', false);
  }
}

// ── Rendu SVG du graphe ─────────────────────────────────────────────────────
function renderGraphSVG(nodes, edges, pathNodes) {
  const svg = document.getElementById('graph-svg');
  const placeholder = document.getElementById('graph-placeholder');
  if (!nodes.length) return;

  placeholder.style.display = 'none';
  svg.style.display = 'block';

  const W = svg.clientWidth  || 400;
  const H = svg.clientHeight || 320;
  const R = Math.min(W, H) * 0.36;
  const cx = W / 2, cy = H / 2;

  // Positions en cercle
  const pos = {};
  nodes.forEach((n, i) => {
    const angle = (2 * Math.PI * i / nodes.length) - Math.PI / 2;
    pos[n] = { x: cx + R * Math.cos(angle), y: cy + R * Math.sin(angle) };
  });

  // Construire un Set des arêtes du chemin optimal
  const pathEdges = new Set();
  for (let i = 0; i < pathNodes.length - 1; i++) {
    pathEdges.add(pathNodes[i] + '→' + pathNodes[i+1]);
    pathEdges.add(pathNodes[i+1] + '→' + pathNodes[i]);
  }

  let svgContent = '';

  // Arêtes
  edges.forEach(e => {
    const a = pos[e.source], b = pos[e.target];
    if (!a || !b) return;
    const isPath = pathEdges.has(e.source + '→' + e.target);
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    svgContent += `
      <line x1="${a.x.toFixed(1)}" y1="${a.y.toFixed(1)}" x2="${b.x.toFixed(1)}" y2="${b.y.toFixed(1)}"
        stroke="${isPath ? '#4a9eff' : '#2a3550'}" stroke-width="${isPath ? 3 : 1.5}"
        stroke-dasharray="${isPath ? 'none' : '4,3'}" opacity="${isPath ? 1 : 0.6}"/>
      <text x="${mx.toFixed(1)}" y="${(my - 4).toFixed(1)}" text-anchor="middle"
        fill="${isPath ? '#4a9eff' : '#8892a4'}" font-size="10" font-family="monospace">${e.distance ?? ''}</text>`;
  });

  // Nœuds
  nodes.forEach(n => {
    const p = pos[n];
    const isInPath = pathNodes.includes(n);
    const isSrc    = pathNodes[0] === n;
    const isDest   = pathNodes[pathNodes.length - 1] === n;
    const color    = isSrc ? '#4a9eff' : isDest ? '#22d3a0' : isInPath ? '#f5b820' : '#2a3550';
    const stroke   = isInPath ? (isSrc ? '#4a9eff' : isDest ? '#22d3a0' : '#f5b820') : '#3d4f6e';
    svgContent += `
      <circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="18"
        fill="${color}" stroke="${stroke}" stroke-width="2"/>
      <text x="${p.x.toFixed(1)}" y="${(p.y + 4).toFixed(1)}" text-anchor="middle"
        fill="#fff" font-size="9" font-family="Space Grotesk,sans-serif" font-weight="600">
        ${n.length > 6 ? n.substring(0, 6) + '…' : n}
      </text>`;
  });

  svg.innerHTML = svgContent;
}

// ── Tableau des connexions ───────────────────────────────────────────────────
function renderEdgesTable(edges) {
  const tbody = document.getElementById('edges-tbody');
  if (!edges.length) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:32px;color:var(--text-muted);">
      Aucune connexion en base de données</td></tr>`;
    return;
  }
  tbody.innerHTML = edges.map(e => `
    <tr>
      <td><span style="font-family:var(--font-mono);font-weight:600;">${e.source}</span></td>
      <td><span style="font-family:var(--font-mono);font-weight:600;">${e.target}</span></td>
      <td><span class="badge badge-blue">${e.distance ?? '—'} u.</span></td>
      <td><span class="badge badge-green">✅ Actif</span></td>
    </tr>`).join('');
}

// Lancement au chargement
document.addEventListener('DOMContentLoaded', () => {
  ThemeManager.init();
  // Infos utilisateur dans la sidebar
  const user = Auth.getUser();
  if (user) {
    const el = document.getElementById('current-username');
    const role = document.getElementById('current-role');
    if (el)   el.textContent  = user.nom || user.username || user.email || 'Utilisateur';
    if (role) role.textContent = user.role || 'MEMBRE';
  }
  document.getElementById('btn-logout')?.addEventListener('click', () => Auth.logout());
  loadNetwork();
});
</script>
</body>
</html>
