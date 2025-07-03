document.addEventListener('DOMContentLoaded', function() {
    console.log('Page de profil chargée');
    
    // Vérifier l'authentification
    checkAuthentication();
    
    // Charger le profil utilisateur
    loadUserProfile();
    
    // Charger les pays pour le select
    loadCountriesForProfile();
    
    // Initialiser le formulaire
    initProfileForm();
});

/**
 * Vérifie que l'utilisateur est connecté
 */
function checkAuthentication() {
    if (!Auth.isLoggedIn()) {
        Main.showFlashMessage('Vous devez être connecté pour accéder à votre profil', 'warning');
        setTimeout(() => {
            window.location.href = '/login';
        }, 2000);
        return;
    }
}

/**
 * Charge et affiche les informations du profil
 */
async function loadUserProfile() {
    try {
        const user = await Auth.getProfile();
        displayUserProfile(user);
        populateEditForm(user);
        
    } catch (error) {
        console.error('Erreur chargement profil:', error);
        
        if (error.message.includes('Non authentifié')) {
            Main.showFlashMessage('Session expirée, veuillez vous reconnecter', 'warning');
            setTimeout(() => window.location.href = '/login', 2000);
        } else {
            Main.showFlashMessage('Erreur lors du chargement du profil', 'danger');
        }
    }
}

/**
 * Affiche les informations du profil
 * @param {Object} user - Données utilisateur
 */
function displayUserProfile(user) {
    // Initiales pour l'avatar
    const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    document.getElementById('profile-initials').textContent = initials;
    
    // Nom complet
    document.getElementById('profile-name').textContent = `${user.firstName} ${user.lastName}`;
    
    // Email
    document.getElementById('profile-email').textContent = user.email;
    
    // Date de création
    const createdDate = new Date(user.createdAt).toLocaleDateString('fr-FR');
    document.getElementById('profile-created-at').textContent = createdDate;
    
    // Pays d'origine
    const countryDisplay = user.defaultOriginCountry 
        ? getCountryDisplay(user.defaultOriginCountry)
        : 'Non défini';
    document.getElementById('profile-country').textContent = countryDisplay;
    
    // Langue
    const languageDisplay = user.language === 'fr' ? 'Français' : 'English';
    document.getElementById('profile-language').textContent = languageDisplay;
}

/**
 * Remplit le formulaire d'édition avec les données actuelles
 * @param {Object} user - Données utilisateur
 */
function populateEditForm(user) {
    document.getElementById('edit-firstName').value = user.firstName;
    document.getElementById('edit-lastName').value = user.lastName;
    document.getElementById('edit-email').value = user.email;
    
    // Pays d'origine
    if (user.defaultOriginCountry) {
        const countrySelect = document.getElementById('edit-defaultOriginCountry');
        if (countrySelect) {
            countrySelect.value = user.defaultOriginCountry;
        }
    }
    
    // Langue
    const languageRadio = document.getElementById(`edit-lang-${user.language}`);
    if (languageRadio) {
        languageRadio.checked = true;
    }
}

/**
 * Charge les pays pour le formulaire de profil
 */
async function loadCountriesForProfile() {
    try {
        const countries = await API.getCountries();
        const countrySelect = document.getElementById('edit-defaultOriginCountry');
        
        if (!countrySelect) return;
        
        // Trier par nom
        countries.sort((a, b) => a.name.localeCompare(b.name));
        
        // Ajouter les options (garder l'option vide existante)
        countries.forEach(country => {
            const option = document.createElement('option');
            option.value = country.code;
            option.textContent = `${country.flag} ${country.name}`;
            countrySelect.appendChild(option);
        });
        
    } catch (error) {
        console.error('Erreur chargement pays pour profil:', error);
    }
}

/**
 * Initialise le formulaire de profil
 */
function initProfileForm() {
    const profileForm = document.getElementById('profile-form');
    
    if (!profileForm) {
        console.error('Formulaire de profil non trouvé');
        return;
    }
    
    profileForm.addEventListener('submit', handleProfileUpdate);
    
    // Validation en temps réel des mots de passe
    const newPasswordField = document.getElementById('new-password');
    const confirmPasswordField = document.getElementById('confirm-password');
    
    if (newPasswordField && confirmPasswordField) {
        newPasswordField.addEventListener('input', validatePasswordMatch);
        confirmPasswordField.addEventListener('input', validatePasswordMatch);
    }
}

/**
 * Gère la mise à jour du profil
 * @param {Event} event - Événement de soumission
 */
