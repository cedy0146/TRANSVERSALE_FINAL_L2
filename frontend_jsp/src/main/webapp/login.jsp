<%@ page isELIgnored="true" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ElectriDB — Connexion</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/style.css">
</head>
<body>

<div id="toast-container"></div>

<div class="login-page">
  <div class="login-bg"></div>
  <div class="login-dots"></div>

  <!-- Déco flottante -->
  <div style="position:absolute;top:10%;left:8%;width:180px;height:180px;border-radius:50%;background:radial-gradient(circle, rgba(37,99,235,.08) 0%, transparent 70%);pointer-events:none;animation:floatA 8s ease-in-out infinite;"></div>
  <div style="position:absolute;bottom:15%;right:10%;width:240px;height:240px;border-radius:50%;background:radial-gradient(circle, rgba(96,165,250,.06) 0%, transparent 70%);pointer-events:none;animation:floatB 10s ease-in-out infinite;"></div>
  <style>
    @keyframes floatA { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-20px);} }
    @keyframes floatB { 0%,100%{transform:translateY(0);} 50%{transform:translateY(20px);} }
  </style>

  <div class="login-card">
    <div class="login-header">
      <div class="login-logo">⚡</div>
      <h1 class="login-title">ElectriDB</h1>
      <p class="login-subtitle">Système de Gestion d'Énergie Solaire</p>
    </div>

    <!-- Onglets -->
    <div class="tab-group" style="margin-bottom:24px;">
      <button class="tab-btn active" id="tab-login" onclick="switchTab('login')">Connexion</button>
      <button class="tab-btn" id="tab-register" onclick="switchTab('register')">Inscription</button>
    </div>

    <!-- CONNEXION -->
    <form id="form-login" onsubmit="handleLogin(event)">
      <div class="form-group">
        <label class="form-label">Nom d'utilisateur</label>
        <input type="text" class="form-control" id="login-username"
               placeholder="Entrez votre identifiant" required autocomplete="username">
      </div>
      <div class="form-group">
        <label class="form-label">Mot de passe</label>
        <div style="position:relative;">
          <input type="password" class="form-control" id="login-password"
                 placeholder="••••••••" required autocomplete="current-password"
                 style="padding-right:44px;">
          <button type="button" onclick="togglePwd('login-password')"
                  style="position:absolute;right:12px;top:50%;transform:translateY(-50%);color:var(--c-text-3);font-size:15px;transition:color .15s;" onmouseover="this.style.color='var(--c-accent)'" onmouseout="this.style.color='var(--c-text-3)'">
            👁
          </button>
        </div>
      </div>
      <button type="submit" class="btn btn-primary" id="btn-login"
              style="width:100%;margin-top:8px;padding:12px;font-size:.9rem;">
        ⚡ Se connecter
      </button>
    </form>

    <!-- INSCRIPTION -->
    <form id="form-register" onsubmit="handleRegister(event)" style="display:none;">
      <div class="form-group">
        <label class="form-label">Nom d'utilisateur</label>
        <input type="text" class="form-control" id="reg-username"
               placeholder="Choisissez un identifiant" required>
      </div>
      <div class="form-group">
        <label class="form-label">Mot de passe</label>
        <input type="password" class="form-control" id="reg-password"
               placeholder="Minimum 8 caractères" required>
        <small style="color:var(--c-text-3);font-size:.72rem;margin-top:4px;display:block;">
          Doit contenir : majuscule, minuscule, chiffre et caractère spécial
        </small>
      </div>
      <div class="form-group">
        <label class="form-label">Rôle</label>
        <select class="form-control" id="reg-role">
          <option value="VILLAGEOIS">Villageois</option>
          <option value="RESPONSABLE">Responsable</option>
        </select>
      </div>
      <button type="submit" class="btn btn-primary" id="btn-register"
              style="width:100%;margin-top:8px;padding:12px;font-size:.9rem;">
        Créer mon compte
      </button>
    </form>

    <p style="text-align:center;margin-top:24px;font-size:.74rem;color:var(--c-text-3);">
      ElectriDB © 2025 — ESMIA Innovation
    </p>
  </div>
</div>

<script src="js/app.js"></script>
<script>
function switchTab(tab) {
  const isLogin = tab === 'login';
  document.getElementById('form-login').style.display    = isLogin ? '' : 'none';
  document.getElementById('form-register').style.display = isLogin ? 'none' : '';
  document.getElementById('tab-login').classList.toggle('active', isLogin);
  document.getElementById('tab-register').classList.toggle('active', !isLogin);
}

function togglePwd(id) {
  const inp = document.getElementById(id);
  inp.type = inp.type === 'password' ? 'text' : 'password';
}

async function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  if (!username || !password) { Toast.warning('Veuillez remplir tous les champs.'); return; }

  setLoading('btn-login', true);
  try {
    const data = await API.auth.login({ username, password });
    Auth.setUser(data.utilisateur);
    Toast.success('Connexion réussie ! Bienvenue ' + data.utilisateur.username);
    setTimeout(() => { window.location.href = 'dashboard.jsp'; }, 800);
  } catch (err) {
    Toast.error(err.message || 'Identifiants incorrects.');
  } finally {
    setLoading('btn-login', false);
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const username = document.getElementById('reg-username').value.trim();
  const password = document.getElementById('reg-password').value;
  const role     = document.getElementById('reg-role').value;
  if (!username || !password) { Toast.warning('Veuillez remplir tous les champs.'); return; }

  setLoading('btn-register', true);
  try {
    await API.auth.register({ username, password, role });
    Toast.success('Compte créé ! Vous pouvez vous connecter.');
    switchTab('login');
  } catch (err) {
    Toast.error(err.message || 'Erreur lors de la création du compte.');
  } finally {
    setLoading('btn-register', false);
  }
}
</script>
</body>
</html>
