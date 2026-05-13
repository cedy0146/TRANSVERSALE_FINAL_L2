<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<!DOCTYPE html>
<html lang="fr" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ElectriMada — Connexion</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="stylesheet" href="css/style.css">
</head>
<body>

<div id="toast-container"></div>

<div class="login-page">
  <div class="login-bg"></div>
  <div class="login-grid"></div>

  <!-- Theme toggle -->
  <button id="theme-toggle" class="btn-icon" style="position:absolute;top:20px;right:20px;z-index:10;">🌙</button>

  <div class="login-card">
    <div class="login-header">
      <div class="login-logo">⚡</div>
      <h1 class="login-title">ElectriMada</h1>
      <p class="login-subtitle">Système de Gestion d'Énergie Solaire</p>
    </div>

    <!-- Tabs connexion/inscription -->
    <div style="display:flex;gap:4px;background:var(--bg-secondary);border-radius:var(--radius-sm);padding:4px;margin-bottom:24px;">
      <button class="btn tab-btn active" id="tab-login" onclick="switchTab('login')"
              style="flex:1;background:var(--bg-card);border-radius:calc(var(--radius-sm) - 2px);">
        Connexion
      </button>
      <button class="btn tab-btn" id="tab-register" onclick="switchTab('register')"
              style="flex:1;background:transparent;color:var(--text-secondary);">
        Inscription
      </button>
    </div>

    <!-- FORMULAIRE CONNEXION -->
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
                  style="position:absolute;right:12px;top:50%;transform:translateY(-50%);color:var(--text-muted);font-size:16px;">
            👁
          </button>
        </div>
      </div>
      <button type="submit" class="btn btn-primary" id="btn-login" style="width:100%;margin-top:8px;padding:12px;">
        ⚡ Se connecter
      </button>
    </form>

    <!-- FORMULAIRE INSCRIPTION -->
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
        <small style="color:var(--text-muted);font-size:0.75rem;margin-top:4px;display:block;">
          Doit contenir : majuscule, minuscule, chiffre et caractère spécial
        </small>
      </div>
      <div class="form-group">
        <label class="form-label">Rôle</label>
        <select class="form-control" id="reg-role">
          <option value="VILLAGEOIS">Villageois</option>
          <option value="RESPONSABLE">Responsable</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>
      <button type="submit" class="btn btn-success" id="btn-register" style="width:100%;margin-top:8px;padding:12px;">
        Créer mon compte
      </button>
    </form>

    <p style="text-align:center;margin-top:20px;font-size:0.8rem;color:var(--text-muted);">
      ElectriMada © 2025 - Tous droits réservés.
    </p>
  </div>
</div>

<script src="js/app.js"></script>
<script>
// Switch Login / Register
function switchTab(tab) {
  let isLogin = tab === 'login';
  document.getElementById('form-login').style.display    = isLogin ? '' : 'none';
  document.getElementById('form-register').style.display = isLogin ? 'none' : '';

  let btnLogin    = document.getElementById('tab-login');
  let btnRegister = document.getElementById('tab-register');
  if (isLogin) {
    btnLogin.style.background    = 'var(--bg-card)';
    btnLogin.style.color         = 'var(--text-primary)';
    btnRegister.style.background = 'transparent';
    btnRegister.style.color      = 'var(--text-secondary)';
  } else {
    btnRegister.style.background = 'var(--bg-card)';
    btnRegister.style.color      = 'var(--text-primary)';
    btnLogin.style.background    = 'transparent';
    btnLogin.style.color         = 'var(--text-secondary)';
  }
}

// Toggle password visibility
function togglePwd(id) {
  let inp = document.getElementById(id);
  inp.type = inp.type === 'password' ? 'text' : 'password';
}

// Connexion
async function handleLogin(e) {
  e.preventDefault();
  let username = document.getElementById('login-username').value.trim();
  let password = document.getElementById('login-password').value;
  if (!username || !password) { Toast.warning('Veuillez remplir tous les champs.'); return; }

  setLoading('btn-login', true);
  try {
    let data = await API.auth.login({ username, password });
    Auth.setUser(data.utilisateur);
    Toast.success('Connexion réussie ! Bienvenue ' + data.utilisateur.username);
    setTimeout(() => { window.location.href = 'dashboard.jsp'; }, 800);
  } catch (err) {
    Toast.error(err.message || 'Identifiants incorrects.');
  } finally {
    setLoading('btn-login', false);
  }
}

// Inscription
async function handleRegister(e) {
  e.preventDefault();
  let username = document.getElementById('reg-username').value.trim();
  let password = document.getElementById('reg-password').value;
  let role     = document.getElementById('reg-role').value;
  if (!username || !password) { Toast.warning('Veuillez remplir tous les champs.'); return; }

  setLoading('btn-register', true);
  try {
    await API.auth.register({ username, password, role });
    Toast.success('Compte créé avec succès ! Vous pouvez vous connecter.');
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
