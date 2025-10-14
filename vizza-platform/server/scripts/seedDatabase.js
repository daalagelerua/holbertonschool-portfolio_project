const mongoose = require('mongoose');
const fetch = require('node-fetch');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Import des modèles
const { Country, VisaRequirement } = require('../models');

// Pays prioritaires pour le MVP (populaires pour les touristes)
const PRIORITY_COUNTRIES = [
  'US',
  'FR',
  'ES',
  'IT',
  'DE',
  'GB',
  'JP',
  'AU',
  'CA',
  'NL'
];


// Connexion à la base de données
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connecté à MongoDB pour le seed');
  } catch (error) {
    console.error('Erreur connexion MongoDB:', error);
    process.exit(1);
  }
};

// Récupérer les pays depuis REST Countries API
const fetchCountriesFromAPI = async () => {
  try {
    console.log('Récupération des pays depuis REST Countries...');
    
    // CORRECTION: Utiliser les bons champs de l'API
    const response = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2,region,subregion,capital,population');
    const countries = await response.json();
    
    console.log(`${countries.length} pays récupérés`);
    
    // Transformer les données pour MongoDB
    const formattedCountries = countries
      .map(country => ({
        code: country.cca2,
        name: country.name.common,
        flag: getCountryFlag(country.cca2), // CORRECTION: Convertir le code pays en émoji
        continent: mapRegionToContinent(country.region),
        region: country.region,
        subregion: country.subregion,
        capital: Array.isArray(country.capital) ? country.capital[0] : country.capital,
        population: country.population,
        isActive: PRIORITY_COUNTRIES.includes(country.cca2) // Activer les pays prioritaires
      }))
      .filter(country => country.continent !== null); // Filtrer les pays sans continent valide
    
    console.log(`${formattedCountries.length} pays avec continents valides`);
    
    return formattedCountries;
    
  } catch (error) {
    console.error('Erreur récupération pays:', error);
    throw error;
  }
};

// NOUVELLE FONCTION: Convertit un code pays ISO en émoji drapeau
const convertCountryCodeToFlag = (countryCode) => {
  // Conversion du code pays (ex: "FR") en émoji drapeau (ex: "🇫🇷")
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0)); // Offset pour les émojis drapeaux
  
  return String.fromCodePoint(...codePoints);
};

// Alternative avec mapping manuel pour les pays prioritaires (plus fiable)
const getCountryFlag = (countryCode) => {
  const flagMap = {
    'US': '🇺🇸',
    'FR': '🇫🇷', 
    'ES': '🇪🇸',
    'IT': '🇮🇹',
    'DE': '🇩🇪',
    'GB': '🇬🇧',
    'JP': '🇯🇵',
    'AU': '🇦🇺',
    'CA': '🇨🇦',
    'NL': '🇳🇱'
  };
  
  // Utiliser le mapping manuel pour les pays prioritaires, sinon la conversion automatique
  return flagMap[countryCode] || convertCountryCodeToFlag(countryCode);
};

// Mapper les régions aux continents
const mapRegionToContinent = (region) => {
  const mapping = {
    'Africa': 'Africa',
    'Americas': 'North America', // Simplifié pour le MVP
    'Asia': 'Asia',
    'Europe': 'Europe',
    'Oceania': 'Oceania',
    'Antarctic': 'Antarctica',  // Ajout manquant
    'Antarctica': 'Antarctica'  // Variante possible
  };
  
  const result = mapping[region];
  if (!result) {
    console.log(`Région inconnue: "${region}" - assignée à "Unknown"`);
    return null; // On va filtrer ces pays
  }
  return result;
};

// Récupérer les exigences de visa pour un pays
const fetchVisaRequirements = async (originCountryCode) => {
  try {
    console.log(`Récupération des visas pour ${originCountryCode}...`);
    
    // 1. Trouver l'ObjectId du pays d'origine
    const originCountry = await Country.findOne({ code: originCountryCode });
    if (!originCountry) {
      console.error(`Pays origine ${originCountryCode} non trouvé dans la DB`);
      
      return [];
    }
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'x-rapidapi-host': process.env.RAPIDAPI_HOST,
        'x-rapidapi-key': process.env.RAPIDAPI_KEY
      },
      body: `passport=${originCountryCode}`
    };

    const response = await fetch('https://visa-requirement.p.rapidapi.com/v2/visa/map', options);
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
        const result = await response.json();
    
    // La v2 retourne { data: { passport: "FR", colors: { green: "...", red: "...", ... } } }
    const data = result.data;
    
    if (!data || !data.colors) {
      console.log(`Aucune donnée de couleur pour ${originCountryCode}`);
      return [];
    }
    
    console.log(`API v2 retourne des groupes de couleurs pour ${originCountryCode}`);
    
    // Transformer en format MongoDB avec ObjectId
    const visaRequirements = [];
    let foundCountries = 0;
    let notFoundCountries = 0;
    
    // Parcourir chaque couleur (green, red, blue, yellow)
    for (const [color, countriesString] of Object.entries(data.colors)) {
      // Convertir la string "AD,AE,AG,..." en tableau
      const countryCodes = countriesString.split(',').map(code => code.trim());
      
      console.log(`Couleur ${color}: ${countryCodes.length} destinations`);
      
      for (const destCountryCode of countryCodes) {
        // Trouver l'ObjectId du pays de destination
        const destCountry = await Country.findOne({ code: destCountryCode });
        
        if (destCountry) {
          foundCountries++;
          visaRequirements.push({
            originCountry: originCountry._id,
            destinationCountry: destCountry._id,
            requirement: color,
            requirementText: mapColorToText(color),
            lastUpdated: new Date()
          });
        } else {
          notFoundCountries++;
          if (notFoundCountries <= 5) {
            console.log(`Pays non trouvé: ${destCountryCode}`);
          }
        }
      }
    }
    
    console.log(`Pays trouvés: ${foundCountries}, non trouvés: ${notFoundCountries}`);
    console.log(`${visaRequirements.length} exigences de visa pour ${originCountryCode}`);
    return visaRequirements;
    
  } catch (error) {
    console.error(`Erreur visa pour ${originCountryCode}:`, error.message);
    return [];
  }
};

