
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
      </div>
    </div>

    <!-- Paramètres inline — pas de card inutile -->
    <div class="card" style="margin-bottom:20px;">
      <div style="display:flex;gap:16px;flex-wrap:wrap;align-items:flex-end;">
        <div class="form-group" style="flex:1;min-width:140px;margin:0;">
          <label class="form-label">Nœud source</label>
          <select class="form-control" id="select-source">
            <option value="">Chargement...</option>
          </select>
        </div>
        <div style="font-size:1.4rem;padding-bottom:2px;color:var(--amber-400);">→</div>
        <div class="form-group" style="flex:1;min-width:140px;margin:0;">
          <label class="form-label">Nœud destination</label>
          <select class="form-control" id="select-dest">
            <option value="">Chargement...</option>
          </select>
        </div>
        <button class="btn btn-primary" id="btn-calc" onclick="calculatePath()">⚡ Calculer</button>
      </div>
      <div style="margin-top:10px;font-size:.77rem;color:var(--c-text-3);">
        Algorithme de Dijkstra · O((V+E) log V) · Nœuds et connexions chargés depuis MySQL
      </div>
    </div>

    <!-- Topologie + Résultat -->
    <div class="grid-2" style="margin-bottom:20px;">

      <div class="card">
        <div class="card-header">
          <span class="card-title">🌐 Topologie du Réseau</span>
          <span class="badge badge-amber" id="node-count">0 nœuds</span>
        </div>
        <div id="network-graph" style="width:100%;height:300px;position:relative;background:var(--warm-50);border-radius:var(--radius-sm);overflow:hidden;border:1px solid var(--c-border);">
          <div id="graph-placeholder" style="display:flex;height:100%;align-items:center;justify-content:center;color:var(--c-text-3);flex-direction:column;gap:8px;">
            <span style="font-size:2rem;">🗺️</span>
            <span style="font-size:.84rem;">Chargement du graphe depuis la DB...</span>
          </div>
          <svg id="graph-svg" width="100%" height="100%" style="display:none;position:absolute;top:0;left:0;"></svg>
        </div>
      </div>

      <div class="card" id="result-card">
        <div class="card-header">
          <span class="card-title">📍 Résultat du Calcul</span>
          <span class="badge badge-gray" id="result-badge">En attente</span>
        </div>
        <div id="result-placeholder" style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:240px;color:var(--c-text-3);gap:8px;">
          <span style="font-size:2.5rem;opacity:.4;">⚡</span>
          <span style="font-size:.83rem;">Lancez le calcul pour voir le chemin optimal</span>
        </div>
        <div id="result-content" style="display:none;">
          <div style="text-align:center;padding:16px 0 20px;">
            <div style="font-size:.72rem;color:var(--c-text-3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px;">Distance / Coût total</div>
            <div style="font-family:var(--mono);font-size:2.2rem;font-weight:800;color:var(--amber-600);" id="path-distance">—</div>
          </div>
          <div style="background:linear-gradient(135deg,var(--amber-50),var(--elec-50));border-radius:var(--radius-sm);padding:16px;border:1px solid var(--amber-200);">
            <div style="font-size:.71rem;color:var(--amber-600);text-transform:uppercase;font-weight:700;letter-spacing:.5px;margin-bottom:10px;">Chemin optimal</div>
            <div id="path-steps"></div>
          </div>
          <div id="path-metrics" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px;"></div>
        </div>
      </div>
    </div>

    <!-- Tableau connexions -->
    <div class="card" style="padding:0;">
      <div class="card-header" style="padding:16px 20px;">
        <span class="card-title">🔗 Connexions du Réseau (DB)</span>
        <span class="badge badge-amber" id="edge-count">0 connexions</span>
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
            <tr><td colspan="4" style="text-align:center;padding:32px;color:var(--c-text-3);">
              <span class="spin" style="display:inline-block">⟳</span> Chargement...
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

