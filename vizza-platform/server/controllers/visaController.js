const { Country, VisaRequirement, User } = require('../models');

// RECHERCHE DE VISAS
/**
 * Recherche d'un visa spécifique entre deux pays
 * GET /api/visas/search?from=FR&to=JP
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const searchVisa = async (req, res) => {
  try {

    // ÉTAPE 1: Récupération et validation des paramètres
    // 'req.query' -> tout se qui se trouve après ? dans la requete, permet d'utiliser directement 'from' et 'to' au lieu de 'req.query.from'
    const { from, to } = req.query;
    
    if (!from || !to) {
      return res.status(400).json({
        success: false,
        error: 'Paramètres manquants',
        code: 'MISSING_PARAMETERS',
        message: 'Les paramètres "from" et "to" sont requis',
        example: '/api/visas/search?from=FR&to=JP'
      });
    }
    
    // Normalisation des codes pays (majuscules)
    const fromCountry = from.toUpperCase().trim();
    const toCountry = to.toUpperCase().trim();
    
    // Vérification que les pays sont différents
    if (fromCountry === toCountry) {
      return res.status(400).json({
        success: false,
        error: 'Pays identiques',
        code: 'SAME_COUNTRY',
        message: 'Le pays de départ et de destination ne peuvent pas être identiques'
      });
    }
    
    console.log(`Recherche visa: ${fromCountry} -> ${toCountry}`);
    
    // ÉTAPE 2: Vérification de l'existence des pays
    const [originCountry, destinationCountry] = await Promise.all([
      Country.findOne({ code: fromCountry, isActive: true }),
      Country.findOne({ code: toCountry, isActive: true })
    ]);
    
    if (!originCountry) {
      return res.status(404).json({
        success: false,
        error: 'Pays de départ non trouvé',
        code: 'ORIGIN_COUNTRY_NOT_FOUND',
        message: `Le pays avec le code "${fromCountry}" n'existe pas ou n'est pas disponible`
      });
    }
    
    if (!destinationCountry) {
      return res.status(404).json({
        success: false,
        error: 'Pays de destination non trouvé',
        code: 'DESTINATION_COUNTRY_NOT_FOUND',
        message: `Le pays avec le code "${toCountry}" n'existe pas ou n'est pas disponible`
      });
    }
    
    // ÉTAPE 3: Recherche de l'exigence de visa
    const visaRequirement = await VisaRequirement.findOne({
      originCountry: originCountry._id,
      destinationCountry: destinationCountry._id
    }).populate('originCountry destinationCountry');
    
    if (!visaRequirement) {
      return res.status(404).json({
        success: false,
        error: 'Exigence de visa non trouvée',
        code: 'VISA_REQUIREMENT_NOT_FOUND',
        message: `Aucune information de visa trouvée pour ${fromCountry} → ${toCountry}`,
        availableAlternatives: {
          message: 'Essayez ces endpoints pour plus d\'informations',
          endpoints: [
            `/api/visas/from/${fromCountry}`,
            '/api/visas/countries'
          ]
        }
      });
    }
    
    // ÉTAPE 4: Vérification si l'utilisateur a ce visa en favori (optionnel)
    let isFavorite = false;
    if (req.user) {
      const user = await User.findById(req.user.userId);
      if (user) {
        isFavorite = user.favoriteVisas.some(fav => 
          fav.originCountry === fromCountry && 
          fav.destinationCountry === toCountry
        );
      }
    }
    
    // ÉTAPE 5: Formatage de la réponse
    const response = {
      success: true,
      visa: {
        id: visaRequirement._id,
        journey: {
          from: {
            code: visaRequirement.originCountry.code,
            name: visaRequirement.originCountry.name,
            flag: visaRequirement.originCountry.flag
          },
          to: {
            code: visaRequirement.destinationCountry.code,
            name: visaRequirement.destinationCountry.name,
            flag: visaRequirement.destinationCountry.flag
          }
        },
        requirement: {
          level: visaRequirement.requirement, // colors
          text: visaRequirement.requirementText,
          description: getRequirementDescription(visaRequirement.requirement)
        },
        details: {
          maxStay: visaRequirement.maxStay || null,
          processingTime: visaRequirement.processingTime || null,
          cost: visaRequirement.cost || null,
          notes: visaRequirement.notes || null
        },
        metadata: {
          lastUpdated: visaRequirement.lastUpdated,
          isFavorite: isFavorite,
          searchedAt: new Date().toISOString()
        }
      }
    };
    
    console.log(`Visa trouvé: ${fromCountry} -> ${toCountry} (${visaRequirement.requirement})`);
    res.json(response);
    
  } catch (error) {
    console.error('Erreur recherche visa:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur',
      code: 'SEARCH_ERROR',
      message: 'Une erreur s\'est produite lors de la recherche de visa'
    });
  }
};

/**
 * Récupère tous les visas depuis un pays donné
 * GET /api/visas/from/:country
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const getVisasFromCountry = async (req, res) => {
  try {
    // ÉTAPE 1: Récupération et validation du paramètre
    // 'req.params' -> partie de la requete après les : -> permet d'utiliser directement 'country' au lieu de 'req.params.country'
    const { country } = req.params;
    const countryCode = country.toUpperCase().trim();
    
    console.log(`Recherche tous les visas depuis: ${countryCode}`);
    
    // ÉTAPE 2: Vérification de l'existence du pays
    const originCountry = await Country.findOne({ 
      code: countryCode, 
      isActive: true 
    });
    
    if (!originCountry) {
      return res.status(404).json({
        success: false,
        error: 'Pays non trouvé',
        code: 'COUNTRY_NOT_FOUND',
        message: `Le pays avec le code "${countryCode}" n'existe pas ou n'est pas disponible`
      });
    }
    
    // ÉTAPE 3: Recherche de tous les visas depuis ce pays
    const visaRequirements = await VisaRequirement.find({
      originCountry: originCountry._id
    })
    .populate('destinationCountry')
    .sort({ 'destinationCountry.name': 1 }); // Tri alphabétique par nom de destination
    
    // ÉTAPE 4: Groupement par niveau d'exigence
    const groupedVisas = {
      green: [], // Visa not required
      yellow: [], // eTA required  
      blue: [], // Visa on arrival
      red: [] // Visa required
    };
    
    let totalDestinations = 0;
    
    visaRequirements.forEach(visa => {
      const formattedVisa = {
        id: visa._id,
        destination: {
          code: visa.destinationCountry.code,
          name: visa.destinationCountry.name,
          flag: visa.destinationCountry.flag
        },
        requirement: {
          level: visa.requirement,
          text: visa.requirementText
        },
        details: {
          maxStay: visa.maxStay,
          cost: visa.cost
        }
      };
      
      groupedVisas[visa.requirement].push(formattedVisa);
      totalDestinations++;
    });
    
    // ÉTAPE 5: Calcul des statistiques
    const stats = {
      total: totalDestinations,
      noVisaRequired: groupedVisas.green.length,
      etaRequired: groupedVisas.yellow.length,
      visaOnArrival: groupedVisas.blue.length,
      visaRequired: groupedVisas.red.length
    };
    
    const response = {
      success: true,
      origin: {
        code: originCountry.code,
        name: originCountry.name,
        flag: originCountry.flag
      },
      statistics: stats,
      destinations: groupedVisas,
      metadata: {
        searchedAt: new Date().toISOString(),
        totalCountries: totalDestinations
      }
    };
    
    console.log(`${totalDestinations} destinations trouvées pour ${countryCode}`);
    res.json(response);
    
  } catch (error) {
    console.error('Erreur récupération visas pays:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur',
      code: 'COUNTRY_VISAS_ERROR',
      message: 'Une erreur s\'est produite lors de la récupération des visas'
    });
  }
};

/**
 * Récupère la liste de tous les pays disponibles
 * GET /api/visas/countries
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const getAvailableCountries = async (req, res) => {
  try {
    console.log('Récupération de tous les pays disponibles');
    
    // Récupération de tous les pays actifs, triés par nom
    const countries = await Country.find({ isActive: true })
      .select('code name flag continent')
      .sort({ name: 1 });
    
    // Groupement par continent
    const continents = {};
    
    countries.forEach(country => {
      const continent = country.continent || 'Other';
      
      if (!continents[continent]) {
        continents[continent] = [];
      }
      
      continents[continent].push({
        code: country.code,
        name: country.name,
        flag: country.flag
      });
    });
    
    const response = {
      success: true,
      countries: countries.map(country => ({
        code: country.code,
        name: country.name,
        flag: country.flag,
        continent: country.continent
      })),
      continents: continents,
      metadata: {
        total: countries.length,
        continentsCount: Object.keys(continents).length,
        retrievedAt: new Date().toISOString()
      }
    };
    
    console.log(`${countries.length} pays récupérés`);
    res.json(response);
    
  } catch (error) {
    console.error('Erreur récupération pays:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur',
      code: 'COUNTRIES_ERROR',
      message: 'Une erreur s\'est produite lors de la récupération des pays'
    });
  }
};

// FONCTIONS UTILITAIRES
/**
 * Retourne une description détaillée du niveau d'exigence
 * @param {string} requirement - Niveau d'exigence ('green', 'blue', 'yellow', 'red')
 * @returns {string} Description détaillée
 */
const getRequirementDescription = (requirement) => {
  const descriptions = {
    green: 'Aucun visa requis. Vous pouvez voyager librement avec votre passeport.',
    yellow: 'Autorisation de voyage électronique (eTA) requise. Demande en ligne avant le départ.',
    blue: 'Visa disponible à l\'arrivée ou eVisa. Obtenez votre visa à l\'aéroport ou en ligne.',
    red: 'Visa obligatoire. Vous devez obtenir un visa avant le départ auprès du consulat.'
  };
  
  return descriptions[requirement] || 'Information non disponible';
};

module.exports = {
  searchVisa,
  getVisasFromCountry,
  getAvailableCountries
};
