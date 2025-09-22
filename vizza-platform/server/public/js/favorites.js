document.addEventListener('DOMContentLoaded', function() {
    console.log('Page des favoris chargée');
    
    // Vérifier l'authentification
    checkAuthentication();
    
    // Charger les favoris
    loadUserFavorites();
});

/**
 * Vérifie que l'utilisateur est connecté
 */
function checkAuthentication() {
    if (!Auth.isLoggedIn()) {
        Main.showFlashMessage('Vous devez être connecté pour voir vos favoris', 'warning');
        setTimeout(() => {
            window.location.href = '/login';
        }, 2000);
        return;
    }
}

/**
 * Charge et affiche les favoris de l'utilisateur
 */
async function loadUserFavorites() {
    try {
        // Afficher le loading
        showFavoritesLoading();
        
        // Récupérer les favoris depuis l'API
        const favorites = await API.getFavorites();
        
        // Afficher les favoris
        displayFavorites(favorites);
        
    } catch (error) {
        console.error('Erreur chargement favoris:', error);
        
        // Masquer le loading
        hideFavoritesLoading();
        
        if (error.message.includes('Vous devez être connecté')) {
            Main.showFlashMessage('Session expirée, veuillez vous reconnecter', 'warning');
            setTimeout(() => window.location.href = '/login', 2000);
        } else {
            Main.showFlashMessage('Erreur lors du chargement des favoris', 'danger');
            showEmptyState();
        }
    }
}

/**
 * Affiche l'état de chargement
 */
function showFavoritesLoading() {
    const container = document.getElementById('favorites-container');
    const emptyState = document.getElementById('empty-favorites');
    
    if (emptyState) {
        emptyState.style.display = 'none';
    }
    
    container.innerHTML = `
        <div class="col-12">
            <div class="text-center py-5">
                <div class="loading-spinner mb-3"></div>
                <h4>Chargement de vos favoris...</h4>
                <p class="text-muted">Récupération en cours</p>
            </div>
        </div>
    `;
}

/**
 * Masque le loading
 */
function hideFavoritesLoading() {
    const container = document.getElementById('favorites-container');
    container.innerHTML = '';
}

/**
 * Affiche la liste des favoris
 * @param {Array} favorites - Liste des favoris
 */
function displayFavorites(favorites) {
    const container = document.getElementById('favorites-container');
    const emptyState = document.getElementById('empty-favorites');
    
    if (!favorites || favorites.length === 0) {
        showEmptyState();
        return;
    }
    
    // Masquer l'état vide
    if (emptyState) {
        emptyState.style.display = 'none';
    }
    
    // Générer les cartes de favoris
    container.innerHTML = favorites.map(favorite => createFavoriteCard(favorite)).join('');
    
    document.querySelectorAll('.remove-favorite-btn').forEach(button => {
    button.addEventListener('click', function() {
      const from = this.getAttribute('data-from');
      const to = this.getAttribute('data-to');
      const id = this.getAttribute('data-id');
      removeFavorite(from, to, id);
    });
  });
  
    // Afficher la grille
    document.getElementById('favorites-grid').style.display = 'block';
    
    console.log(`${favorites.length} favoris affichés`);
}

/**
 * Crée une carte pour un favori
 * @param {Object} favorite - Données du favori
 * @returns {string} HTML de la carte
 */