async function loadNetwork() {
  try {
    const data = await fetch(API_BASE + '/demo/dijkstra').then(r => r.json());
    if (!data.success) throw new Error(data.message || 'Erreur API');

    const nodeSet = new Set();
    const edges = data.graph_visual || [];
    edges.forEach(e => { nodeSet.add(e.source); nodeSet.add(e.target); });
    const nodes = Array.from(nodeSet);

    graphData = { nodes, edges };

    // Sélects
    const srcSel = document.getElementById('select-source');
    const dstSel = document.getElementById('select-dest');
    srcSel.innerHTML = nodes.map(n => `<option value="${n}">${n}</option>`).join('');
    dstSel.innerHTML = nodes.map(n => `<option value="${n}">${n}</option>`).join('');
    if (nodes.length > 1) dstSel.selectedIndex = nodes.length - 1;

    document.getElementById('node-count').textContent = nodes.length + ' nœuds';
    document.getElementById('edge-count').textContent = edges.length + ' connexions';

    renderGraph(nodes, edges, []);
    renderEdgesTable(edges);
  } catch (err) {
    Toast.error('Erreur réseau : ' + err.message);
  }
}

function renderGraph(nodes, edges, path) {
  const svg = document.getElementById('graph-svg');
  const placeholder = document.getElementById('graph-placeholder');
  if (!nodes.length) return;

  placeholder.style.display = 'none';
  svg.style.display = 'block';

  const W = svg.parentElement.offsetWidth || 520;
  const H = 300;
  const cx = W / 2, cy = H / 2;
  const R = Math.min(W, H) * 0.33;

  const pos = {};
  nodes.forEach((n, i) => {
    const angle = (i / nodes.length) * 2 * Math.PI - Math.PI / 2;
    pos[n] = { x: cx + R * Math.cos(angle), y: cy + R * Math.sin(angle) };
  });

  // Central node at center if exists
  if (nodes.length > 0) {
    const centralKeywords = ['centrale', 'central', 'source', 'main'];
    const central = nodes.find(n => centralKeywords.some(k => n.toLowerCase().includes(k)));
    if (central) pos[central] = { x: cx, y: cy };
  }

  const pathSet = new Set();
  for (let i = 0; i < path.length - 1; i++) {
    pathSet.add(`${path[i]}-${path[i+1]}`);
    pathSet.add(`${path[i+1]}-${path[i]}`);
  }

  let svgContent = `<defs>
    <marker id="arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
      <path d="M0,0 L6,3 L0,6 Z" fill="#d6d3d1"/>
    </marker>
    <marker id="arr-h" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
      <path d="M0,0 L6,3 L0,6 Z" fill="#f59e0b"/>
    </marker>
  </defs>`;

  // Edges
  edges.forEach(e => {
    const s = pos[e.source], t = pos[e.target];
    if (!s || !t) return;
    const isPath = pathSet.has(`${e.source}-${e.target}`);
    const mx = (s.x + t.x) / 2, my = (s.y + t.y) / 2;
    svgContent += `
      <line x1="${s.x}" y1="${s.y}" x2="${t.x}" y2="${t.y}"
        stroke="${isPath ? '#f59e0b' : '#e7e5e4'}"
        stroke-width="${isPath ? 2.5 : 1.5}"
        stroke-dasharray="${isPath ? 'none' : '5,4'}"
        opacity="${isPath ? 1 : 0.7}"/>
      <text x="${mx}" y="${my - 5}" text-anchor="middle"
        font-size="11" font-family="JetBrains Mono" fill="${isPath ? '#d97706' : '#a8a29e'}" font-weight="${isPath ? '600' : '400'}">
        ${e.distance ?? e.weight ?? ''}
      </text>`;
  });

  // Nodes
  nodes.forEach(n => {
    const p = pos[n];
    const isPath = path.includes(n);
    const isFirst = path[0] === n, isLast = path[path.length-1] === n;
    const color = isFirst ? '#22c55e' : isLast ? '#ef4444' : isPath ? '#f59e0b' : '#ffffff';
    const stroke = isPath ? '#d97706' : '#d6d3d1';
    const label = n.length > 8 ? n.substring(0, 8) + '…' : n;
    svgContent += `
      <circle cx="${p.x}" cy="${p.y}" r="22" fill="${color}" stroke="${stroke}" stroke-width="${isPath ? 2.5 : 1.5}" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))"/>
      <text x="${p.x}" y="${p.y + 4}" text-anchor="middle" font-size="10" font-family="Outfit" fill="${isPath ? '#fff' : '#44403c'}" font-weight="600">
        ${label}
      </text>`;
  });

  svg.innerHTML = svgContent;
}

