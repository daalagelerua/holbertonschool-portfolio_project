// Objet principal Auth - utilisé dans index.ejs et autres pages
const Auth = {
  
  // VÉRIFICATION DE L'ÉTAT DE CONNEXION
  /**
   * Vérifie si l'utilisateur est connecté
   * Utilisé par: addToFavoritesFromHome() dans index.ejs
   * @returns {boolean} true si connecté, false sinon
   */
  isLoggedIn() {
    try {
    // Première vérification : cookie isLoggedIn
    const cookies = document.cookie.split(';');  // .split() divise le cookie en un tableau de sous-chaines
    
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'isLoggedIn' && value === 'true') {
        return true;
      }
    }
    
    return false;
      
    } catch (error) {
      console.error('Erreur vérification connexion:', error);
      return false;
    }
  },

  // AUTHENTIFICATION - CONNEXION/INSCRIPTION
  /**
   * Connecte un utilisateur
   * @param {string} email - Email de l'utilisateur
   * @param {string} password - Mot de passe
   * @returns {Promise<Object>} Données utilisateur si succès
   */
  async login(email, password) {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Important pour recevoir le cookie
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erreur de connexion');
      }
      
      if (!data.success) {
        throw new Error(data.message || 'Échec de la connexion');
      }

      // Succès - le cookie est automatiquement défini par le serveur
      return data.user;
      
    } catch (error) {
      console.error('Erreur login:', error);
      throw error;
    }
  },

  /**
   * Inscrit un nouvel utilisateur
   * @param {Object} userData - Données d'inscription
   * @returns {Promise<Object>} Données utilisateur si succès
   */
  async register(userData) {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(userData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erreur d\'inscription');
      }
      
      if (!data.success) {
        throw new Error(data.message || 'Échec de l\'inscription');
      }
      
      return data.user;
      
    } catch (error) {
      console.error('Erreur register:', error);
      throw error;
    }
  },

  /**
   * Déconnecte l'utilisateur
   * @returns {Promise<void>}
   */
  async logout() {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });

      // Même si le serveur supprime le cookie httpOnly (token), supprimez également 
      // manuellement le cookie non-httpOnly côté client (isLoggedIn)
      document.cookie = 'isLoggedIn=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      
      const data = await response.json();
      
      if (!response.ok) {
        // Même en cas d'erreur serveur, on considère la déconnexion côté client
        console.warn('Erreur déconnexion serveur, mais déconnexion locale');
      }
      
      // Redirection vers la page d'accueil après déconnexion
      window.location.href = '/';
      
    } catch (error) {
      console.error('Erreur logout:', error);
      // En cas d'erreur réseau, forcer la déconnexion locale
      this.forceLogout();  // supprime tous les cookies localement
    }
  },

  /**
   * Force la déconnexion côté client (en cas d'erreur serveur)
   */
  forceLogout() {
    // Supprimer le cookie côté client (best effort)
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'isLoggedIn=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    // Redirection
    window.location.href = '/';
  },

  // GESTION DU PROFIL UTILISATEUR
  /**
   * Récupère les informations du profil utilisateur connecté
   * @returns {Promise<Object>} Données du profil
   */
  async getProfile() {
    try {
      const response = await fetch('/api/auth/profile', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Non authentifié');
        }
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success || !data.user) {
        throw new Error('Profil non disponible');
      }
      
      return data.user;
      
    } catch (error) {
      console.error('Erreur getProfile:', error);
      throw error;
    }
  },

  // UTILITAIRES POUR L'INTERFACE
  /**
   * Initialise l'interface utilisateur selon l'état de connexion
   * À appeler au chargement de chaque page
   */
  async initializeUI() {
  try {
    const isLogged = this.isLoggedIn();
    if (isLogged) {
      // Utilisateur connecté - récupérer ses infos
      if (isLogged) {
        try {
          const user = await this.getProfile();
          this.showLoggedInUI(user);
        } catch (profileError) {
          console.error('Erreur récupération profil:', profileError);
          // Tentative de récupération en mode dégradé
          this.showLoggedInUI({firstName: 'Utilisateur'});
        }
      } else {
        // Utilisateur non connecté
        this.showLoggedOutUI();
      }
    } else {
      // Utilisateur non connecté
      this.showLoggedOutUI();
    }
  } catch (error) {
    console.error('Erreur initialisation UI:', error);
    // En cas d'erreur, considérer comme non connecté
    this.showLoggedOutUI();
  }
},

  /**
   * Affiche l'interface pour utilisateur connecté
   * @param {Object} user - Données utilisateur
   */
  showLoggedInUI(user) {
    // Masquer les liens de connexion/inscription
    const loginNav = document.getElementById('login-nav');
    const registerNav = document.getElementById('register-nav');
    
    if (loginNav) loginNav.style.display = 'none';
    if (registerNav) registerNav.style.display = 'none';
    
    // Afficher le menu utilisateur
    const userMenu = document.getElementById('user-menu');
    const userName = document.getElementById('user-name');
    
    if (userMenu) userMenu.style.display = 'block';
    if (userName) userName.textContent = user.firstName;
    
    // Afficher les favoris dans la navigation
    const favoritesNav = document.getElementById('favorites-nav');
    const favoritesCount = document.getElementById('favorites-count');
    
    if (favoritesNav) favoritesNav.style.display = 'block';
    if (favoritesCount && user.favoriteCount !== undefined) {
      favoritesCount.textContent = user.favoriteCount;
    }
  },

  /**
   * Affiche l'interface pour utilisateur non connecté
   */
  showLoggedOutUI() {
    // Afficher les liens de connexion/inscription
    const loginNav = document.getElementById('login-nav');
    const registerNav = document.getElementById('register-nav');
    
    if (loginNav) loginNav.style.display = 'block';
    if (registerNav) registerNav.style.display = 'block';
    
    // Masquer le menu utilisateur et favoris
    const userMenu = document.getElementById('user-menu');
    const favoritesNav = document.getElementById('favorites-nav');
    
    if (userMenu) userMenu.style.display = 'none';
    if (favoritesNav) favoritesNav.style.display = 'none';
  }
};

// Export pour utilisation globale
window.Auth = Auth;

// Initialiser l'interface au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
  Auth.initializeUI();
});
