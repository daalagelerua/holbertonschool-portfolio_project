// Configuration de base
const API_BASE_URL = '/api';  // Chemin relatif vers le backend

// Objet principal API - utilisé dans index.ejs
const API = {
  
  // GESTION DES PAYS
  /**
   * Récupère la liste de tous les pays disponibles
   * Utilisé par: loadCountriesForSearch() dans index.ejs
   * @returns {Promise<Array>} Liste des pays avec code, nom, flag
   */
  async getCountries() {
    try {  // response contient : status:, ok:, headers:, body:
      const response = await fetch(`${API_BASE_URL}/visas/countries`);
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();  // .json transforme en objet js
      
      // Vérification de la structure de réponse
      if (!data.success || !data.countries) {
        throw new Error('Format de réponse invalide');
      }
      
      return data.countries;  // Pas besoin de success on veut juste le tableau de pays
      
    } catch (error) {
      console.error('Erreur getCountries:', error);
      throw new Error('Impossible de charger les pays');
    }
  },

  // RECHERCHE DE VISAS
  /**
   * Recherche un visa spécifique entre deux pays
   * Utilisé par: handleQuickSearch() dans index.ejs
   * @param {string} from - Code du pays de départ (ex: "FR")
   * @param {string} to - Code du pays de destination (ex: "US")
   * @returns {Promise<Object>} Informations complètes du visa
   */
  async searchVisa(from, to) {
    try {
      // Validation des paramètres
      if (!from || !to) {
        throw new Error('Paramètres manquants: from et to requis');
      }
      
      const response = await fetch(`${API_BASE_URL}/visas/search?from=${from}&to=${to}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Visa non trouvé pour cette combinaison de pays');
        }
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success || !data.visa) {
        throw new Error('Aucun visa trouvé');
      }
      
      return data;  // data entier parce qu'on veut aussi les metadata
      
    } catch (error) {
      console.error('Erreur searchVisa:', error);
      throw error; // Remonte l'erreur pour gestion spécifique
    }
  },

  // STATISTIQUES
  /**
   * Récupère les statistiques générales de l'application
   * Utilisé par: loadHomeStats() dans index.ejs
   * @returns {Promise<Object>} Statistiques (pays, visas, etc.)
   */
  async getStats() {
    try {
      const response = await fetch(`${API_BASE_URL}/visas/stats`);
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success || !data.statistics) {
        throw new Error('Statistiques non disponibles');
      }
      
      return data.statistics;
      
    } catch (error) {
      console.error('Erreur getStats:', error);
      throw new Error('Impossible de charger les statistiques');
    }
  },

  // GESTION DES FAVORIS (nécessite authentification)
  /**
   * Ajoute un visa aux favoris de l'utilisateur
   * Utilisé par: addToFavoritesFromHome() dans index.ejs
   * @param {string} from - Code du pays de départ
   * @param {string} to - Code du pays de destination
   * @returns {Promise<Object>} Confirmation de l'ajout
   */
  async addToFavorites(from, to) {
    try {
      const response = await fetch(`${API_BASE_URL}/visas/favorites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'  // obligatoire pour POST/PUT avec body -> json pour que le server sache comment parser
        },
        credentials: 'include',  // Inclut les cookies (token JWT)
        body: JSON.stringify({ from, to })  // stingify() -> transforme l'objet js en texte
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Vous devez être connecté pour ajouter des favoris');
        }
        if (response.status === 409) {
          throw new Error('Ce visa est déjà dans vos favoris');
        }
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Erreur lors de l\'ajout aux favoris');
      }
      
      return data;
      
    } catch (error) {
      console.error('Erreur addToFavorites:', error);
      throw error;
    }
  },

  /**
   * Supprime un visa des favoris de l'utilisateur
   * @param {string} from - Code du pays de départ
   * @param {string} to - Code du pays de destination
   * @returns {Promise<Object>} Confirmation de la suppression
   */
  async removeFromFavorites(from, to) {
    try {
      const response = await fetch(`${API_BASE_URL}/visas/favorites`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ from, to })
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Vous devez être connecté');
        }
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Erreur lors de la suppression');
      }
      
      return data;
      
    } catch (error) {
      console.error('Erreur removeFromFavorites:', error);
      throw error;
    }
  },

  /**
   * Récupère tous les favoris de l'utilisateur
   * @returns {Promise<Array>} Liste des favoris avec détails
   */
  async getFavorites() {
    try {
      const response = await fetch(`${API_BASE_URL}/visas/favorites`, {
        credentials: 'include'
      });  // GET par defaut
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Vous devez être connecté');
        }
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error('Erreur lors de la récupération des favoris');
      }
      
      return data.favorites || [];
      
    } catch (error) {
      console.error('Erreur getFavorites:', error);
      throw error;
    }
  }
};

// Export pour utilisation globale
window.API = API;
