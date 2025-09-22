// =============================================================================
// server/scripts/seedDatabase.js - Script pour peupler la base de données
// =============================================================================
const mongoose = require('mongoose');
const fetch = require('node-fetch');
require('dotenv').config();

// Import des modèles
const { Country, VisaRequirement } = require('../models');

// =============================================================================
// CONFIGURATION
// =============================================================================

// Pays prioritaires pour le MVP (populaires pour les touristes)
const PRIORITY_COUNTRIES = [
  'US',  // United States ✅
  'FR',  // France ✅
  'ES',  // Spain ✅ 
  'IT',  // Italy ✅
  'DE',  // Germany ✅
  'GB',  // United Kingdom (pas UK !) ✅
  'JP',  // Japan ✅
  'AU',  // Australia ✅
  'CA',  // Canada ✅
  'NL'   // Netherlands ✅
];

// =============================================================================
// FONCTIONS UTILITAIRES
// =============================================================================

// Connexion à la base de données
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB pour le seed');
  } catch (error) {
    console.error('❌ Erreur connexion MongoDB:', error);
    process.exit(1);
  }
};

// Récupérer les pays depuis REST Countries API
const fetchCountriesFromAPI = async () => {
  try {
    console.log('🌍 Récupération des pays depuis REST Countries...');
    
    const response = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2,flag,region,subregion,capital,population');
    const countries = await response.json();
    
    console.log(`📊 ${countries.length} pays récupérés`);
    
    // Transformer les données pour MongoDB
    const formattedCountries = countries
      .map(country => ({
        code: country.cca2,
        name: country.name.common,
        flag: country.flag,
        continent: mapRegionToContinent(country.region),
        region: country.region,
        subregion: country.subregion,
        capital: Array.isArray(country.capital) ? country.capital[0] : country.capital,
        population: country.population,
        isActive: PRIORITY_COUNTRIES.includes(country.cca2) // Activer les pays prioritaires
      }))
      .filter(country => country.continent !== null); // Filtrer les pays sans continent valide
    
    console.log(`✅ ${formattedCountries.length} pays avec continents valides`);
    
    return formattedCountries;
    
  } catch (error) {
    console.error('❌ Erreur récupération pays:', error);
    throw error;
  }
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
    console.log(`⚠️  Région inconnue: "${region}" - assignée à "Unknown"`);
    return null; // On va filtrer ces pays
  }
  return result;
};

