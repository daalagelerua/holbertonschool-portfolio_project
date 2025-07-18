document.addEventListener('DOMContentLoaded', function() {
    console.log('Page de recherche chargée');
    
    // Initialiser la page
    initSearchForm();
    loadCountriesForSearch();
    initRecentSearches();
    handleUrlParameters();
});

/**
 * Initialise le formulaire de recherche avancée
 */
function initSearchForm() {
    const searchForm = document.getElementById('advanced-search-form');
    
    if (!searchForm) {
        console.error('Formulaire de recherche non trouvé');
        return;
    }
    
    searchForm.addEventListener('submit', handleAdvancedSearch);
}

/**
 * Charge les pays dans les selects de recherche
 */
async function loadCountriesForSearch() {
    try {
        const countries = await API.getCountries();
        const originSelect = document.getElementById('origin-country');
        const destSelect = document.getElementById('destination-country');
        
        if (!originSelect || !destSelect) {
            console.warn('Selects de pays non trouvés');
            return;
        }
        
        // Trier les pays par nom
        countries.sort((a, b) => a.name.localeCompare(b.name));
        
        // Remplir les deux selects
        countries.forEach(country => {
            const option1 = document.createElement('option');
            option1.value = country.code;
            option1.textContent = `${country.flag} ${country.name}`;
            originSelect.appendChild(option1);
            
            const option2 = document.createElement('option');
            option2.value = country.code;
            option2.textContent = `${country.flag} ${country.name}`;
            destSelect.appendChild(option2);
        });
        
    } catch (error) {
        console.error('Erreur chargement pays:', error);
        Main.showFlashMessage('Impossible de charger la liste des pays', 'warning');
    }
}

/**
 * Gère la soumission du formulaire de recherche
 * @param {Event} event - Événement de soumission
 */
