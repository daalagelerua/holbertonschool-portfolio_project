document.addEventListener('DOMContentLoaded', function() {
    // Charger les pays pour la recherche rapide
    loadCountriesForSearch();
    
    // Charger les statistiques
    loadHomeStats();
    
    // Gérer la recherche rapide
    handleQuickSearch();
});

// Charger les pays dans les dropdowns
async function loadCountriesForSearch() {
    try {
        const countries = await API.getCountries();
        const fromSelect = document.getElementById('from-country');
        const toSelect = document.getElementById('to-country');
        
        countries.forEach(country => {
            const option1 = new Option(`${country.flag} ${country.name}`, country.code);
            const option2 = new Option(`${country.flag} ${country.name}`, country.code);
            fromSelect.add(option1);
            toSelect.add(option2);
        });
    } catch (error) {
        console.error('Erreur chargement pays:', error);
        Main.showFlashMessage('Erreur lors du chargement des pays', 'danger');
    }
}

// Charger les statistiques
async function loadHomeStats() {
    try {
        const stats = await API.getStats();
        
        document.getElementById('total-countries').textContent = stats.countries.active;
        document.getElementById('total-visas').textContent = stats.visas.total.toLocaleString();
        document.getElementById('green-visas').textContent = stats.visas.byLevel.green.toLocaleString();
    } catch (error) {
        console.error('Erreur chargement statistiques:', error);

        // Valeurs par défaut
        document.getElementById('total-countries').textContent = 'N/A';
        document.getElementById('total-visas').textContent = 'N/A';
        document.getElementById('green-visas').textContent = 'N/A';
    
        // Message info
        Main.showFlashMessage('Statistiques temporairement indisponibles', 'info');
    }
}

// Gérer la recherche rapide
function handleQuickSearch() {
    const form = document.getElementById('quick-search-form');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const from = document.getElementById('from-country').value;
        const to = document.getElementById('to-country').value;
        
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
            showQuickSearchLoading();
            
            // Rechercher le visa
            const result = await API.searchVisa(from, to);
            
            // Afficher le résultat
            displayQuickSearchResult(result);
            
        } catch (error) {
            console.error('Erreur recherche rapide:', error);
            hideQuickSearchResult();
            Main.showFlashMessage('Erreur lors de la recherche. Essayez la page de recherche détaillée.', 'danger');
        }
    });
}

// Afficher le loading de recherche rapide
function showQuickSearchLoading() {
    const resultSection = document.getElementById('quick-result');
    const resultCard = document.getElementById('visa-result-card');
    
    resultCard.innerHTML = `
        <div class="text-center p-4">
            <div class="loading-spinner mb-3"></div>
            <p>Recherche en cours...</p>
        </div>
    `;
    
    resultSection.style.display = 'block';
    resultSection.scrollIntoView({ behavior: 'smooth' });
}

// Afficher le résultat de recherche rapide
function displayQuickSearchResult(result) {
    const resultCard = document.getElementById('visa-result-card');
    const visa = result.visa;
    
    resultCard.innerHTML = `
        <div class="visa-card-header">
            <div class="d-flex justify-content-between align-items-center">
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
        </div>
        
        <div class="visa-card-body">
            <div class="text-center mb-3">
                <span class="visa-level-badge visa-level-${visa.requirement.level}">
                    ${visa.requirement.text}
                </span>
            </div>
            
            <p class="text-center mb-3">${visa.requirement.description}</p>
            
            <div class="text-center mt-4">
                <a href="/search?from=${visa.journey.from.code}&to=${visa.journey.to.code}" 
                   class="btn btn-primary me-2">
                    <i class="bi bi-info-circle me-1"></i>
                    Plus de détails
                </a>
                ${visa.metadata.isFavorite ? '' : `
                    <button class="btn btn-outline-warning" id="add-favorite-btn" data-from="${visa.journey.from.code}" data-to="${visa.journey.to.code}">
                        <i class="bi bi-star me-1"></i>
                        Ajouter aux favoris
                    </button>
                `}
            </div>
        </div>
    `;

    const favoriteButton = document.getElementById('add-favorite-btn');
  if (favoriteButton) {
    favoriteButton.addEventListener('click', function() {
      const from = this.getAttribute('data-from');
      const to = this.getAttribute('data-to');
      addToFavoritesFromHome(from, to);
    });
  }
}



// Masquer le résultat de recherche rapide
function hideQuickSearchResult() {
    document.getElementById('quick-result').style.display = 'none';
}

// Ajouter aux favoris depuis la page d'accueil
async function addToFavoritesFromHome(from, to) {
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
        displayQuickSearchResult(result);
        
    } catch (error) {
        console.error('Erreur ajout favori:', error);
        Main.showFlashMessage('Erreur lors de l\'ajout aux favoris', 'danger');
    }
}