// Récupérer les exigences de visa pour un pays
const fetchVisaRequirements = async (originCountryCode) => {
  try {
    console.log(`🛂 Récupération des visas pour ${originCountryCode}...`);
    
    // 1. Trouver l'ObjectId du pays d'origine
    const originCountry = await Country.findOne({ code: originCountryCode });
    if (!originCountry) {
      console.error(`❌ Pays origine ${originCountryCode} non trouvé dans la DB`);
      
      // Debug: montrer les codes similaires
      const similarCountries = await Country.find({ 
        name: { $regex: originCountryCode, $options: 'i' } 
      }, { code: 1, name: 1 }).limit(3);
      console.log(`💡 Pays similaires:`, similarCountries);
      
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

    const response = await fetch('https://visa-requirement.p.rapidapi.com/map', options);
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`📊 API retourne ${Object.keys(data).length} destinations pour ${originCountryCode}`);
    
    // Debug: regarder la structure
    const firstEntry = data['0'];
    console.log(`🔍 Structure d'une entrée:`, firstEntry);
    
    // Transformer en format MongoDB avec ObjectId
    const visaRequirements = [];
    let foundCountries = 0;
    let notFoundCountries = 0;
    
    // L'API retourne des objets indexés numériquement
    for (const [index, countryData] of Object.entries(data)) {
      // Chaque countryData contient: { countryCode: "XX", color: "green" }
      const destCountryCode = countryData.countryCode;  // Pas .code !
      const requirement = countryData.color;           // Pas .requirement !
      
      if (!destCountryCode || !requirement) {
        console.log(`⚠️  Données manquantes pour index ${index}:`, countryData);
        continue;
      }
      
      // Trouver l'ObjectId du pays de destination
      const destCountry = await Country.findOne({ code: destCountryCode });
      
      if (destCountry) {
        foundCountries++;
        visaRequirements.push({
          originCountry: originCountry._id,        // ObjectId
          destinationCountry: destCountry._id,     // ObjectId
          requirement: requirement,                // color (green, blue, red, yellow)
          requirementText: mapColorToText(requirement),
          lastUpdated: new Date()
        });
      } else {
        notFoundCountries++;
        if (notFoundCountries <= 3) { // Log seulement les 3 premiers
          console.log(`❌ Pays non trouvé: ${destCountryCode}`);
        }
      }
    }
    
    console.log(`🎯 Pays trouvés: ${foundCountries}, non trouvés: ${notFoundCountries}`);
    console.log(`✅ ${visaRequirements.length} exigences de visa pour ${originCountryCode}`);
    return visaRequirements;
    
  } catch (error) {
    console.error(`❌ Erreur visa pour ${originCountryCode}:`, error.message);
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
    console.log('🌍 === SEED DES PAYS ===');
    
    // Vider la collection existante
    await Country.deleteMany({});
    console.log('🗑️  Collection pays vidée');
    
    // Récupérer et insérer les nouveaux pays
    const countries = await fetchCountriesFromAPI();
    await Country.insertMany(countries);
    
    console.log(`✅ ${countries.length} pays insérés`);
    console.log(`🎯 Pays prioritaires: ${PRIORITY_COUNTRIES.join(', ')}`);
    
  } catch (error) {
    console.error('❌ Erreur seed pays:', error);
    throw error;
  }
};

// Seed des exigences de visa
const seedVisaRequirements = async () => {
  try {
    console.log('🛂 === SEED DES VISAS ===');
    
    // Vider la collection existante
    await VisaRequirement.deleteMany({});
    console.log('🗑️  Collection visas vidée');
    
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
    
    console.log(`✅ ${totalInserted} exigences de visa insérées`);
    
  } catch (error) {
    console.error('❌ Erreur seed visas:', error);
    throw error;
  }
};

// =============================================================================
// FONCTION PRINCIPALE
// =============================================================================

const runSeed = async () => {
  try {
    console.log('🚀 === DÉMARRAGE DU SEED ===');
    
    // Connexion DB
    await connectDB();
    
    // Seed des pays
    await seedCountries();
    
    // Seed des visas (seulement pour les pays prioritaires)
    console.log('\n⏳ Attente 2 secondes avant les visas...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await seedVisaRequirements();
    
    console.log('\n🎉 === SEED TERMINÉ AVEC SUCCÈS ===');
    console.log('📊 Statistiques finales:');
    
    const countryCount = await Country.countDocuments();
    const visaCount = await VisaRequirement.countDocuments();
    const activeCountries = await Country.countDocuments({ isActive: true });
    
    console.log(`   - Pays total: ${countryCount}`);
    console.log(`   - Pays actifs: ${activeCountries}`);
    console.log(`   - Exigences visa: ${visaCount}`);
    
  } catch (error) {
    console.error('💥 Erreur générale:', error);
  } finally {
    // Fermer la connexion
    await mongoose.connection.close();
    console.log('🔌 Connexion MongoDB fermée');
    process.exit(0);
  }
};

// =============================================================================
// GESTION DES ARGUMENTS DE LIGNE DE COMMANDE
// =============================================================================

const args = process.argv.slice(2);

if (args.includes('--countries-only')) {
  // Seed seulement les pays
  connectDB().then(seedCountries).then(() => {
    console.log('✅ Seed pays terminé');
    mongoose.connection.close();
    process.exit(0);
  });
} else if (args.includes('--visas-only')) {
  // Seed seulement les visas
  connectDB().then(seedVisaRequirements).then(() => {
    console.log('✅ Seed visas terminé');
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
