// Objet principal pour organiser toutes les fonctionnalités globales
const Main = {
  
  // INITIALISATION
  /**
   * Initialise toutes les fonctionnalités au chargement de la page
   */
  init() {

    // S'assurer que l'authentification est vérifiée en premier
    if (typeof Auth !== 'undefined') {
        Auth.initializeUI();
    }
    
    // Initialiser les modules
    this.initEventListeners();
  },

  // GESTION DES ÉVÉNEMENTS GLOBAUX
  /**
   * Configure tous les event listeners globaux
   */
  initEventListeners() {
    // Bouton de déconnexion
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', this.handleLogout.bind(this));  // bind(this) fait que this = Main au lieu de logoutBtn, une arrow function aurait fonctionné aussi
    }
    
    // Gestion des erreurs globales
    this.initErrorHandling();
  },

  /**
   * Gère la déconnexion de l'utilisateur
   */
  handleLogout(event) {
    event.preventDefault(); // Empêche le comportement par défaut du lien qui provoquerait une perte d'état js
    Auth.logout();
  },

  // GESTION DES MESSAGES FLASH
  /**
   * Affiche un message flash à l'utilisateur
   * @param {string} message - Le message à afficher
   * @param {string} type - Type: 'success', 'danger', 'warning', 'info'
   * @param {number} autoHide - Millisecondes avant masquage auto (0 = pas d'auto-hide)
   */
  showFlashMessage(message, type = 'info', autoHide = 5000) {
    const container = document.getElementById('flash-messages');
    if (!container) {
      console.error('Impossible d\'afficher le message: conteneur introuvable');
      return;
    }

    // Créer l'ID unique pour ce message
    const messageId = `flash-${Date.now()}`;
    
    // Créer le HTML du message
    const alertHTML = `
      <div id="${messageId}" class="alert alert-${type} alert-dismissible fade show" role="alert">
        <i class="bi bi-${this.getIconForType(type)} me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      </div>
    `;
    
    // Ajouter le message au conteneur
    container.insertAdjacentHTML('beforeend', alertHTML);
    
    // Animation d'entrée
    const alertElement = document.getElementById(messageId);
    alertElement.classList.add('fade-in');
    
    // Auto-hide si demandé
    if (autoHide > 0) {
      setTimeout(() => {
        this.hideFlashMessage(messageId);
      }, autoHide);
    }
    
    console.log(`Message flash affiché: ${type} - ${message}`);
  },

  /**
   * Retourne l'icône Bootstrap appropriée pour le type de message
   * @param {string} type - Type du message
   * @returns {string} Nom de l'icône Bootstrap
   */
  getIconForType(type) {
    const icons = {
      success: 'check-circle',
      danger: 'exclamation-triangle',
      warning: 'exclamation-circle',
      info: 'info-circle'
    };
    return icons[type] || 'info-circle';
  },

  // GESTION DES ERREURS GLOBALES
  /**
   * Configure la gestion d'erreurs globale
   */
  initErrorHandling() {
    // Erreurs JavaScript non gérées
    window.addEventListener('error', (e) => {
      console.error('Erreur JavaScript globale:', e.error);
      this.showFlashMessage('Une erreur inattendue s\'est produite.', 'danger');
    });

    // Promesses rejetées non gérées
    window.addEventListener('unhandledrejection', (e) => {
      console.error('Promesse rejetée non gérée:', e.reason);
      this.showFlashMessage('Erreur de connexion. Veuillez réessayer.', 'danger');
    });
  },
};

// INITIALISATION AUTOMATIQUE
/**
 * Initialiser Main dès que le DOM est prêt
 */
document.addEventListener('DOMContentLoaded', function() {
  Main.init();
});

/**
 * Export global pour utilisation dans d'autres scripts
 */
window.Main = Main;
