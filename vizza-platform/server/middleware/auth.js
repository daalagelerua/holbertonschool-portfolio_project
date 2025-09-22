const { verifyToken } = require('../utils/jwt');


/**
 * Middleware d'authentification principal JWT
 * Vérifie la présence et la validité du token JWT
 * Ajoute les informations utilisateur à req.user
 * 
 * @param {Object} req - Objet request Express
 * @param {Object} res - Objet response Express  
 * @param {Function} next - Fonction next d'Express
 */
const authenticateToken = (req, res, next) => {
  try {

    // ÉTAPE 1: Récupération du token
    // Méthode 1: Depuis les cookies (prioritaire)
    let token = req.cookies?.token;  // 'optional chaining' -> si req.cookies est 'undefined' ça retourn 'undefined' au lieu de lever une erreur
    // cas ou req.cookies pourrait etre 'undefined' -> dans postman, premiere visite d'un utilisateur, API externes sans cookie, app mobile (authorization header)
    
    // Méthode 2: Depuis le header Authorization (fallback)
    if (!token) {
      const authHeader = req.headers.authorization;
      
      // Format attendu: "Bearer eyJh... -> token"
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7); // Supprime "Bearer " garde seulement le token
      }
    }
    
    // Si aucun token trouvé
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Accès refusé',
        code: 'NO_TOKEN',
        message: 'Token d\'authentification requis'
      });
    }
    
    // ÉTAPE 2: Vérification du token avec la fonction de jwt.js
    const decoded = verifyToken(token);
    
    // ÉTAPE 3: Ajout des informations utilisateur à la requête
    // permet d'utiliser req.user sur toutes les routes -> recuperer facilement les infos du user
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      firstName: decoded.firstName,
      lastName: decoded.lastName,
      // Ajout d'infos techniques pour debug
      tokenIssuedAt: decoded.iat,
      tokenExpiresAt: decoded.exp
    };
    
    // ÉTAPE 4: Passage au middleware/route suivant
    next();
    
  } catch (error) {
    // GESTION DES ERREURS JWT
    console.error('Erreur authentification:', error.message);
    
    // Gestion spécifique des erreurs JWT
    switch (error.message) {
      case 'TOKEN_EXPIRED':
        return res.status(401).json({
          success: false,
          error: 'Token expiré',
          code: 'TOKEN_EXPIRED',
          message: 'Votre session a expiré, veuillez vous reconnecter'
        });
        
      case 'TOKEN_INVALID':
        return res.status(401).json({
          success: false,
          error: 'Token invalide',
          code: 'TOKEN_INVALID',
          message: 'Token d\'authentification invalide'
        });
        
      case 'TOKEN_NOT_ACTIVE':
        return res.status(401).json({
          success: false,
          error: 'Token pas encore actif',
          code: 'TOKEN_NOT_ACTIVE',
          message: 'Token d\'authentification pas encore valide'
        });
        
      default:
        return res.status(401).json({
          success: false,
          error: 'Erreur d\'authentification',
          code: 'AUTH_ERROR',
          message: 'Erreur lors de la vérification du token'
        });
    }
  }
};

// MIDDLEWARE OPTIONNEL (pour routes semi-protégées)
/**
 * Middleware d'authentification optionnelle
 * Ajoute req.user si token valide, mais n'bloque pas si pas de token
 * Utile pour des routes qui changent de comportement selon l'auth
 * 
 * @param {Object} req - Objet request Express
 * @param {Object} res - Objet response Express
 * @param {Function} next - Fonction next d'Express
 */
const optionalAuthentication = (req, res, next) => {
  try {
    // Récupération du token (même logique que authenticateToken)
    let token = req.cookies?.token;
    
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
    
    // Si pas de token → continuer sans req.user
    if (!token) {
      req.user = null;
      return next();
    }
    
    // Si token présent → essayer de le vérifier
    const decoded = verifyToken(token);
    
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      firstName: decoded.firstName,
      lastName: decoded.lastName,
      tokenIssuedAt: decoded.iat,
      tokenExpiresAt: decoded.exp
    };
    
    next();
    
  } catch (error) {
    // En cas d'erreur → continuer sans req.user (pas d'erreur bloquante)
    console.warn('Token optionnel invalide:', error.message);
    req.user = null;
    next();
  }
};

// MIDDLEWARE DE VÉRIFICATION DE RÔLES (pour plus tard)
/**
 * Middleware pour vérifier les rôles utilisateur
 * Doit être utilisé APRÈS authenticateToken
 * 
 * @param {...string} allowedRoles - Rôles autorisés
 * @returns {Function} Middleware Express
 */
const requireRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // Vérifier que l'utilisateur est authentifié
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentification requise',
        code: 'NOT_AUTHENTICATED',
        message: 'Vous devez être connecté pour accéder à cette ressource'
      });
    }
    
    // Vérifier le rôle (à implémenter plus tard si besoin)
    // Pour l'instant, tous les utilisateurs ont le même niveau
    // if (!allowedRoles.includes(req.user.role)) {
    //   return res.status(403).json({
    //     success: false,
    //     error: 'Accès refusé',
    //     code: 'INSUFFICIENT_PERMISSIONS',
    //     message: 'Vous n\'avez pas les permissions nécessaires'
    //   });
    // }
    
    next();
  };
};

// UTILITAIRES POUR DEBUGGING
/**
 * Middleware de debug pour logger les informations d'authentification
 * À utiliser seulement en développement
 */
const debugAuthentication = (req, res, next) => {
  if (process.env.NODE_ENV !== 'development') {
    return next();
  }
  
  const token = req.cookies?.token || req.headers.authorization?.substring(7);
  
  console.log('🔍 DEBUG AUTH:', {
    path: req.path,
    method: req.method,
    hasToken: !!token,
    hasUser: !!req.user,
    userId: req.user?.userId,
    userEmail: req.user?.email
  });
  
  next();
};

/**
 * Extrait le token de la requête (utilitaire)
 * @param {Object} req - Objet request Express
 * @returns {string|null} Token JWT ou null
 */
const extractToken = (req) => {
  // Priorité aux cookies
  if (req.cookies?.token) {
    return req.cookies.token;
  }
  
  // Fallback sur Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  return null;
};


module.exports = {
  // Middleware principal
  authenticateToken,
  
  // Middleware optionnel
  optionalAuthentication,
  
  // Middleware de rôles (pour plus tard)
  requireRoles,
  
  // Utilitaires
  extractToken,
  debugAuthentication
};
