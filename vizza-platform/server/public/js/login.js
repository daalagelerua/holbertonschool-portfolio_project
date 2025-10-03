document.addEventListener('DOMContentLoaded', function() {
    console.log('Page de connexion chargée');
    
    // Initialiser la gestion du formulaire de connexion
    initLoginForm();
    
    // Rediriger si déjà connecté
    Utils.checkIfAlreadyLoggedIn();
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
    const formData = new FormData(event.target);  // Formdata() crée un objet key: value avec les données extraite du formulaire
    const email = formData.get('email')?.trim();  // optional chainig pour eviter les erreurs si le champs reste vide
    const password = formData.get('password');
    
    // Validation côté client
    if (!email || !password) {
        Main.showFlashMessage('Veuillez remplir tous les champs', 'warning');
        return;
    }
    
    if (!Utils.isValidEmail(email)) {
        Main.showFlashMessage('Format d\'email invalide', 'warning');
        return;
    }

    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;  // sauvergarde avant modif du try pour restauration dans le catch
    
    try {
        // Désactiver le bouton de soumission
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="bi bi-spinner-border me-2"></i>Connexion...';
        
        // Appeler l'API de connexion
        const user = await Auth.login(email, password);
        
        // Mettre à jour l'interface utilisateur manuellement
        Auth.showLoggedInUI(user);
        
        // Succès
        Main.showFlashMessage('Connexion réussie ! Redirection...', 'success');
        
        // Redirection après un court délai
        setTimeout(() => {
            window.location.href = '/';
        }, 1500);
        
    } catch (error) {
        console.error('Erreur de connexion:', error);
        
        // Réactiver le bouton
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
        document.getElementById('email').focus();  // .focus() replace automatiquement le curseur dans le champ email 
    }
}

// Export pour utilisation dans d'autres scripts si nécessaire
window.LoginPage = {  // exemple: dans profile.js ou pour des tests automatisés
    handleLogin
};
