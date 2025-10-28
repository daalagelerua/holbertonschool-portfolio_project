const mongoose = require('mongoose');  // importer mongoose pour interagir avec mongodb
const fetch = require('node-fetch');  // fetch pour requetes http
const path = require('path');  // pour construire le chemin vers .env
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Import des modèles depuis /models/index.js
const { Country, VisaRequirement } = require('../models');

// Pays prioritaires pour le MVP (populaires pour les touristes, limite le volume de données)
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
    await mongoose.connect(process.env.MONGODB_URI);  // recupère URL depuis .env
    console.log('Connecté à MongoDB pour le seed');
  } catch (error) {
    console.error('Erreur connexion MongoDB:', error);
    process.exit(1);
  }
};

// Récupérer les pays depuis REST Countries API
const fetchCountriesFromAPI = async () => {
  try {
    const response = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2,region,subregion,capital,population');
    
    if (!response.ok) {
      throw new Error(`API REST Countries error: ${response.status}`);
    }
    
    const countries = await response.json();
    
    // Transformer les données pour MongoDB
    return countries
      .map(country => ({  // chaque country devient un nouvel objet mongodb
        code: country.cca2,
        name: country.name.common,
        flag: getCountryFlag(country.cca2), // CORRECTION: Convertir le code pays en émoji
        continent: mapRegionToContinent(country.region),
        region: country.region,
        subregion: country.subregion,
        capital: Array.isArray(country.capital) ? country.capital[0] : country.capital,  // Certains pays ont plusieurs capital
        population: country.population,
        isActive: PRIORITY_COUNTRIES.includes(country.cca2) // Activer les pays prioritaires
      }))
      .filter(country => country.continent !== null); // Filtrer les pays sans continent valide
    
  } catch (error) {
    console.error('Erreur récupération pays:', error);
    throw error;
  }
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
  if (flagMap[countryCode]) return flagMap[countryCode]

  // Fallback : conversion automatique
  const codePoints = countryCode.toUpperCase().split('')
    .map(char => 127397 + char.charCodeAt(0));  // code ASCII
  return String.fromCodePoint(...codePoints);  // combine les 2 lettres
};

// Mapper les régions aux continents
const mapRegionToContinent = (region) => {
  const mapping = {
    'Africa': 'Africa',
    'Americas': 'America',
    'Asia': 'Asia',
    'Europe': 'Europe',
    'Oceania': 'Oceania',
    'Antarctic': 'Antarctica',
    'Antarctica': 'Antarctica'  // Variante possible
  };
  
  const result = mapping[region];
  if (!result) {
    return null; // si la region n'est pas dans le mapping
  }
  return result;
};

// Récupérer les exigences de visa pour ce pays
const fetchVisaRequirements = async (originCountryCode) => {
  try {
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
    // nouvelle version v2
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
    
    // Transformer en format MongoDB avec ObjectId
    const visaRequirements = [];
    let foundCountries = 0;  // compteur pour stats
    let notFoundCountries = 0;
    
    // Parcourir chaque couleur (green, red, blue, yellow) / object.entries convertit objet en tableau de paires
    for (const [color, countriesString] of Object.entries(data.colors)) {
      // Convertir la string "AD,AE,AG,..." en tableau
      const countryCodes = countriesString.split(',').map(code => code.trim());
      
      for (const destCountryCode of countryCodes) {
        // Trouver l'ObjectId du pays de destination
        const destCountry = await Country.findOne({ code: destCountryCode });
        
        if (destCountry) {
          foundCountries++;
          visaRequirements.push({  // ajoute un document au tableau
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

// Seed des pays
const seedCountries = async () => {
  try {
    console.log('=== SEED DES PAYS ===');
    
    // Vider la collection existante
    await Country.deleteMany({});  // à revoir car dangereux (supprime tout à chaque seed)
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
        
        if (visaRequirements.length > 0) {  // au moins 1 visa avant insertion en base
          await VisaRequirement.insertMany(visaRequirements);
          totalInserted += visaRequirements.length;
        }
        
        // Pause pour éviter de surcharger l'API (rate limiting)
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
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await seedVisaRequirements();
    
    console.log('\n=== SEED TERMINÉ AVEC SUCCÈS ===');
    
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

module.exports = {
  seedCountries,
  seedVisaRequirements,
  runSeed
};
