const express = require('express');
const router = express.Router();

// Import des controllers
const {
  searchVisa,
  getVisasFromCountry,
  getAvailableCountries
} = require('../controllers/visaController');

// Import du middleware d'authentification (optionnel pour certaines routes)
const { optionalAuthentication } = require('../middleware/auth');

// ROUTES PUBLIQUES (accessible à tous)
/**
 * GET /api/visas/countries
 * Récupère la liste de tous les pays disponibles
 * Utilisé pour alimenter les dropdowns du frontend
 */
router.get('/countries', getAvailableCountries);

/**
 * GET /api/visas/search?from=FR&to=JP
 * Recherche d'un visa spécifique entre deux pays
 * Paramètres: from (code pays origine), to (code pays destination)
 * 
 * Avec utilisateur connecté : inclut si c'est un favori
 * Sans utilisateur : juste les infos de visa
 */
router.get('/search', optionalAuthentication, searchVisa);

/**
 * GET /api/visas/from/:country
 * Récupère tous les visas depuis un pays donné
 * Paramètre: country (code du pays, ex: FR, US, JP)
 * 
 * Exemple: /api/visas/from/FR → tous les visas depuis la France
 */
router.get('/from/:country', getVisasFromCountry);

// ROUTES DE STATISTIQUES
/**
 * GET /api/visas/stats
 * Statistiques générales sur les données de visa
 */
router.get('/stats', async (req, res) => {
  try {
    const { Country, VisaRequirement } = require('../models');
    
    // Comptage rapide des données
    const [totalCountries, totalVisas, activeCountries] = await Promise.all([
      Country.countDocuments(),
      VisaRequirement.countDocuments(),
      Country.countDocuments({ isActive: true })
    ]);
    
    // Statistiques par niveau de visa
    const visaStats = await VisaRequirement.aggregate([
      {
        $group: {
          _id: '$requirement',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const statsByLevel = {};
    visaStats.forEach(stat => {
      statsByLevel[stat._id] = stat.count;
    });
    
    res.json({
      success: true,
      statistics: {
        countries: {
          total: totalCountries,
          active: activeCountries,
          inactive: totalCountries - activeCountries
        },
        visas: {
          total: totalVisas,
          byLevel: {
            green: statsByLevel.green || 0,    // Visa not required
            yellow: statsByLevel.yellow || 0,  // eTA required
            blue: statsByLevel.blue || 0,      // Visa on arrival
            red: statsByLevel.red || 0         // Visa required
          }
        },
        metadata: {
          generatedAt: new Date().toISOString(),
          databaseStatus: 'operational'
        }
      }
    });
    
  } catch (error) {
    console.error('Erreur statistiques:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur',
      message: 'Impossible de récupérer les statistiques'
    });
  }
});

// ROUTES POUR LES FAVORIS (à implémenter plus tard)
/*
TODO: Routes des favoris (nécessitent authentification)

router.post('/favorites', authenticateToken, addToFavorites);
router.delete('/favorites', authenticateToken, removeFromFavorites);
router.get('/favorites', authenticateToken, getUserFavorites);

*/

// GESTION D'ERREURS SPÉCIFIQUE AUX ROUTES VISA
/**
 * Middleware de gestion d'erreur pour les routes de visa
 */
router.use((err, req, res, next) => {
  console.error('Erreur dans visaRoutes:', err);
  
  if (res.headersSent) {
    return next(err);
  }
  
  res.status(500).json({
    success: false,
    error: 'Erreur de recherche visa',
    code: 'VISA_ROUTE_ERROR',
    message: 'Une erreur s\'est produite lors de la recherche de visa'
  });
});

module.exports = router;
