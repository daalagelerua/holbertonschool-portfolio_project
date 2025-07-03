document.addEventListener('DOMContentLoaded', function() {
    console.log('Page d\'inscription chargée');
    
    // Initialiser la page
    initRegisterForm();
    loadCountriesForSelect();
    checkIfAlreadyLoggedIn();
});

/**
 * Initialise le formulaire d'inscription
 */
function initRegisterForm() {
    const registerForm = document.getElementById('register-form');
    
    if (!registerForm) {
        console.error('Formulaire d\'inscription non trouvé');
        return;
    }
    
    registerForm.addEventListener('submit', handleRegister);
    
    // Validation en temps réel du mot de passe
    const passwordField = document.getElementById('password');
    if (passwordField) {
        passwordField.addEventListener('input', validatePasswordStrength);
    }
}

/**
 * Charge la liste des pays dans le select
 */
async function loadCountriesForSelect() {
    try {
        const countries = await API.getCountries();
        const countrySelect = document.getElementById('defaultOriginCountry');
        
        if (!countrySelect) {
            console.warn('Select des pays non trouvé');
            return;
        }
        
        // Trier les pays par nom
        countries.sort((a, b) => a.name.localeCompare(b.name));
        
        // Ajouter les options
        countries.forEach(country => {
            const option = document.createElement('option');
            option.value = country.code;
            option.textContent = `${country.flag} ${country.name}`;
            countrySelect.appendChild(option);
        });
        
        // Présélectionner la France si disponible
        const franceOption = countrySelect.querySelector('option[value="FR"]');
        if (franceOption) {
            franceOption.selected = true;
        }
        
    } catch (error) {
        console.error('Erreur chargement pays:', error);
        Main.showFlashMessage('Impossible de charger la liste des pays', 'warning');
    }
}

/**
 * Gère la soumission du formulaire d'inscription
 * @param {Event} event - Événement de soumission
 */
async function handleRegister(event) {
    event.preventDefault();
    
    // Récupérer les données du formulaire
    const formData = new FormData(event.target);
    const userData = {
        firstName: formData.get('firstName')?.trim(),
        lastName: formData.get('lastName')?.trim(),
        email: formData.get('email')?.trim(),
        password: formData.get('password'),
        defaultOriginCountry: formData.get('defaultOriginCountry'),
        language: formData.get('language') || 'fr'
    };
    
    // Validation côté client
    const validation = validateRegistrationData(userData);
    if (!validation.isValid) {
        Main.showFlashMessage(validation.message, 'warning');
        return;
    }
    
    try {
        // Désactiver le bouton de soumission
        const submitBtn = event.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="bi bi-spinner-border me-2"></i>Inscription...';
        
        // Effacer les messages précédents
        Main.clearAllFlashMessages();
        
        // Appeler l'API d'inscription
        const user = await Auth.register(userData);
        
        // Succès
        Main.showFlashMessage('Inscription réussie ! Bienvenue sur Vizza !', 'success');
        
        // Redirection après un court délai
        setTimeout(() => {
            window.location.href = '/';
        }, 2000);
        
    } catch (error) {
        console.error('Erreur d\'inscription:', error);
        
        // Réactiver le bouton
        const submitBtn = event.target.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        
        // Afficher l'erreur
        let errorMessage = 'Erreur lors de l\'inscription';
        
        if (error.message.includes('Email déjà utilisé')) {
            errorMessage = 'Cet email est déjà utilisé. Essayez de vous connecter.';
        } else if (error.message.includes('Email invalide')) {
            errorMessage = 'Format d\'email invalide';
        } else if (error.message.includes('Mot de passe trop court')) {
            errorMessage = 'Le mot de passe doit contenir au moins 6 caractères';
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        Main.showFlashMessage(errorMessage, 'danger');
    }
}

/**
 * Valide les données d'inscription côté client
 * @param {Object} userData - Données utilisateur
 * @returns {Object} Résultat de validation
 */
function validateRegistrationData(userData) {
    const { firstName, lastName, email, password } = userData;
    
    // Vérifier les champs obligatoires
    if (!firstName || !lastName || !email || !password) {
        return {
            isValid: false,
            message: 'Veuillez remplir tous les champs obligatoires'
        };
    }
    
    // Vérifier la longueur des noms
    if (firstName.length < 2 || lastName.length < 2) {
        return {
            isValid: false,
            message: 'Le prénom et nom doivent contenir au moins 2 caractères'
        };
    }
    
    // Vérifier le format email
    if (!isValidEmail(email)) {
        return {
            isValid: false,
            message: 'Format d\'email invalide'
        };
    }
    
    // Vérifier la longueur du mot de passe
    if (password.length < 6) {
        return {
            isValid: false,
            message: 'Le mot de passe doit contenir au moins 6 caractères'
        };
    }
    
    return { isValid: true };
}

/**
 * Valide la force du mot de passe en temps réel
 * @param {Event} event - Événement input
 */
function validatePasswordStrength(event) {
    const password = event.target.value;
    const strengthIndicator = document.getElementById('password-strength');
    
    if (!strengthIndicator) {
        // Créer un indicateur de force s'il n'existe pas
        const indicator = document.createElement('div');
        indicator.id = 'password-strength';
        indicator.className = 'mt-2';
        event.target.parentNode.appendChild(indicator);
    }
    
    const strength = calculatePasswordStrength(password);
    const indicator = document.getElementById('password-strength');
    
    if (password.length === 0) {
        indicator.innerHTML = '';
        return;
    }
    
    const strengthText = ['Très faible', 'Faible', 'Moyen', 'Fort', 'Très fort'];
    const strengthColors = ['danger', 'warning', 'info', 'success', 'primary'];
    
    indicator.innerHTML = `
        <small class="text-${strengthColors[strength.score]}">
            Force: ${strengthText[strength.score]}
            ${strength.suggestions.length > 0 ? '- ' + strength.suggestions.join(', ') : ''}
        </small>
    `;
}

/**
 * Calcule la force d'un mot de passe
 * @param {string} password - Mot de passe
 * @returns {Object} Score et suggestions
 */
function calculatePasswordStrength(password) {
    let score = 0;
    const suggestions = [];
    
    if (password.length >= 8) score++;
    else suggestions.push('au moins 8 caractères');
    
    if (/[a-z]/.test(password)) score++;
    else suggestions.push('minuscules');
    
    if (/[A-Z]/.test(password)) score++;
    else suggestions.push('majuscules');
    
    if (/\d/.test(password)) score++;
    else suggestions.push('chiffres');
    
    if (/[^a-zA-Z\d]/.test(password)) score++;
    else suggestions.push('caractères spéciaux');
    
    return { score: Math.min(score, 4), suggestions };
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

// Export pour utilisation dans d'autres scripts
window.RegisterPage = {
    handleRegister,
    validateRegistrationData,
    calculatePasswordStrength
};
