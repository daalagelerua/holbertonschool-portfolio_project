const { Country, VisaRequirement, User } = require('../models');

// AJOUTER AUX FAVORIS
/**
 * Ajoute une combinaison pays-destination aux favoris de l'utilisateur
 * POST /api/visas/favorites
 * Body: { from: "FR", to: "JP" }
 * @param {Object} req - Requête Express (avec req.user du middleware auth)
 * @param {Object} res - Réponse Express
 */
const addToFavorites = async (req, res) => {
  try {
    // ÉTAPE 1: Récupération et validation des données
    const { from, to } = req.body;
    const userId = req.user.userId;
    
    if (!from || !to) {
      return res.status(400).json({
        success: false,
        error: 'Données manquantes',
        code: 'MISSING_PARAMETERS',
        message: 'Les paramètres "from" et "to" sont requis',
        example: { from: "FR", to: "JP" }
      });
    }
    
    // Normalisation des codes pays
    const fromCountry = from.toUpperCase().trim();
    const toCountry = to.toUpperCase().trim();
    
    if (fromCountry === toCountry) {
      return res.status(400).json({
        success: false,
        error: 'Pays identiques',
        code: 'SAME_COUNTRY',
        message: 'Impossible d\'ajouter un favori avec le même pays de départ et de destination'
      });
    }
    
    // ÉTAPE 2: Vérification de l'existence des pays
    const [originCountry, destinationCountry] = await Promise.all([
      Country.findOne({ code: fromCountry, isActive: true }),
      Country.findOne({ code: toCountry, isActive: true })
    ]);
    
    if (!originCountry || !destinationCountry) {
      return res.status(404).json({
        success: false,
        error: 'Pays non trouvé',
        code: 'COUNTRY_NOT_FOUND',
        message: !originCountry 
          ? `Le pays "${fromCountry}" n'existe pas ou n'est pas disponible`
          : `Le pays "${toCountry}" n'existe pas ou n'est pas disponible`
      });
    }
    
    console.log(`Ajout favori: ${fromCountry} -> ${toCountry} pour user ${userId}`);

    // ÉTAPE 3: Vérification que l'exigence de visa existe
    const visaRequirement = await VisaRequirement.findOne({
      originCountry: originCountry._id,
      destinationCountry: destinationCountry._id
    });
    
    if (!visaRequirement) {
      return res.status(404).json({
        success: false,
        error: 'Visa non trouvé',
        code: 'VISA_NOT_FOUND',
        message: `Aucune information de visa trouvée pour ${fromCountry} → ${toCountry}`,
        suggestion: 'Vous ne pouvez ajouter aux favoris que des visas avec des informations disponibles'
      });
    }
    
    // ÉTAPE 4: Récupération de l'utilisateur et ajout du favori
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé',
        code: 'USER_NOT_FOUND',
        message: 'Votre compte n\'existe plus'
      });
    }
    
    // Vérification si déjà en favoris
    const alreadyFavorite = user.favoriteVisas.some(fav => 
      fav.originCountry === fromCountry && 
      fav.destinationCountry === toCountry
    );
    
    if (alreadyFavorite) {
      return res.status(409).json({
        success: false,
        error: 'Déjà en favoris',
        code: 'ALREADY_FAVORITE',
        message: `${fromCountry} -> ${toCountry} est déjà dans vos favoris`,
        favorite: {
          from: { code: fromCountry, name: originCountry.name, flag: originCountry.flag },
          to: { code: toCountry, name: destinationCountry.name, flag: destinationCountry.flag }
        }
      });
    }
    
    // ÉTAPE 5: Ajout du favori (utilise la méthode du modèle User)
    await user.addToFavorites(fromCountry, toCountry);
    
    // ÉTAPE 6: Récupération des infos complètes du visa pour la réponse
    const completeVisa = await VisaRequirement.findOne({
      originCountry: originCountry._id,
      destinationCountry: destinationCountry._id
    }).populate('originCountry destinationCountry');
    
    const response = {
      success: true,
      message: 'Favori ajouté avec succès',
      favorite: {
        journey: {
          from: {
            code: completeVisa.originCountry.code,
            name: completeVisa.originCountry.name,
            flag: completeVisa.originCountry.flag
          },
          to: {
            code: completeVisa.destinationCountry.code,
            name: completeVisa.destinationCountry.name,
            flag: completeVisa.destinationCountry.flag
          }
        },
        requirement: {
          level: completeVisa.requirement,
          text: completeVisa.requirementText
        },
        addedAt: new Date().toISOString()
      },
      totalFavorites: user.favoriteVisas.length + 1
    };
    
    console.log(`Favori ajouté: ${fromCountry} -> ${toCountry} pour ${user.email}`);
    res.status(201).json(response);
    
  } catch (error) {
    console.error('Erreur ajout favori:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur',
      code: 'ADD_FAVORITE_ERROR',
      message: 'Une erreur s\'est produite lors de l\'ajout du favori'
    });
  }
};

