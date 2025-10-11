document.addEventListener('DOMContentLoaded', function() {
    // Charger les pays pour la recherche rapide
    Utils.loadCountriesIntoSelect(['from-country', 'to-country']);
    
    // Charger les statistiques
    loadHomeStats();
    
    // Gérer la recherche rapide
    handleQuickSearch();
});

// Charger les statistiques
async function loadHomeStats() {
    try {
        const stats = await API.getStats();
        // afficher les nombres dans le DOM
        document.getElementById('total-countries').textContent = stats.countries.active;  // textContent -> texte brut, innerHTML interprete le html
        document.getElementById('total-visas').textContent = stats.visas.total.toLocaleString();  // toLocaleString() formate les nombres selon les conventions du pays de l'utilisateur
        document.getElementById('green-visas').textContent = stats.visas.byLevel.green.toLocaleString();  // utile ici pour la lisibilité 2 110 au lieu de 2110
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
    // récuperer le formulaire
    const form = document.getElementById('quick-search-form');

    // écouter la soumission du formulaire
    // e -> event object: c'est un objet automatiquement créé par le navigateur qui contient toutes les infos sur l'evenement qui vient de se produire
    form.addEventListener('submit', async (e) => {  // type: 'submit', target: 'form', ...
        e.preventDefault();
        
        const from = document.getElementById('from-country').value;  // .value contient toujours country.code comme vu plus haut
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

// Afficher le résultat de recherche rapide
function displayQuickSearchResult(result) {
    const resultSection = document.getElementById('quick-result');
    const resultCard = document.getElementById('visa-result-card');
    const visa = result.visa;
    
    resultCard.innerHTML = `
        <!-- affiche les 2 pays avec une fleche entre les 2 -->
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

        <!-- affiche les infos du visa avec badge coloré selon type -->
        <div class="visa-card-body">
            <div class="text-center mb-3">
                <span class="visa-level-badge visa-level-${visa.requirement.level}">
                    ${visa.requirement.text}
                </span>
            </div>
            
            <p class="text-center mb-3">${visa.requirement.description}</p>
            
            <!-- lien vers recherche avancée -->
            <div class="text-center mt-4">
                <a href="/search?from=${visa.journey.from.code}&to=${visa.journey.to.code}" 
                   class="btn btn-primary me-2">
                    <i class="bi bi-info-circle me-1"></i>
                    Plus de détails
                </a>

                <!-- bouton des favoris (ne s'affiche que si la combinaison de pays ne fait pas deja partie des favoris -->
                ${visa.metadata.isFavorite ? '' : `
                    <button class="btn btn-outline-warning" id="add-favorite-btn" data-from="${visa.journey.from.code}" data-to="${visa.journey.to.code}">
                        <i class="bi bi-star me-1"></i>
                        Ajouter aux favoris
                    </button>
                `}
            </div>
        </div>
    `;

    // Afficher la section et scroller
    resultSection.style.display = 'block';
    resultSection.scrollIntoView({ behavior: 'smooth' });

    const favoriteButton = document.getElementById('add-favorite-btn');
  if (favoriteButton) {
    favoriteButton.addEventListener('click', function() {
      const from = this.getAttribute('data-from');  // recupere code du pays
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
     const success = await Utils.addToFavorites(from, to);

     if (success) {
        const result = await API.searchVisa(from, to);
        displayQuickSearchResult(result);
        Utils.updateFavoritesCounter();
    }
}