async function handleProfileUpdate(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const updateData = {
        firstName: formData.get('firstName')?.trim(),
        lastName: formData.get('lastName')?.trim(),
        email: formData.get('email')?.trim(),
        defaultOriginCountry: formData.get('defaultOriginCountry') || null,
        language: formData.get('language') || 'fr'
    };
    
    // Gestion du changement de mot de passe
    const currentPassword = formData.get('currentPassword');
    const newPassword = formData.get('newPassword');
    const confirmPassword = formData.get('confirmPassword');
    
    if (currentPassword || newPassword || confirmPassword) {
        const passwordValidation = validatePasswordChange(currentPassword, newPassword, confirmPassword);
        if (!passwordValidation.isValid) {
            Main.showFlashMessage(passwordValidation.message, 'warning');
            return;
        }
        updateData.currentPassword = currentPassword;
        updateData.newPassword = newPassword;
    }
    
    // Validation des données de base
    const validation = validateProfileData(updateData);
    if (!validation.isValid) {
        Main.showFlashMessage(validation.message, 'warning');
        return;
    }
    
    try {
        // Désactiver le bouton
        const submitBtn = event.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="bi bi-spinner-border me-2"></i>Enregistrement...';
        
        // Appeler l'API de mise à jour (à créer)
        await updateUserProfile(updateData);
        
        // Succès
        Main.showFlashMessage('Profil mis à jour avec succès !', 'success');
        
        // Recharger le profil
        await loadUserProfile();
        
        // Effacer les champs de mot de passe
        document.getElementById('current-password').value = '';
        document.getElementById('new-password').value = '';
        document.getElementById('confirm-password').value = '';
        
        // Réactiver le bouton
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        
    } catch (error) {
        console.error('Erreur mise à jour profil:', error);
        
        // Réactiver le bouton
        const submitBtn = event.target.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        
        let errorMessage = 'Erreur lors de la mise à jour';
        if (error.message.includes('Mot de passe actuel incorrect')) {
            errorMessage = 'Mot de passe actuel incorrect';
        } else if (error.message.includes('Email déjà utilisé')) {
            errorMessage = 'Cet email est déjà utilisé par un autre compte';
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        Main.showFlashMessage(errorMessage, 'danger');
    }
}

/**
 * Met à jour le profil utilisateur (API call)
 * @param {Object} updateData - Données à mettre à jour
 */
async function updateUserProfile(updateData) {
    const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(updateData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.message || 'Erreur de mise à jour');
    }
    
    if (!data.success) {
        throw new Error(data.message || 'Échec de la mise à jour');
    }
    
    return data.user;
}

/**
 * Valide les données du profil
 * @param {Object} data - Données à valider
 * @returns {Object} Résultat de validation
 */
function validateProfileData(data) {
    const { firstName, lastName, email } = data;
    
    if (!firstName || !lastName || !email) {
        return {
            isValid: false,
            message: 'Le prénom, nom et email sont obligatoires'
        };
    }
    
    if (firstName.length < 2 || lastName.length < 2) {
        return {
            isValid: false,
            message: 'Le prénom et nom doivent contenir au moins 2 caractères'
        };
    }
    
    if (!isValidEmail(email)) {
        return {
            isValid: false,
            message: 'Format d\'email invalide'
        };
    }
    
    return { isValid: true };
}

/**
 * Valide le changement de mot de passe
 * @param {string} current - Mot de passe actuel
 * @param {string} newPassword - Nouveau mot de passe
 * @param {string} confirm - Confirmation
 * @returns {Object} Résultat de validation
 */
function validatePasswordChange(current, newPassword, confirm) {
    // Si des champs de mot de passe sont remplis
    if (current || newPassword || confirm) {
        if (!current) {
            return {
                isValid: false,
                message: 'Mot de passe actuel requis pour le changement'
            };
        }
        
        if (!newPassword) {
            return {
                isValid: false,
                message: 'Nouveau mot de passe requis'
            };
        }
        
        if (newPassword.length < 6) {
            return {
                isValid: false,
                message: 'Le nouveau mot de passe doit contenir au moins 6 caractères'
            };
        }
        
        if (newPassword !== confirm) {
            return {
                isValid: false,
                message: 'Les mots de passe ne correspondent pas'
            };
        }
    }
    
    return { isValid: true };
}

/**
 * Valide la correspondance des mots de passe en temps réel
 */
function validatePasswordMatch() {
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const confirmField = document.getElementById('confirm-password');
    
    if (newPassword && confirmPassword) {
        if (newPassword === confirmPassword) {
            confirmField.classList.remove('is-invalid');
            confirmField.classList.add('is-valid');
        } else {
            confirmField.classList.remove('is-valid');
            confirmField.classList.add('is-invalid');
        }
    } else {
        confirmField.classList.remove('is-valid', 'is-invalid');
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
 * Retourne l'affichage pour un pays
 * @param {string} countryCode - Code du pays
 * @returns {string} Affichage du pays
 */
function getCountryDisplay(countryCode) {
    const countryNames = {
        'FR': 'France 🇫🇷',
        'US': 'États-Unis 🇺🇸',
        'ES': 'Espagne 🇪🇸',
        'IT': 'Italie 🇮🇹',
        'DE': 'Allemagne 🇩🇪',
        'GB': 'Royaume-Uni 🇬🇧',
        'JP': 'Japon 🇯🇵',
        'AU': 'Australie 🇦🇺',
        'CA': 'Canada 🇨🇦',
        'NL': 'Pays-Bas 🇳🇱'
    };
    
    return countryNames[countryCode] || countryCode;
}

/**
 * Supprime le compte utilisateur (fonctionnalité avancée)
 */
async function deleteAccount() {
    const confirmed = confirm(
        'Êtes-vous sûr de vouloir supprimer votre compte ? ' +
        'Cette action est irréversible et supprimera toutes vos données.'
    );
    
    if (!confirmed) return;
    
    const doubleConfirm = prompt(
        'Pour confirmer la suppression, tapez "SUPPRIMER" en majuscules :'
    );
    
    if (doubleConfirm !== 'SUPPRIMER') {
        Main.showFlashMessage('Suppression annulée', 'info');
        return;
    }
    
    try {
        const response = await fetch('/api/auth/profile', {
            method: 'DELETE',
            credentials: 'include'
        });
        
        if (response.ok) {
            Main.showFlashMessage('Compte supprimé avec succès', 'success');
            setTimeout(() => {
                window.location.href = '/';
            }, 2000);
        } else {
            throw new Error('Erreur lors de la suppression');
        }
        
    } catch (error) {
        console.error('Erreur suppression compte:', error);
        Main.showFlashMessage('Erreur lors de la suppression du compte', 'danger');
    }
}

// Export pour utilisation globale
window.ProfilePage = {
    handleProfileUpdate,
    deleteAccount,
    validatePasswordChange
};
