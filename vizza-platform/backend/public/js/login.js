document.addEventListener('DOMContentLoaded', function() {
    console.log('Page de connexion chargée');
    
    // Initialiser la gestion du formulaire de connexion
    initLoginForm();
    
    // Rediriger si déjà connecté
    checkIfAlreadyLoggedIn();
});

/**
 * Initialise le formulaire de connexion
 */
function initLoginForm() {
    const loginForm = document.getElementById('login-form');
    
    if (!loginForm) {
        console.error('Formulaire de connexion non trouvé');
        return;
    }
    
    loginForm.addEventListener('submit', handleLogin);
}

/**
 * Gère la soumission du formulaire de connexion
 * @param {Event} event - Événement de soumission
 */
async function handleLogin(event) {
    event.preventDefault();
    
    // Récupérer les données du formulaire
    const formData = new FormData(event.target);
    const email = formData.get('email')?.trim();
    const password = formData.get('password');
    
    // Validation côté client
    if (!email || !password) {
        Main.showFlashMessage('Veuillez remplir tous les champs', 'warning');
        return;
    }
    
    if (!isValidEmail(email)) {
        Main.showFlashMessage('Format d\'email invalide', 'warning');
        return;
    }
    
    try {
        // Désactiver le bouton de soumission
        const submitBtn = event.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="bi bi-spinner-border me-2"></i>Connexion...';
        
        // Effacer les messages précédents
        Main.clearAllFlashMessages();
        
        // Appeler l'API de connexion
        const user = await Auth.login(email, password);

        // Utiliser les données utilisateur pour mettre à jour l'interface
        console.log('Utilisateur connecté:', user);
        
        // Stocker les données utilisateur en session si nécessaire
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        
        // Mettre à jour l'interface utilisateur manuellement
        Auth.showLoggedInUI(user);
        
        // Succès
        Main.showFlashMessage('Connexion réussie ! Redirection...', 'success');
        
        // Redirection après un court délai
        //setTimeout(() => {
            //window.location.href = '/';
        //}, 1500);
        
    } catch (error) {
        console.error('Erreur de connexion:', error);
        
        // Réactiver le bouton
        const submitBtn = event.target.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        
        // Afficher l'erreur
        let errorMessage = 'Erreur de connexion';
        
        if (error.message.includes('Email ou mot de passe incorrect')) {
            errorMessage = 'Email ou mot de passe incorrect';
        } else if (error.message.includes('Utilisateur non trouvé')) {
            errorMessage = 'Aucun compte trouvé avec cet email';
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        Main.showFlashMessage(errorMessage, 'danger');
        
        // Focus sur le champ email pour correction
        document.getElementById('email').focus();
    }
}

/**
 * Vérifie si l'utilisateur est déjà connecté
 */
function checkIfAlreadyLoggedIn() {
    if (Auth.isLoggedIn()) {
        Main.showFlashMessage('Vous êtes déjà connecté', 'info');
        setTimeout(() => {
            window.location.href = '/';
        }, 2000);
    }
}

/**
 * Valide le format d'un email
 * @param {string} email - Email à valider
 * @returns {boolean} true si valide
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Gestion des touches clavier pour améliorer l'UX
 */
document.addEventListener('keydown', function(event) {
    // Soumettre avec Ctrl+Enter ou Cmd+Enter
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.dispatchEvent(new Event('submit'));
        }
    }
});

// Export pour utilisation dans d'autres scripts si nécessaire
window.LoginPage = {
    handleLogin,
    isValidEmail
};
