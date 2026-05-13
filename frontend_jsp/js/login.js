// frontend_jsp/js/login.js

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Empêche la soumission par défaut du formulaire

            const username = loginForm.elements.username.value;
            const password = loginForm.elements.password.value;

            try {
                // Utilisation de l'API_BASE définie dans app.js
                const response = await fetch(`${API_BASE}/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, password }),
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    // Stocker le token et le rôle (par exemple dans localStorage)
                    localStorage.setItem('userToken', data.token);
                    localStorage.setItem('userRole', data.user.role);
                    localStorage.setItem('username', data.user.username); // Optionnel

                    // Afficher un message de succès (vous pouvez utiliser votre système de toast)
                    showToast('Connexion réussie !', 'success');

                    // Redirection basée sur le rôle
                    if (data.user.role === 'ADMIN' || data.user.role === 'RESPONSABLE') {
                        window.location.href = 'dashboard.jsp'; // Rediriger vers le tableau de bord admin
                    } else {
                        window.location.href = 'demandes.jsp'; // Rediriger vers une page utilisateur standard
                    }
                } else {
                    // Afficher un message d'erreur
                    showToast(data.message || 'Erreur de connexion', 'error');
                }
            } catch (error) {
                console.error('Erreur lors de la connexion:', error);
                showToast('Erreur réseau ou serveur indisponible', 'error');
            }
        });
    }
});