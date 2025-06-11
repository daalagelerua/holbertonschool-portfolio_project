const jwt = require('jsonwebtoken');  //référence pour JWT en Node.js


// configuration du token (recupere les infos depuis .env ou fallback)
const TOKEN_SECRET = process.env.TOKEN_SECRET || 'development-token-secret-256-bits';
const TOKEN_EXPIRE = process.env.TOKEN_EXPIRE || '4h';


/**
 * Génère un token JWT pour l'authentification
 * @param {Object} user - Objet utilisateur de la base de données
 * @returns {string} Token JWT signé
 */
const generateToken = (user) => {
  try {
    // Payload : données qu'on veut stocker dans le token
    const payload = {
      userId: user._id,  // MongoDB/Mongoose utilise _id comme clé primaire
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName
    };

    // Options du token
    // important pour la securité (si quelqu'un utilise le token d'un autre site en imaginant qu'il soit le meme que celui d'un autre utilisateur, il pourrait utiliser son compte)
    const options = {
      expiresIn: TOKEN_EXPIRE,
      issuer: 'vizza-app',           // Qui a émis le token, pour la sécurité si quelqu'un utilise ce token sur un autre site ça ne marchera pas
      audience: 'vizza-users',       // Pour qui est le token
      subject: user._id.toString()   // Sujet principal (userId)
    };

    // Signature du token (string)
    // jwt.sign() -> encode header + payload, calcule signature puis assemble le tout
    return jwt.sign(payload, TOKEN_SECRET, options);
    
  } catch (error) {
    console.error('Erreur génération token:', error);
    throw new Error('Impossible de générer le token');
  }
};


/**
 * Génère un token pour un utilisateur avec métadonnées
 * @param {Object} user - Objet utilisateur
 * @returns {Object} Objet contenant le token et sa durée
 */
const generateTokenForUser = (user) => {
  try {
    const token = generateToken(user);
    
    return {
      token,
      expiresIn: TOKEN_EXPIRE
    };
    
  } catch (error) {
    console.error('Erreur génération token utilisateur:', error);
    throw new Error('Impossible de générer le token');
  }
};


/**
 * Vérifie et décode un token JWT
 * @param {string} token - Le token JWT à vérifier
 * @returns {Object} Payload décodé du token
 * @throws {Error} Si le token est invalide ou expiré
 */
const verifyToken = (token) => {
  try {
    // Options de vérification
    const options = {
      issuer: 'vizza-app',
      audience: 'vizza-users',
      clockTolerance: 60, // Tolérance de 60 secondes pour décalage d'une horloge a une autre
    };

    // Vérifie la signature ET l'expiration
    // jwt.verify() -> split le token, decode header + payload, recalcule signature puis fais les comparaisons
    // verify() ne retourne que la payload
    const decoded = jwt.verify(token, TOKEN_SECRET, options);
    
    return decoded;
    
  } catch (error) {
    // Gestion des différents types d'erreurs JWT
    if (error.name === 'TokenExpiredError') {
      throw new Error('TOKEN_EXPIRED');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('TOKEN_INVALID');
    } else if (error.name === 'NotBeforeError') {
      throw new Error('TOKEN_NOT_ACTIVE');
    } else {
      console.error('Erreur vérification token:', error);
      throw new Error('TOKEN_ERROR');
    }
  }
};

/**
 * Vérifie si un token est expiré sans le décoder complètement
 * @param {string} token - Le token JWT à vérifier
 * @returns {boolean} true si expiré, false sinon
 */
const isTokenExpired = (token) => {
  try {
    const decoded = jwt.decode(token);  // jwt.decode() -> decode juste le payload sans verification de signature
    if (!decoded || !decoded.exp) {
      return true; // Si pas d'expiration, considérer comme expiré
    }
    
    // exp est en secondes, Date.now() en millisecondes (JWT en secondes, JS en millisecondes)
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
    
  } catch (error) {
    return true; // En cas d'erreur, considérer comme expiré
  }
};


// debug et inspection
/**
 * Décode un token sans vérifier la signature (pour debug/inspection)
 * ⚠️ NE JAMAIS UTILISER POUR L'AUTHENTIFICATION !
 * @param {string} token - Le token JWT à décoder
 * @returns {Object|null} Payload décodé ou null si erreur
 */
const debugDecodeToken = (token) => {
  try {
    // Décode sans vérifier la signature
    return jwt.decode(token);
  } catch (error) {
    console.error('Erreur décodage token:', error);
    return null;
  }
};

/**
 * Affiche les informations d'un token de manière lisible (debug)
 * @param {string} token - Le token à inspecter
 * @returns {Object} Informations formatées du token
 */
const inspectToken = (token) => {
  try {
    const decoded = jwt.decode(token, { complete: true });  // avec complete: true, decode() renvoie le header + le payload + la signature
    
    if (!decoded) {
      return { error: 'Token invalide ou malformé' };
    }

    const { header, payload } = decoded;
    
    // Formatage des timestamps
    // timestamp -> JWT -> secondes / new Date -> JS -> millisecondes
    const formatDate = (timestamp) => {
      return timestamp ? new Date(timestamp * 1000).toLocaleString() : 'Non défini';
    };

    return {
      header: {
        algorithm: header.alg,
        type: header.typ
      },
      payload: {
        userId: payload.userId,
        email: payload.email,
        firstName: payload.firstName,
        lastName: payload.lastName,
        issuer: payload.iss,
        audience: payload.aud,
        subject: payload.sub,
        issuedAt: formatDate(payload.iat),
        expiresAt: formatDate(payload.exp),
        notBefore: formatDate(payload.nbf)
      },
      isExpired: isTokenExpired(token),
      timeToExpiry: payload.exp ? Math.max(0, payload.exp - Math.floor(Date.now() / 1000)) : 0
    };
    
  } catch (error) {
    return { error: 'Erreur lors de l\'inspection: ' + error.message };
  }
};


module.exports = {
  // Génération
  generateToken,
  generateTokenForUser,
  
  // Vérification
  verifyToken,
  isTokenExpired,
  
  // Utilitaires
  debugDecodeToken,
  inspectToken,
  
  // Constants pour tests
  TOKEN_EXPIRE
};