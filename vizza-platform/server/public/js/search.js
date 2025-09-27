document.addEventListener('DOMContentLoaded', function() {
    console.log('Page de recherche chargée');
    
    // Initialiser la page
    initSearchForm();
    loadCountriesForSearch().then(() => {
        handleUrlParameters();
    });
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
                
                <div class="mt-4">
                    <p class="text-muted">${visa.requirement.description}</p>
                </div>
                
                <div class="row mt-4">
                    <div class="col-12">
                        <div id="country-info">
                            <div class="text-center">
                                <div class="spinner-border spinner-border-sm" role="status">
                                    <span class="visually-hidden">Chargement...</span>
                                </div>
                                <small class="d-block">Chargement des informations sur ${visa.journey.to.name}...</small>
                            </div>
                        </div>
                    </div>
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

    // Charger les informations du pays de destination
    loadCountryInfo(visa.journey.to.code);

    // Event listeners pour les favoris
    const favoriteButton = resultsContainer.querySelector('.add-favorite-btn');
    if (favoriteButton) {
      favoriteButton.addEventListener('click', function() {
        const from = this.getAttribute('data-from');
        const to = this.getAttribute('data-to');
        addToFavorites(from, to);
      });
    }
}

async function loadCountryInfo(countryCode) {
    try {
        const response = await fetch(`https://restcountries.com/v3.1/alpha/${countryCode}`);
        const data = await response.json();
        const country = data[0];
        
        const countryInfoDiv = document.getElementById('country-info');
        if (countryInfoDiv) {
            countryInfoDiv.innerHTML = `
                <h6>À propos de ${country.name.common}</h6>
                <ul class="list-group list-group-flush">
                    <li class="list-group-item d-flex justify-content-between">
                        <span>Capitale</span>
                        <strong>${country.capital ? country.capital[0] : 'N/A'}</strong>
                    </li>
                    <li class="list-group-item d-flex justify-content-between">
                        <span>Population</span>
                        <strong>${country.population?.toLocaleString() || 'N/A'}</strong>
                    </li>
                    <li class="list-group-item d-flex justify-content-between">
                        <span>Monnaie</span>
                        <strong>${getMainCurrency(country.currencies)}</strong>
                    </li>
                    <li class="list-group-item d-flex justify-content-between">
                        <span>Langues</span>
                        <strong>${getMainLanguages(country.languages)}</strong>
                    </li>
                </ul>
            `;
        }
    } catch (error) {
        console.error('Erreur chargement infos pays:', error);
        const countryInfoDiv = document.getElementById('country-info');
        if (countryInfoDiv) {
            countryInfoDiv.innerHTML = '<small class="text-muted">Informations non disponibles</small>';
        }
    }
}

function getMainCurrency(currencies) {
    if (!currencies) return 'N/A';
    const currencyKey = Object.keys(currencies)[0];
    return currencies[currencyKey]?.name || currencyKey;
}

function getMainLanguages(languages) {
    if (!languages) return 'N/A';
    return Object.values(languages).slice(0, 2).join(', ');
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
    addToFavorites
};
