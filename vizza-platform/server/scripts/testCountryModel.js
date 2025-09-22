// =============================================================================
// server/scripts/testCountryModel.js - Script de test
// =============================================================================
const mongoose = require('mongoose');
require('dotenv').config();

// Import du modèle Country
const Country = require('../models/Country');

const testCountryModel = async () => {
  try {
    // Connexion à la DB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB pour les tests');

    // Nettoyer TOUTES les données pour les tests
    await Country.deleteMany({});
    console.log('🧹 Toutes les données supprimées pour les tests');

    // =============================================================================
    // TEST 1: Création de pays valides
    // =============================================================================
    console.log('\n📋 TEST 1: Création de pays valides');

    const validCountries = [
      {
        code: 'fr',              // Sera converti en 'FR' (uppercase)
        name: ' France ',        // Sera nettoyé en 'France' (trim)
        flag: '🇫🇷',
        continent: 'Europe',
        capital: 'Paris',
        population: 67000000
      },
      {
        code: 'JP',
        name: 'Japan',
        flag: '🇯🇵',
        continent: 'Asia',
        capital: 'Tokyo',
        population: 125000000
      },
      {
        code: 'US',
        name: 'United States',
        flag: '🇺🇸',
        continent: 'North America'
        // capital et population optionnels
      }
    ];

    for (const countryData of validCountries) {
      const country = new Country(countryData);
      const savedCountry = await country.save();
      console.log(`✅ ${savedCountry.name} créé avec code: ${savedCountry.code}`);
      console.log(`   - Timestamps: créé le ${savedCountry.createdAt}`);
      console.log(`   - isActive par défaut: ${savedCountry.isActive}`);
    }

    // =============================================================================
    // TEST 2: Validation des données invalides
    // =============================================================================
    console.log('\n❌ TEST 2: Validation des données invalides');

    const invalidTests = [
      {
        name: 'Code trop court',
        data: { code: 'F', name: 'TEST_France', flag: '🇫🇷' }
      },
      {
        name: 'Code trop long', 
        data: { code: 'FRANCE', name: 'TEST_France', flag: '🇫🇷' }
      },
      {
        name: 'Nom manquant',
        data: { code: 'FR', flag: '🇫🇷' }
      },
      {
        name: 'Drapeau manquant',
        data: { code: 'FR', name: 'TEST_France' }
      },
      {
        name: 'Continent invalide',
        data: { code: 'FR', name: 'TEST_France', flag: '🇫🇷', continent: 'Mars' }
      },
      {
        name: 'Type incorrect (nom = objet)',
        data: { code: 'XX', name: { invalid: 'object' }, flag: '🏳️' }  // Objet impossible à convertir
      }
    ];

    for (const test of invalidTests) {
      try {
        const invalidCountry = new Country(test.data);
        await invalidCountry.save();
        console.log(`⚠️  PROBLÈME: ${test.name} - devrait être rejeté !`);
      } catch (error) {
        console.log(`✅ ${test.name} - correctement rejeté:`);
        console.log(`   Erreur: ${error.message.split(',')[0]}`);
      }
    }

    // =============================================================================
    // TEST 3: Contrainte unique (codes pays en double)
    // =============================================================================
    console.log('\n🔒 TEST 3: Contrainte unique');

    try {
      // Essayer de créer un deuxième pays avec le même code
      const duplicateCountry = new Country({
        code: 'FR',              // Code déjà utilisé !
        name: 'TEST_France_Duplicate',
        flag: '🇫🇷'
      });
      await duplicateCountry.save();
      console.log('⚠️  PROBLÈME: Code dupliqué accepté !');
    } catch (error) {
      console.log('✅ Code dupliqué correctement rejeté:');
      console.log(`   Erreur: ${error.message}`);
    }

    // =============================================================================
    // TEST 4: Recherches avec index
    // =============================================================================
    console.log('\n🔍 TEST 4: Recherches optimisées');

    // Recherche par code (index optimisé)
    const startTime1 = Date.now();
    const france = await Country.findOne({ code: 'FR' });
    const endTime1 = Date.now();
    console.log(`✅ Recherche par code: ${france.name} trouvé en ${endTime1 - startTime1}ms`);

    // Recherche par nom (index optimisé)
    const startTime2 = Date.now();
    const japan = await Country.findOne({ name: 'Japan' });
    const endTime2 = Date.now();
    console.log(`✅ Recherche par nom: ${japan.name} trouvé en ${endTime2 - startTime2}ms`);

    // Recherche pays actifs (index optimisé)
    const startTime3 = Date.now();
    const activeCountries = await Country.find({ isActive: true });
    const endTime3 = Date.now();
    console.log(`✅ Pays actifs: ${activeCountries.length} trouvés en ${endTime3 - startTime3}ms`);

    // Recherche par continent (pas d'index, plus lent)
    const startTime4 = Date.now();
    const europeanCountries = await Country.find({ continent: 'Europe' });
    const endTime4 = Date.now();
    console.log(`✅ Pays européens: ${europeanCountries.length} trouvés en ${endTime4 - startTime4}ms`);

    // =============================================================================
    // TEST 5: Modification et timestamps
    // =============================================================================
    console.log('\n📝 TEST 5: Modification et timestamps');

    const country = await Country.findOne({ code: 'US' });
    console.log(`📅 Avant modification - updatedAt: ${country.updatedAt}`);

    // Attendre 1 seconde pour voir la différence
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Modifier le pays
    country.capital = 'Washington D.C.';
    country.population = 331000000;
    await country.save();

    const updatedCountry = await Country.findOne({ code: 'US' });
    console.log(`📅 Après modification - updatedAt: ${updatedCountry.updatedAt}`);
    console.log(`✅ Timestamps mis à jour automatiquement`);

    // =============================================================================
    // TEST 6: Requêtes complexes pour ton app Vizza
    // =============================================================================
    console.log('\n🎯 TEST 6: Requêtes pour l\'app Vizza');

    // Tous les pays actifs pour le dropdown origine/destination
    const availableCountries = await Country.find(
      { isActive: true },
      { code: 1, name: 1, flag: 1 }  // Seulement ces champs (optimisation)
    ).sort({ name: 1 });             // Trié par nom
    
    console.log('📋 Pays disponibles pour l\'app:');
    availableCountries.forEach(country => {
      console.log(`   ${country.flag} ${country.name} (${country.code})`);
    });

    // Recherche par code pour l'API
    const searchCode = 'FR';
    const countryForAPI = await Country.findOne({ code: searchCode });
    if (countryForAPI) {
      console.log(`\n🔍 API recherche ${searchCode}:`);
      console.log(`   Nom: ${countryForAPI.name}`);
      console.log(`   Drapeau: ${countryForAPI.flag}`);
      console.log(`   Actif: ${countryForAPI.isActive}`);
    }

    // =============================================================================
    // STATISTIQUES FINALES
    // =============================================================================
    console.log('\n📊 STATISTIQUES FINALES:');
    
    const totalCountries = await Country.countDocuments();
    const activeCountries2 = await Country.countDocuments({ isActive: true });
    const europeanCount = await Country.countDocuments({ continent: 'Europe' });
    
    console.log(`   - Total pays: ${totalCountries}`);
    console.log(`   - Pays actifs: ${activeCountries2}`);
    console.log(`   - Pays européens: ${europeanCount}`);

    console.log('\n🎉 Tous les tests terminés avec succès !');

  } catch (error) {
    console.error('💥 Erreur pendant les tests:', error);
  } finally {
    // Fermer la connexion
    await mongoose.connection.close();
    console.log('🔌 Connexion MongoDB fermée');
    process.exit(0);
  }
};

// Lancer les tests
testCountryModel();
