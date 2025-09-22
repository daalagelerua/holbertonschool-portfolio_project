// Objet principal pour organiser toutes les fonctionnalités globales
const Main = {
  
  // INITIALISATION
  /**
   * Initialise toutes les fonctionnalités au chargement de la page
   */
  init() {
    console.log('Main.js initialisé');

    // S'assurer que l'authentification est vérifiée en premier
    if (typeof Auth !== 'undefined') {
        Auth.initializeUI();
    }
    
    // Initialiser tous les modules
    this.initEventListeners();
    this.initFlashMessages();
    this.initUIHelpers();
    
    console.log('Toutes les fonctionnalités globales sont actives');
  },

  // GESTION DES ÉVÉNEMENTS GLOBAUX
  /**
   * Configure tous les event listeners globaux
   */
  initEventListeners() {
    // Bouton de déconnexion
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', this.handleLogout.bind(this));  // bind(this) fait que this = Main au lieu de logoutBtn
    }
    
    // Fermeture automatique des alerts Bootstrap
    this.initAlertDismissal();
    
    // Gestion des erreurs globales
    this.initErrorHandling();
    
    console.log('Event listeners configurés');
  },

  /**
   * Gère la déconnexion de l'utilisateur
   */
  async handleLogout(event) {
    event.preventDefault(); // Empêche le comportement par défaut du lien
    
    try {
      console.log('Déconnexion en cours...');
      
      // Afficher un loading pendant la déconnexion
      this.showFlashMessage('Déconnexion en cours...', 'info', 2000);
      
      // Appeler la fonction de déconnexion d'Auth
      await Auth.logout();
      
      // Auth.logout() redirige automatiquement, mais au cas où :
      if (!window.location.href.includes('/')) {
        window.location.href = '/';
      }
      
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      this.showFlashMessage('Erreur lors de la déconnexion', 'danger');
    }
  },

  // GESTION DES MESSAGES FLASH
  /**
   * Initialise le système de messages flash
   */
  initFlashMessages() {
    // Vérifier que le conteneur existe
    if (!document.getElementById('flash-messages')) {
      console.warn('Conteneur flash-messages non trouvé');
      return;
    }
    
    console.log('Système de messages flash initialisé');
  },

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
    const messageId = `flash-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    
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
   * Masque un message flash spécifique
   * @param {string} messageId - ID du message à masquer
   */
  hideFlashMessage(messageId) {
    const messageElement = document.getElementById(messageId);
    if (messageElement) {
      // Animation de sortie
      messageElement.classList.add('fade-out');
      
      // Supprimer après l'animation
      setTimeout(() => {
        messageElement.remove();
      }, 300);
    }
  },

  /**
   * Efface tous les messages flash
   */
  clearAllFlashMessages() {
    const container = document.getElementById('flash-messages');
    if (container) {
      container.innerHTML = '';
      console.log('Tous les messages flash effacés');
    }
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

  // HELPERS UI GLOBAUX
  /**
   * Initialise les helpers UI communs
   */
  initUIHelpers() {
    // Amélioration des tooltips Bootstrap (si présents)
    this.initTooltips();
    
    // Gestion des formulaires globaux
    this.initFormHelpers();
    
    console.log('Helpers UI initialisés');
  },

  /**
   * Initialise les tooltips Bootstrap
   */
  initTooltips() {
    // Vérifier si Bootstrap est chargé
    if (typeof bootstrap !== 'undefined') {
      const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
      tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
      });
    }
  },

  /**
   * Helpers pour les formulaires
   */
  initFormHelpers() {
    // Empêcher la double soumission des formulaires
    document.querySelectorAll('form').forEach(form => {
      form.addEventListener('submit', function(e) {
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn && !submitBtn.disabled) {
          // Désactiver le bouton pendant 2 secondes
          submitBtn.disabled = true;
          setTimeout(() => {
            submitBtn.disabled = false;
          }, 2000);
        }
      });
    });
  },

  // GESTION DES ERREURS GLOBALES
  /**
   * Configure la gestion d'erreurs globale
   */
  initErrorHandling() {
    // Erreurs JavaScript non gérées
    window.addEventListener('error', (e) => {
      console.error('Erreur JavaScript globale:', e.error);
    });

    // Promesses rejetées non gérées
    window.addEventListener('unhandledrejection', (e) => {
      console.error('Promesse rejetée non gérée:', e.reason);
    });
  },

  /**
   * Configure la fermeture automatique des alerts
   */
  initAlertDismissal() {
    // Observer les nouveaux éléments alert ajoutés dynamiquement
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1 && node.classList?.contains('alert')) {
            // Gérer les nouvelles alertes ajoutées
            this.setupAlertDismissal(node);
          }
        });
      });
    });

    // Observer le conteneur de messages
    const container = document.getElementById('flash-messages');
    if (container) {
      observer.observe(container, { childList: true });
    }
  },

  /**
   * Configure la fermeture d'une alerte spécifique
   * @param {HTMLElement} alertElement - L'élément alert
   */
  setupAlertDismissal(alertElement) {
    const closeBtn = alertElement.querySelector('.btn-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        alertElement.classList.add('fade-out');
        setTimeout(() => alertElement.remove(), 300);
      });
    }
  },

  // UTILITAIRES GLOBAUX
  /**
   * Utilitaire pour débouncer les fonctions (éviter les appels trop fréquents)
   * @param {Function} func - Fonction à débouncer
   * @param {number} wait - Délai d'attente en ms
   * @returns {Function} Fonction débouncée
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  /**
   * Utilitaire pour formater les erreurs API
   * @param {Error} error - L'erreur à formater
   * @returns {string} Message d'erreur formaté
   */
  formatApiError(error) {
    if (error.message) {
      return error.message;
    }
    return 'Une erreur inattendue s\'est produite';
  }
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