function renderEdgesTable(edges) {
  const tbody = document.getElementById('edges-tbody');
  if (!edges.length) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:24px;color:var(--c-text-3);">Aucune connexion</td></tr>';
    return;
  }
  tbody.innerHTML = edges.map(e => `
    <tr>
      <td style="font-weight:600;">${e.source}</td>
      <td>${e.target}</td>
      <td><span class="badge badge-amber" style="font-family:var(--mono);">${e.distance ?? e.weight ?? '—'} u.</span></td>
      <td><span class="badge badge-green">✅ Actif</span></td>
    </tr>`).join('');
}

async function calculatePath() {
  const src = document.getElementById('select-source').value;
  const dst = document.getElementById('select-dest').value;
  if (!src || !dst || src === dst) { Toast.warning('Sélectionnez source et destination différentes'); return; }

  setLoading('btn-calc', true);
  try {
    const data = await fetch(`${API_BASE}/demo/dijkstra?start=${encodeURIComponent(src)}&end=${encodeURIComponent(dst)}`).then(r => r.json());
    if (!data.success) throw new Error(data.message || 'Calcul impossible');

    const path = (data.result && data.result.path) ? data.result.path : [];
    highlightPath = path;
    renderGraph(graphData.nodes, graphData.edges, path);

    document.getElementById('result-placeholder').style.display = 'none';
    document.getElementById('result-content').style.display = 'block';
    document.getElementById('result-badge').textContent = '✅ Calculé';
    document.getElementById('result-badge').className = 'badge badge-green';
    document.getElementById('path-distance').textContent = (data.result && data.result.distance != null ? data.result.distance : '—') + ' u.';

    document.getElementById('path-steps').innerHTML = path.map((n, i) => `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:${i < path.length-1 ? '6' : '0'}px;">
        <div style="width:24px;height:24px;border-radius:50%;background:${i === 0 ? '#22c55e' : i === path.length-1 ? '#ef4444' : '#f59e0b'};display:flex;align-items:center;justify-content:center;font-size:.7rem;font-weight:800;color:white;flex-shrink:0;">${i+1}</div>
        <span style="font-size:.84rem;font-weight:600;">${n}</span>
        ${i === 0 ? '<span class="badge badge-green" style="margin-left:auto;">Source</span>' : i === path.length-1 ? '<span class="badge badge-red" style="margin-left:auto;">Dest.</span>' : ''}
      </div>
      ${i < path.length-1 ? '<div style="width:2px;height:10px;background:var(--amber-300);margin-left:11px;border-radius:2px;"></div>' : ''}`).join('');

    document.getElementById('path-metrics').innerHTML = `
      <div style="background:var(--c-surface-2);padding:12px;border-radius:var(--radius-sm);text-align:center;">
        <div style="font-size:.67rem;color:var(--c-text-3);text-transform:uppercase;font-weight:600;">Nœuds traversés</div>
        <div style="font-family:var(--mono);font-size:1.4rem;font-weight:800;color:var(--amber-600);">${path.length}</div>
      </div>
      <div style="background:var(--c-surface-2);padding:12px;border-radius:var(--radius-sm);text-align:center;">
        <div style="font-size:.67rem;color:var(--c-text-3);text-transform:uppercase;font-weight:600;">Complexité</div>
        <div style="font-family:var(--mono);font-size:.78rem;font-weight:700;color:var(--c-text-2);margin-top:6px;">O((V+E) log V)</div>
      </div>`;

    Toast.success(`Chemin trouvé : ${path.join(' → ')}`);
  } catch (err) {
    Toast.error('Erreur calcul : ' + err.message);
  } finally {
    setLoading('btn-calc', false);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  Auth.guard();
  loadNetwork();
});
</script>
</body>
</html>
