<%@ page isELIgnored="true" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Erreur 500</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="stylesheet" href="${pageContext.request.contextPath}/css/style.css">
</head>
<body>
<div class="app-layout">
  <main class="main-content" style="max-width:920px;margin:0 auto;padding:24px;">
    <div class="card" style="padding:24px;">
      <h1 style="margin:0 0 12px 0;">❌ Erreur interne (500)</h1>
      <p style="color:var(--text-muted);margin:0 0 16px 0;">
        Une erreur est survenue pendant le traitement de la page.
      </p>

      <div class="grid-2" style="grid-template-columns:1fr;">
        <div>
          <h3 style="font-size:1rem;margin:0 0 8px 0;">Détails</h3>
          <pre style="white-space:pre-wrap;word-break:break-word;background:var(--bg-secondary);padding:12px;border-radius:var(--radius-sm);border:1px solid var(--border);">
<%= request.getAttribute("jakarta.servlet.error.exception") %>
          </pre>
        </div>
      </div>

      <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:18px;">
        <a href="dashboard.jsp" class="btn btn-primary" style="padding:12px 18px;">↩ Retour au tableau de bord</a>
      </div>
    </div>
  </main>
</div>
</body>
</html>