async function handleAdvancedSearch(event) {
    event.preventDefault();
    
    const from = document.getElementById('origin-country').value;
    const to = document.getElementById('destination-country').value;
    
    if (!from || !to) {
        Main.showFlashMessage('Veuillez sélectionner les deux pays', 'warning');
        return;
    }
    
    if (from === to) {
        Main.showFlashMessage('Les pays de départ et de destination doivent être différents', 'warning');
        return;
    }
    
    try {
        // Afficher le loading
        showSearchLoading();
        
        // Effectuer la recherche
        const result = await API.searchVisa(from, to);
        
        // Afficher le résultat
        displaySearchResult(result);
        
        // Sauvegarder dans les recherches récentes
        saveToRecentSearches(from, to, result.visa);
        
        // Mettre à jour l'URL
        updateUrlWithSearch(from, to);
        
    } catch (error) {
        console.error('Erreur de recherche:', error);
        hideSearchResult();
        
        let errorMessage = 'Erreur lors de la recherche';
        if (error.message.includes('non trouvé')) {
            errorMessage = 'Aucune information de visa trouvée pour cette combinaison';
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        Main.showFlashMessage(errorMessage, 'danger');
    }
}

/**
 * Affiche l'état de chargement
 */
function showSearchLoading() {
    const resultsContainer = document.getElementById('search-results');
    const placeholder = document.getElementById('search-placeholder');
    
    if (placeholder) {
        placeholder.style.display = 'none';
    }
    
    resultsContainer.innerHTML = `
        <div class="text-center py-5">
            <div class="loading-spinner mb-3"></div>
            <h4>Recherche en cours...</h4>
            <p class="text-muted">Récupération des informations de visa</p>
        </div>
    `;
}

/**
 * Affiche le résultat de recherche
 * @param {Object} result - Résultat de l'API
 */
function displaySearchResult(result) {
    const resultsContainer = document.getElementById('search-results');
    const visa = result.visa;
    
    resultsContainer.innerHTML = `
        <div class="visa-card mb-4">
            <div class="visa-card-header d-flex justify-content-between align-items-center">
                <div>
                    <span class="flag-icon">${visa.journey.from.flag}</span>
                    <span class="country-name">${visa.journey.from.name}</span>
                </div>
                <i class="bi bi-arrow-right fs-3 text-muted"></i>
                <div>
                    <span class="flag-icon">${visa.journey.to.flag}</span>
                    <span class="country-name">${visa.journey.to.name}</span>
                </div>
            </div>
            
            <div class="visa-card-body">
                <div class="text-center mb-4">
                    <span class="visa-level-badge visa-level-${visa.requirement.level}">
                        ${visa.requirement.text}
                    </span>
                </div>
                
                <div class="row">
                    <div class="col-md-6">
                        <ul class="list-group list-group-flush">
                            ${visa.details.maxStay ? `
                                <li class="list-group-item d-flex justify-content-between">
                                    <span>Durée maximale</span>
                                    <strong>${visa.details.maxStay}</strong>
                                </li>
                            ` : ''}
                            ${visa.details.cost ? `
                                <li class="list-group-item d-flex justify-content-between">
                                    <span>Coût</span>
                                    <strong>${visa.details.cost}</strong>
                                </li>
                            ` : ''}
                        </ul>
                    </div>
                    <div class="col-md-6">
                        <ul class="list-group list-group-flush">
                            ${visa.details.processingTime ? `
                                <li class="list-group-item d-flex justify-content-between">
                                    <span>Délai de traitement</span>
                                    <strong>${visa.details.processingTime}</strong>
                                </li>
                            ` : ''}

                        </ul>
                    </div>
                </div>
                
                <div class="mt-4">
                    <p class="text-muted">${visa.requirement.description}</p>
                    ${visa.details.notes ? `<p><small class="text-muted">${visa.details.notes}</small></p>` : ''}
                </div>
                
                <div class="text-center mt-4">
                    ${!visa.metadata.isFavorite ? `
                        <button class="btn btn-outline-warning add-favorite-btn" data-from="${visa.journey.from.code}" data-to="${visa.journey.to.code}">
                            <i class="bi bi-star me-1"></i>
                            Ajouter aux favoris
                        </button>
                    ` : `
                        <button class="btn btn-warning" disabled>
                            <i class="bi bi-star-fill me-1"></i>
                            Déjà en favoris
                        </button>
                    `}
                </div>
            </div>
        </div>
    `;
    const favoriteButton = resultsContainer.querySelector('.add-favorite-btn');
    if (favoriteButton) {
      favoriteButton.addEventListener('click', function() {
        const from = this.getAttribute('data-from');
        const to = this.getAttribute('data-to');
        addToFavorites(from, to);
      });
    }
}

/**
 * Masque le résultat de recherche
 */
function hideSearchResult() {
    const resultsContainer = document.getElementById('search-results');
    const placeholder = document.getElementById('search-placeholder');
    
    resultsContainer.innerHTML = '';
    if (placeholder) {
        placeholder.style.display = 'block';
    }
}

/**
 * Gère les paramètres d'URL pour pré-remplir la recherche
 */
function handleUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const from = urlParams.get('from');
    const to = urlParams.get('to');
    
    if (from) {
        const originSelect = document.getElementById('origin-country');
        if (originSelect) {
            originSelect.value = from.toUpperCase();
        }
    }
    
    if (to) {
        const destSelect = document.getElementById('destination-country');
        if (destSelect) {
            destSelect.value = to.toUpperCase();
        }
    }
    
    // Déclencher une recherche automatique si les deux paramètres sont présents
    if (from && to) {
        setTimeout(() => {
            document.getElementById('advanced-search-form').dispatchEvent(new Event('submit'));
        }, 1000);
    }
}

/**
 * Met à jour l'URL avec les paramètres de recherche
 * @param {string} from - Code pays origine
 * @param {string} to - Code pays destination
 */
function updateUrlWithSearch(from, to) {
    const url = new URL(window.location);
    url.searchParams.set('from', from);
    url.searchParams.set('to', to);
    history.replaceState(null, '', url);
}

/**
 * Initialise les recherches récentes
 */
function initRecentSearches() {
    loadRecentSearches();
}

/**
 * Sauvegarde une recherche dans l'historique récent
 * @param {string} from - Code pays origine
 * @param {string} to - Code pays destination
 * @param {Object} visa - Données du visa
 */
function saveToRecentSearches(from, to, visa) {
    try {
        // Vérifier si l'utilisateur est connecté
        if (!Auth.isLoggedIn()) {
            console.log('Utilisateur non connecté, recherche non sauvegardée');
            return; // Ne pas sauvegarder pour les utilisateurs non connectés
        }
        
        // Récupérer l'ID ou email de l'utilisateur si disponible
        let userId = 'anonymous';
        try {
            const user = JSON.parse(localStorage.getItem('userData') || '{}');
            userId = user.id || user.email || 'anonymous';
        } catch (e) {
            console.warn('Impossible de récupérer les données utilisateur');
        }
        
        // Clé spécifique à l'utilisateur
        const storageKey = `vizza_recent_searches_${userId}`;
        
        let recentSearches = JSON.parse(localStorage.getItem(storageKey) || '[]');
        
        // Supprimer la recherche si elle existe déjà
        recentSearches = recentSearches.filter(search => 
            !(search.from === from && search.to === to)
        );
        
        // Ajouter en première position
        recentSearches.unshift({
            from,
            to,
            fromName: visa.journey.from.name,
            toName: visa.journey.to.name,
            fromFlag: visa.journey.from.flag,
            toFlag: visa.journey.to.flag,
            requirement: visa.requirement.level,
            searchedAt: new Date().toISOString()
        });
        
        // Garder seulement les 5 dernières
        recentSearches = recentSearches.slice(0, 5);
        
        localStorage.setItem('vizza_recent_searches', JSON.stringify(recentSearches));
        loadRecentSearches();
        
    } catch (error) {
        console.warn('Impossible de sauvegarder la recherche récente:', error);
    }
}