// Mapper les couleurs aux textes
const mapColorToText = (color) => {
  const mapping = {
    'green': 'Visa not required',
    'yellow': 'eTA required',
    'blue': 'Visa on arrival',
    'red': 'Visa required'
  };
  return mapping[color] || 'Unknown requirement';
};

// =============================================================================
// FONCTIONS DE SEED
// =============================================================================

// Seed des pays
const seedCountries = async () => {
  try {
    console.log('=== SEED DES PAYS ===');
    
    // Vider la collection existante
    await Country.deleteMany({});
    console.log('Collection pays vidée');
    
    // Récupérer et insérer les nouveaux pays
    const countries = await fetchCountriesFromAPI();
    await Country.insertMany(countries);
    
    console.log(`${countries.length} pays insérés`);
    console.log(`Pays prioritaires: ${PRIORITY_COUNTRIES.join(', ')}`);
    
  } catch (error) {
    console.error('Erreur seed pays:', error);
    throw error;
  }
};

// Seed des exigences de visa
const seedVisaRequirements = async () => {
  try {
    console.log('=== SEED DES VISAS ===');
    
    // Vider la collection existante
    await VisaRequirement.deleteMany({});
    console.log('Collection visas vidée');
    
    let totalInserted = 0;
    
    // Pour chaque pays prioritaire, récupérer ses exigences
    for (const country of PRIORITY_COUNTRIES) {
      try {
        const visaRequirements = await fetchVisaRequirements(country);
        
        if (visaRequirements.length > 0) {
          await VisaRequirement.insertMany(visaRequirements);
          totalInserted += visaRequirements.length;
        }
        
        // Pause pour éviter de surcharger l'API
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`⚠️  Erreur pour ${country}, on continue...`);
      }
    }
    
    console.log(`${totalInserted} exigences de visa insérées`);
    
  } catch (error) {
    console.error('Erreur seed visas:', error);
    throw error;
  }
};

const runSeed = async () => {
  try {
    console.log('=== DÉMARRAGE DU SEED ===');
    
    // Connexion DB
    await connectDB();
    
    // Seed des pays
    await seedCountries();
    
    // Seed des visas (seulement pour les pays prioritaires)
    console.log('\nAttente 2 secondes avant les visas...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await seedVisaRequirements();
    
    console.log('\n=== SEED TERMINÉ AVEC SUCCÈS ===');
    console.log('Statistiques finales:');
    
    const countryCount = await Country.countDocuments();
    const visaCount = await VisaRequirement.countDocuments();
    const activeCountries = await Country.countDocuments({ isActive: true });
    
    console.log(`   - Pays total: ${countryCount}`);
    console.log(`   - Pays actifs: ${activeCountries}`);
    console.log(`   - Exigences visa: ${visaCount}`);
    
  } catch (error) {
    console.error('Erreur générale:', error);
  } finally {
    // Fermer la connexion
    await mongoose.connection.close();
    console.log('Connexion MongoDB fermée');
    process.exit(0);
  }
};

const args = process.argv.slice(2);

if (args.includes('--countries-only')) {
  // Seed seulement les pays
  connectDB().then(seedCountries).then(() => {
    console.log('Seed pays terminé');
    mongoose.connection.close();
    process.exit(0);
  });
} else if (args.includes('--visas-only')) {
  // Seed seulement les visas
  connectDB().then(seedVisaRequirements).then(() => {
    console.log('Seed visas terminé');
    mongoose.connection.close();
    process.exit(0);
  });
} else {
  // Seed complet
  runSeed();
}

// =============================================================================
// EXPORT POUR UTILISATION DANS D'AUTRES SCRIPTS
// =============================================================================
module.exports = {
  seedCountries,
  seedVisaRequirements,
  runSeed
};
