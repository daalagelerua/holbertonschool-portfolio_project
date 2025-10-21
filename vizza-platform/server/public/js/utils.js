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
      },

      /**
     * Annonce un message aux lecteurs d'écran (NVDA, JAWS, VoiceOver)
     * Utilise une région ARIA live cachée visuellement
     * 
     * @param {string} message - Message à annoncer
     * @param {string} priority - 'polite' (défaut) ou 'assertive' (urgent)
     * 
     * @example
     * Utils.announceToScreenReader('Recherche en cours');
     * Utils.announceToScreenReader('Erreur critique', 'assertive');
     */
    announceToScreenReader(message, priority = 'polite') {
        // Valider la priorité
        if (!['polite', 'assertive'].includes(priority)) {
            console.warn(`Priorité ARIA live invalide: ${priority}. Utilisation de 'polite' par défaut.`);
            priority = 'polite';
        }

        // Chercher ou créer l'annonceur
        let announcer = document.getElementById('screen-reader-announcer');
        
        if (!announcer) {
            // Créer l'élément d'annonce
            announcer = document.createElement('div');
            announcer.id = 'screen-reader-announcer';
            announcer.setAttribute('role', 'status');
            announcer.setAttribute('aria-live', priority);
            announcer.setAttribute('aria-atomic', 'true');
            // Cacher visuellement mais garder accessible
            announcer.className = 'visually-hidden';
            document.body.appendChild(announcer);
            
            console.log('Annonceur de lecteur d\'écran créé');
        } else {
            // Mettre à jour la priorité si elle a changé
            if (announcer.getAttribute('aria-live') !== priority) {
                announcer.setAttribute('aria-live', priority);
            }
        }
        
        // Vider le contenu pour forcer une nouvelle annonce
        announcer.textContent = '';
        
        // Ajouter le message après un court délai pour s'assurer qu'il est détecté
        setTimeout(() => {
            announcer.textContent = message;
            console.log(`Annonce (${priority}): ${message}`);
        }, 100);
    },

};


// Export global
window.Utils = Utils;