/**
 * Charge et affiche les recherches récentes
 */
function loadRecentSearches() {
    try {
        // Vérifier si l'utilisateur est connecté
        if (!Auth.isLoggedIn()) {
            const container = document.getElementById('recent-searches');
            if (container) {
                container.innerHTML = `
                    <li class="list-group-item text-center">
                        <i class="bi bi-lock me-2"></i>
                        Connectez-vous pour voir vos recherches récentes
                    </li>
                `;
            }
            return;
        }
        
        // Récupérer l'ID ou email de l'utilisateur
        let userId = 'anonymous';
        try {
            const user = JSON.parse(localStorage.getItem('userData') || '{}');
            userId = user.id || user.email || 'anonymous';
        } catch (e) {
            console.warn('Impossible de récupérer les données utilisateur');
        }
        
        // Utiliser la clé spécifique à l'utilisateur
        const storageKey = `vizza_recent_searches_${userId}`;
        const recentSearches = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const container = document.getElementById('recent-searches');
        
        if (!container) return;
        
        if (recentSearches.length === 0) {
            container.innerHTML = `
                <li class="list-group-item text-center text-muted">
                    Aucune recherche récente
                </li>
            `;
            return;
        }
        
        container.innerHTML = recentSearches.map(search => `
            <li class="list-group-item list-group-item-action" 
                style="cursor: pointer;"
                data-from="${search.from}" 
                data-to="${search.to}">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <span>${search.fromFlag} ${search.fromName}</span>
                        <i class="bi bi-arrow-right mx-2"></i>
                        <span>${search.toFlag} ${search.toName}</span>
                    </div>
                    <div>
                        <span class="badge bg-${getColorFromLevel(search.requirement)} text-dark">
                            ${search.requirement}
                        </span>
                    </div>
                </div>
                <small class="text-muted">
                    ${new Date(search.searchedAt).toLocaleDateString('fr-FR')}
                </small>
            </li>
        `).join('');

        container.querySelectorAll('.recent-search-item').forEach(item => {
            item.addEventListener('click', function() {
                const from = this.getAttribute('data-from');
                const to = this.getAttribute('data-to');
                quickSearchFromRecent(from, to);
            });
        });
        
    } catch (error) {
        console.warn('Impossible de charger les recherches récentes:', error);
    }
}

/**
 * Effectue une recherche depuis l'historique récent
 * @param {string} from - Code pays origine
 * @param {string} to - Code pays destination
 */
function quickSearchFromRecent(from, to) {
    document.getElementById('origin-country').value = from;
    document.getElementById('destination-country').value = to;
    document.getElementById('advanced-search-form').dispatchEvent(new Event('submit'));
}

/**
 * Ajoute un visa aux favoris
 * @param {string} from - Code pays origine
 * @param {string} to - Code pays destination
 */
async function addToFavorites(from, to) {
    if (!Auth.isLoggedIn()) {
        Main.showFlashMessage('Connectez-vous pour ajouter des favoris', 'info');
        setTimeout(() => window.location.href = '/login', 2000);
        return;
    }
    
    try {
        await API.addToFavorites(from, to);
        Main.showFlashMessage('Ajouté aux favoris !', 'success');
        
        // Recharger le résultat pour mettre à jour l'interface
        const result = await API.searchVisa(from, to);
        displaySearchResult(result);
        
    } catch (error) {
        console.error('Erreur ajout favori:', error);
        Main.showFlashMessage('Erreur lors de l\'ajout aux favoris', 'danger');
    }
}

/**
 * Retourne la couleur bootstrap selon le niveau de visa
 * @param {string} level - Niveau ('green', 'blue', 'yellow', 'red')
 * @returns {string} Classe couleur Bootstrap
 */
function getColorFromLevel(level) {
    const colors = {
        green: 'success',
        yellow: 'warning', 
        blue: 'info',
        red: 'danger'
    };
    return colors[level] || 'secondary';
}

// Export pour utilisation globale
window.SearchPage = {
    handleAdvancedSearch,
    addToFavorites,
    quickSearchFromRecent
};
