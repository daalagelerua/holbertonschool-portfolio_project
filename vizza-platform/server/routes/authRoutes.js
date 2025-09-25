const express = require('express');
const router = express.Router();  // Router = "mini-application" Express pour grouper les routes

// Import des controllers
const { 
  register, 
  login, 
  logout, 
  getProfile,
  updateProfile
} = require('../controllers/authController');

// Import du middleware d'authentification
const { authenticateToken } = require('../middleware/auth');

// ROUTES PUBLIQUES (pas besoin d'être connecté)
/**
 * POST /api/auth/register
 * Inscription d'un nouvel utilisateur
 * Body: { email, password, firstName, lastName, defaultOriginCountry?, language? }
 */
router.post('/register', register);

/**
 * POST /api/auth/login  
 * Connexion d'un utilisateur existant
 * Body: { email, password }
 */
router.post('/login', login);

// ROUTES PROTÉGÉES (authentification requise)
/**
 * POST /api/auth/logout
 * Déconnexion de l'utilisateur connecté
 * Headers: Authorization: Bearer <token> OU Cookie: token=<token>
 */
router.post('/logout', authenticateToken, logout);

/**
 * GET /api/auth/profile
 * Récupération du profil utilisateur connecté
 * Headers: Authorization: Bearer <token> OU Cookie: token=<token>
 */
router.get('/profile', authenticateToken, getProfile);

/**
 * PUT /api/auth/profile
 * Mise à jour du profil utilisateur connecté
 */
router.put('/profile', authenticateToken, updateProfile);

// ROUTE DE TEST (à supprimer en production)
/**
 * GET /api/auth/test
 * Route de test pour vérifier que les routes fonctionnent
 */
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Routes d\'authentification opérationnelles !',
    timestamp: new Date().toISOString(),
    availableRoutes: [
      'POST /api/auth/register',
      'POST /api/auth/login', 
      'POST /api/auth/logout (protégé)',
      'GET /api/auth/profile (protégé)'
    ]
  });
});

// GESTION D'ERREURS SPÉCIFIQUE AUX ROUTES AUTH
/**
 * Middleware de gestion d'erreur pour les routes d'auth
 * Capture les erreurs non gérées dans les controllers
 */
router.use((err, req, res, next) => {
  console.error('Erreur dans authRoutes:', err);
  
  // Si l'erreur a déjà une réponse HTTP, la laisser passer
  if (res.headersSent) {
    return next(err);
  }
  
  // Erreur générique pour les routes d'authentification
  res.status(500).json({
    success: false,
    error: 'Erreur d\'authentification',
    code: 'AUTH_ROUTE_ERROR',
    message: 'Une erreur s\'est produite lors du traitement de l\'authentification'
  });
});

module.exports = router;
