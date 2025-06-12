const User = require('../models/User');
const { generateTokenForUser } = require('../utils/jwt');


// INSCRIPTION UTILISATEUR
/**
 * Inscription d'un nouvel utilisateur
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const register = async (req, res) => {
  try {
    
    // ÉTAPE 1: Validation des données d'entrée
    // destructuration de req.body pour lisibilité et performance
    // performance -> JS n'accede qu'une fois a req.body
    const { email, password, firstName, lastName, defaultOriginCountry, language } = req.body;
    
    // Vérification des champs obligatoires
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        error: 'Données manquantes',
        code: 'MISSING_FIELDS',
        message: 'Email, mot de passe, prénom et nom sont requis',
        details: {
          email: !email ? 'Email requis' : null,
          password: !password ? 'Mot de passe requis' : null,
          firstName: !firstName ? 'Prénom requis' : null,
          lastName: !lastName ? 'Nom requis' : null
        }
      });
    }
    
    // Validation format email (regex simple)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Email invalide',
        code: 'INVALID_EMAIL',
        message: 'Le format de l\'email n\'est pas valide'
      });
    }
    
    // Validation longueur mot de passe
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Mot de passe trop court',
        code: 'PASSWORD_TOO_SHORT',
        message: 'Le mot de passe doit contenir au moins 6 caractères'
      });
    }
    
    // Validation longueur des noms
    if (firstName.trim().length < 2 || lastName.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Nom invalide',
        code: 'INVALID_NAME',
        message: 'Le prénom et nom doivent contenir au moins 2 caractères'
      });
    }
    
    // ÉTAPE 2: Vérification unicité de l'email
    const existingUser = await User.findOne({ 
      email: email.toLowerCase().trim() 
    });
    
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'Email déjà utilisé',
        code: 'EMAIL_ALREADY_EXISTS',
        message: 'Un compte existe déjà avec cette adresse email'
      });
    }
    
    // ÉTAPE 3: Création de l'utilisateur
    const userData = {
      email: email.toLowerCase().trim(),
      password: password, // Sera hashé automatiquement par le middleware User
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      defaultOriginCountry: defaultOriginCountry?.toUpperCase() || null,
      language: language || 'fr' // Français par défaut
    };
    
    const newUser = new User(userData);
    const savedUser = await newUser.save();
    
    console.log(`✅ Nouvel utilisateur créé: ${savedUser.email} (ID: ${savedUser._id})`);
    
    // ÉTAPE 4: Génération du token JWT
    const tokenData = generateTokenForUser(savedUser);
    
    // ÉTAPE 5: Configuration du cookie sécurisé
    const cookieOptions = {
      httpOnly: true,    // Pas d'accès JavaScript (sécurité XSS - cross-site scripting)
      secure: process.env.NODE_ENV === 'production', // HTTPS en production
      sameSite: 'strict', // Protection CSRF (cross-site request forgery)
      maxAge: 4 * 60 * 60 * 1000, // 4 heures en millisecondes
      path: '/' // Cookie valide sur tout le domaine
    };
    
    res.cookie('token', tokenData.token, cookieOptions);
    
    // ÉTAPE 6: Réponse de succès (SANS le mot de passe)
    res.status(201).json({
      success: true,
      message: 'Inscription réussie',
      user: {
        id: savedUser._id,
        email: savedUser.email,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        defaultOriginCountry: savedUser.defaultOriginCountry,
        language: savedUser.language,
        createdAt: savedUser.createdAt
      },
      // Token aussi dans la réponse pour compatibilité mobile/API
      token: {
        value: tokenData.token,
        expiresIn: tokenData.expiresIn
      }
    });
    
  } catch (error) {
    // gestion des erreurs
    console.error('Erreur lors de l\'inscription:', error);
    
    // Erreur de validation Mongoose
    if (error.name === 'ValidationError') {
      const validationErrors = {};
      Object.keys(error.errors).forEach(key => {
        validationErrors[key] = error.errors[key].message;
      });
      
      return res.status(400).json({
        success: false,
        error: 'Erreur de validation',
        code: 'VALIDATION_ERROR',
        message: 'Les données fournies ne sont pas valides',
        details: validationErrors
      });
    }
    
    // Erreur de clé dupliquée (email unique)
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        error: 'Email déjà utilisé',
        code: 'DUPLICATE_EMAIL',
        message: 'Un compte existe déjà avec cette adresse email'
      });
    }
    
    // Erreur générique
    res.status(500).json({
      success: false,
      error: 'Erreur serveur',
      code: 'INTERNAL_ERROR',
      message: 'Une erreur inattendue s\'est produite lors de l\'inscription'
    });
  }
};

// CONNEXION UTILISATEUR (LOGIN)
/**
 * Connexion d'un utilisateur existant
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const login = async (req, res) => {
  try {

    // ÉTAPE 1: Validation des données d'entrée
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Données manquantes',
        code: 'MISSING_CREDENTIALS',
        message: 'Email et mot de passe sont requis'
      });
    }
    
    // ÉTAPE 2: Recherche de l'utilisateur
    const user = await User.findOne({ 
      email: email.toLowerCase().trim() 
    });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Identifiants invalides',
        code: 'INVALID_CREDENTIALS',
        message: 'Email ou mot de passe incorrect'
      });
    }
    
    // ÉTAPE 3: Vérification du mot de passe
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Identifiants invalides',
        code: 'INVALID_CREDENTIALS',
        message: 'Email ou mot de passe incorrect'
      });
    }
    
    // ÉTAPE 4: Génération du token JWT
    const tokenData = generateTokenForUser(user);
    
    // ÉTAPE 5: Configuration du cookie sécurisé
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 4 * 60 * 60 * 1000, // 4 heures
      path: '/'
    };
    
    res.cookie('token', tokenData.token, cookieOptions);
    
    // ÉTAPE 6: Réponse de succès
    console.log(`✅ Connexion réussie: ${user.email} (ID: ${user._id})`);
    
    res.json({
      success: true,
      message: 'Connexion réussie',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        defaultOriginCountry: user.defaultOriginCountry,
        language: user.language,
        favoriteCount: user.favoriteVisas.length
      },
      token: {
        value: tokenData.token,
        expiresIn: tokenData.expiresIn
      }
    });
    
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    
    res.status(500).json({
      success: false,
      error: 'Erreur serveur',
      code: 'INTERNAL_ERROR',
      message: 'Une erreur inattendue s\'est produite lors de la connexion'
    });
  }
};

// DÉCONNEXION UTILISATEUR (LOGOUT)
/**
 * Déconnexion de l'utilisateur
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const logout = async (req, res) => {
  try {
    // Supprimer le cookie de token
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/'
    });
    
    // Log pour debugging (si utilisateur connecté)
    if (req.user) {
      console.log(`✅ Déconnexion: ${req.user.email} (ID: ${req.user.userId})`);
    }
    
    res.json({
      success: true,
      message: 'Déconnexion réussie'
    });
    
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
    
    res.status(500).json({
      success: false,
      error: 'Erreur serveur',
      code: 'INTERNAL_ERROR',
      message: 'Une erreur inattendue s\'est produite lors de la déconnexion'
    });
  }
};

// PROFIL UTILISATEUR CONNECTÉ
/**
 * Récupère les informations de l'utilisateur connecté
 * @param {Object} req - Requête Express (avec req.user depuis middleware)
 * @param {Object} res - Réponse Express
 */
const getProfile = async (req, res) => {
  try {
    // req.user est fourni par le middleware authenticateToken
    const userId = req.user.userId;
    
    // Récupérer les données complètes depuis la base
    const user = await User.findById(userId).select('-password'); // le mdp est exclut de la réponse
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé',
        code: 'USER_NOT_FOUND',
        message: 'L\'utilisateur connecté n\'existe plus en base de données'
      });
    }
    
    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        defaultOriginCountry: user.defaultOriginCountry,
        language: user.language,
        favoriteVisas: user.favoriteVisas,
        favoriteCount: user.favoriteVisas.length,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
    
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    
    res.status(500).json({
      success: false,
      error: 'Erreur serveur',
      code: 'INTERNAL_ERROR',
      message: 'Une erreur inattendue s\'est produite lors de la récupération du profil'
    });
  }
};

module.exports = {
  register,
  login,
  logout,
  getProfile
};