function createFavoriteCard(favorite) {
    const addedDate = new Date(favorite.addedAt).toLocaleDateString('fr-FR');
    const detailsUrl = `/search?from=${favorite.journey.from.code}&to=${favorite.journey.to.code}`;
    
    return `
        <div class="col" data-favorite-id="${favorite.id}">
            <div class="visa-card">
                <div class="visa-card-header d-flex justify-content-between align-items-center">
                    <div>
                        <span class="flag-icon">${favorite.journey.from.flag}</span>
                        <span class="country-name">${favorite.journey.from.name}</span>
                    </div>
                    <i class="bi bi-arrow-right fs-3 text-muted"></i>
                    <div>
                        <span class="flag-icon">${favorite.journey.to.flag}</span>
                        <span class="country-name">${favorite.journey.to.name}</span>
                    </div>
                </div>
                
                <div class="visa-card-body">
                    <div class="text-center mb-3">
                        <span class="visa-level-badge visa-level-${favorite.requirement.level}">
                            ${favorite.requirement.text}
                        </span>
                    </div>
                    
                    ${favorite.details.maxStay ? `
                        <p class="text-center mb-2">
                            <i class="bi bi-clock me-1"></i>
                            Séjour maximum: <strong>${favorite.details.maxStay}</strong>
                        </p>
                    ` : ''}
                    
                    ${favorite.details.cost ? `
                        <p class="text-center mb-2">
                            <i class="bi bi-currency-euro me-1"></i>
                            Coût: <strong>${favorite.details.cost}</strong>
                        </p>
                    ` : ''}
                    
                    <p class="text-center text-muted mb-3">
                        <small>
                            <i class="bi bi-calendar me-1"></i>
                            Ajouté le ${addedDate}
                        </small>
                    </p>
                    
                    <div class="d-flex justify-content-between gap-2">
                        <a href="${detailsUrl}" class="btn btn-sm btn-primary flex-fill">
                            <i class="bi bi-info-circle me-1"></i>
                            Détails
                        </a>
                        <button class="btn btn-sm btn-outline-danger remove-favorite-btn" 
                                data-from="${favorite.journey.from.code}" 
                                data-to="${favorite.journey.to.code}" 
                                data-id="${favorite.id}">
                            <i class="bi bi-trash me-1"></i>
                            Supprimer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Affiche l'état vide (aucun favori)
 */
function showEmptyState() {
    const container = document.getElementById('favorites-container');
    const emptyState = document.getElementById('empty-favorites');
    const grid = document.getElementById('favorites-grid');
    
    container.innerHTML = '';
    
    if (grid) {
        grid.style.display = 'none';
    }
    
    if (emptyState) {
        emptyState.style.display = 'block';
    }
}

/**
 * Supprime un favori
 * @param {string} from - Code pays origine
 * @param {string} to - Code pays destination
 * @param {string} favoriteId - ID du favori pour l'animation
 */
async function removeFavorite(from, to, favoriteId) {
    // Demander confirmation
    if (!confirm(`Supprimer ce favori de vos destinations ?`)) {
        return;
    }
    
    try {
        // Désactiver le bouton pendant la suppression
        const card = document.querySelector(`[data-favorite-id="${favoriteId}"]`);
        const button = card?.querySelector('.btn-outline-danger');
        if (button) {
            button.disabled = true;
            button.innerHTML = '<i class="bi bi-spinner-border"></i>';
        }
        
        // Supprimer via l'API
        await API.removeFromFavorites(from, to);
        
        // Animation de suppression
        if (card) {
            card.classList.add('fade-out');
            setTimeout(() => {
                card.remove();
                checkIfNowEmpty();
            }, 300);
        }
        
        Main.showFlashMessage('Favori supprimé', 'success');
        
        // Mettre à jour le compteur dans la nav
        updateFavoritesCount();
        
    } catch (error) {
        console.error('Erreur suppression favori:', error);
        
        // Réactiver le bouton
        const card = document.querySelector(`[data-favorite-id="${favoriteId}"]`);
        const button = card?.querySelector('.btn-outline-danger');
        if (button) {
            button.disabled = false;
            button.innerHTML = '<i class="bi bi-trash me-1"></i>Supprimer';
        }
        
        Main.showFlashMessage('Erreur lors de la suppression', 'danger');
    }
}

/**
 * Vérifie s'il ne reste plus de favoris après suppression
 */
function checkIfNowEmpty() {
    const container = document.getElementById('favorites-container');
    const remainingCards = container.children.length;
    
    if (remainingCards === 0) {
        showEmptyState();
    }
}

/**
 * Met à jour le compteur de favoris dans la navigation
 */
async function updateFavoritesCount() {
    try {
        const favorites = await API.getFavorites();
        const countElement = document.getElementById('favorites-count');
        if (countElement) {
            countElement.textContent = favorites.length;
        }
    } catch (error) {
        console.warn('Impossible de mettre à jour le compteur de favoris');
    }
}

/**
 * Rafraîchit la liste des favoris
 */
function refreshFavorites() {
    Main.showFlashMessage('Actualisation des favoris...', 'info', 2000);
    loadUserFavorites();
}

// CSS pour l'animation de suppression
const style = document.createElement('style');
style.textContent = `
    .fade-out {
        opacity: 0;
        transform: scale(0.8);
        transition: all 0.3s ease;
    }
`;
document.head.appendChild(style);

// Export pour utilisation globale
window.FavoritesPage = {
    removeFavorite,
    refreshFavorites
};
