const Utils = {
    
    /**
     * Valide le format d'un email avec une regex
     * @param {string} email - Email à valider
     * @returns {boolean} true si valide, false sinon
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },
    
    /**
     * Vérifie si l'utilisateur est déjà connecté et redirige vers l'accueil
     * Utilisé dans les pages login et register
     */
    checkIfAlreadyLoggedIn() {
        if (Auth.isLoggedIn()) {
            Main.showFlashMessage('Vous êtes déjà connecté', 'info');
            setTimeout(() => {
                window.location.href = '/';
            }, 2000);
        }
    },
    
    /**
     * Charge les pays dans un ou plusieurs <select> avec tri alphabétique
     * @param {string|Array} selectIds - ID(s) du/des select(s) à remplir
     * @returns {Promise<void>}
     */
    async loadCountriesIntoSelect(selectIds) {
        try {
            const countries = await API.getCountries();
            
            // Tri alphabétique
            countries.sort((a, b) => a.name.localeCompare(b.name));
            
            // Convertir en tableau si string unique
            const ids = Array.isArray(selectIds) ? selectIds : [selectIds];
            
            // Remplir chaque select
            ids.forEach(selectId => {
                const select = document.getElementById(selectId);
                
                if (!select) {
                    console.warn(`Select "${selectId}" non trouvé`);
                    return;
                }
                
                countries.forEach(country => {
                    const option = new Option(
                        `${country.flag} ${country.name}`, 
                        country.code
                    );
                    select.add(option);
                });
            });
            
        } catch (error) {
            console.error('Erreur chargement pays:', error);
            Main.showFlashMessage('Impossible de charger la liste des pays', 'warning');
        }
    },
    
    /**
     * Ajoute un visa aux favoris avec vérification d'authentification
     * @param {string} from - Code pays origine
     * @param {string} to - Code pays destination
     * @returns {Promise<boolean>} true si succès, false si échec
     */
    async addToFavorites(from, to) {
        if (!Auth.isLoggedIn()) {
            Main.showFlashMessage('Connectez-vous pour ajouter des favoris', 'info');
            setTimeout(() => window.location.href = '/login', 2000);
            return false;
        }
        
        try {
            await API.addToFavorites(from, to);
            Main.showFlashMessage('Ajouté aux favoris !', 'success');
            return true;
            
        } catch (error) {
            console.error('Erreur ajout favori:', error);
            Main.showFlashMessage('Erreur lors de l\'ajout aux favoris', 'danger');
            return false;
        }
    },

      /**
      * Met à jour le compteur de favoris dans la navbar
      */
      async updateFavoritesCounter() {
          try {
              const countElement = document.getElementById('favorites-count');
              if (!countElement) return;
          
              const favorites = await API.getFavorites();
              countElement.textContent = favorites.length;
          } catch (error) {
              console.warn('Impossible de mettre à jour le compteur de favoris');
          }
      }
};


// Export global
window.Utils = Utils;