// SUPPRIMER DES FAVORIS
/**
 * Supprime une combinaison pays-destination des favoris de l'utilisateur
 * DELETE /api/visas/favorites
 * Body: { from: "FR", to: "JP" }
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const removeFromFavorites = async (req, res) => {
  try {
    // ÉTAPE 1: Récupération des données
    const { from, to } = req.body;
    const userId = req.user.userId;
    
    if (!from || !to) {
      return res.status(400).json({
        success: false,
        error: 'Données manquantes',
        code: 'MISSING_PARAMETERS',
        message: 'Les paramètres "from" et "to" sont requis'
      });
    }
    
    const fromCountry = from.toUpperCase().trim();
    const toCountry = to.toUpperCase().trim();
    
    console.log(`Suppression favori: ${fromCountry} -> ${toCountry} pour user ${userId}`);
    
    // ÉTAPE 2: Récupération de l'utilisateur
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé',
        code: 'USER_NOT_FOUND',
        message: 'Votre compte n\'existe plus'
      });
    }
    
    // ÉTAPE 3: Vérification que le favori existe
    const favoriteExists = user.favoriteVisas.some(fav => 
      fav.originCountry === fromCountry && 
      fav.destinationCountry === toCountry
    );
    
    if (!favoriteExists) {
      return res.status(404).json({
        success: false,
        error: 'Favori non trouvé',
        code: 'FAVORITE_NOT_FOUND',
        message: `${fromCountry} -> ${toCountry} n'est pas dans vos favoris`
      });
    }
    
    // ÉTAPE 4: Suppression du favori (utilise la méthode du modèle User)
    await user.removeFromFavorites(fromCountry, toCountry);
    
    const response = {
      success: true,
      message: 'Favori supprimé avec succès',
      removed: {
        from: fromCountry,
        to: toCountry
      },
      totalFavorites: user.favoriteVisas.length - 1
    };
    
    console.log(`Favori supprimé: ${fromCountry} -> ${toCountry} pour ${user.email}`);
    res.json(response);
    
  } catch (error) {
    console.error('Erreur suppression favori:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur',
      code: 'REMOVE_FAVORITE_ERROR',
      message: 'Une erreur s\'est produite lors de la suppression du favori'
    });
  }
};

// RÉCUPÉRER TOUS LES FAVORIS
/**
 * Récupère tous les favoris de l'utilisateur avec les détails complets
 * GET /api/visas/favorites
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const getUserFavorites = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    console.log(`Récupération favoris pour user ${userId}`);
    
    // ÉTAPE 1: Récupération de l'utilisateur avec ses favoris
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé',
        code: 'USER_NOT_FOUND',
        message: 'Votre compte n\'existe plus'
      });
    }
    
    // ÉTAPE 2: Si pas de favoris, retourner liste vide
    if (user.favoriteVisas.length === 0) {
      return res.json({
        success: true,
        favorites: [],
        metadata: {
          total: 0,
          message: 'Aucun favori ajouté pour le moment',
          suggestion: 'Utilisez POST /api/visas/favorites pour ajouter des favoris'
        }
      });
    }
    
    // ÉTAPE 3: Récupération des détails complets pour chaque favori
    const favoritesWithDetails = [];
    
    for (const favorite of user.favoriteVisas) {
      try {
        // Récupération des pays
        const [originCountry, destinationCountry] = await Promise.all([
          Country.findOne({ code: favorite.originCountry }),
          Country.findOne({ code: favorite.destinationCountry })
        ]);
        
        // Récupération des détails du visa
        const visaRequirement = await VisaRequirement.findOne({
          originCountry: originCountry._id,
          destinationCountry: destinationCountry._id
        });
        
        if (originCountry && destinationCountry && visaRequirement) {
          favoritesWithDetails.push({
            id: `${favorite.originCountry}-${favorite.destinationCountry}`,
            journey: {
              from: {
                code: originCountry.code,
                name: originCountry.name,
                flag: originCountry.flag
              },
              to: {
                code: destinationCountry.code,
                name: destinationCountry.name,
                flag: destinationCountry.flag
              }
            },
            requirement: {
              level: visaRequirement.requirement,
              text: visaRequirement.requirementText,
              color: getColorFromLevel(visaRequirement.requirement)
            },
            details: {
              maxStay: visaRequirement.maxStay,
              cost: visaRequirement.cost,
              processingTime: visaRequirement.processingTime
            },
            addedAt: favorite.addedAt
          });
        }
      } catch (err) {
        console.warn(`Erreur pour favori ${favorite.originCountry}->${favorite.destinationCountry}:`, err);
        // warn() -> Continue avec les autres favoris même si un échoue
      }
    }
    
    // ÉTAPE 4: Tri par date d'ajout (plus récent en premier)
    favoritesWithDetails.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
    
    const response = {
      success: true,
      favorites: favoritesWithDetails,
      metadata: {
        total: favoritesWithDetails.length,
        totalInProfile: user.favoriteVisas.length,
        retrievedAt: new Date().toISOString()
      }
    };
    
    console.log(`${favoritesWithDetails.length} favoris récupérés pour ${user.email}`);
    res.json(response);
    
  } catch (error) {
    console.error('Erreur récupération favoris:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur',
      code: 'GET_FAVORITES_ERROR',
      message: 'Une erreur s\'est produite lors de la récupération des favoris'
    });
  }
};

// FONCTIONS UTILITAIRES
/**
 * Convertit le niveau d'exigence en couleur pour le frontend
 * @param {string} level - Niveau ('green', 'blue', 'yellow', 'red')
 * @returns {string} Couleur hexadécimale
 */
const getColorFromLevel = (level) => {
  const colors = {
    green: '#10B981',   // Vert - Pas de visa
    yellow: '#F59E0B',  // Jaune - eTA
    blue: '#3B82F6',    // Bleu - Visa à l'arrivée
    red: '#EF4444'      // Rouge - Visa obligatoire
  };
  
  return colors[level] || '#6B7280'; // Gris par défaut
};

module.exports = {
  addToFavorites,
  removeFromFavorites,
  getUserFavorites
};
