const mongoose = require('mongoose');
require('dotenv').config();

// Import des modèles
const Country = require('../models/Country');
const VisaRequirement = require('../models/VisaRequirement');

const testVisaRequirementModel = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connecté à MongoDB pour les tests');

    console.log('\n PRÉPARATION: Création des pays de test');

    // Nettoyer les données de test
    await Country.deleteMany({ code: { $in: ['T1', 'T2', 'T3'] } });
    await VisaRequirement.deleteMany({}); // Supprimer TOUS les visas (plus simple pour les tests)
    console.log('🧹 Données de test nettoyées');

    // Créer des pays de test
    const testCountries = [
      { code: 'T1', name: 'TEST_France', flag: '🇫🇷', continent: 'Europe', isActive: true },
      { code: 'T2', name: 'TEST_Japan', flag: '🇯🇵', continent: 'Asia', isActive: true },
      { code: 'T3', name: 'TEST_USA', flag: '🇺🇸', continent: 'North America', isActive: true }
    ];

    // Créer des pays de test
    const savedCountries = await Country.insertMany(testCountries);
    console.log(' 3 pays de test créés (T1=France, T2=Japan, T3=USA)');

    // Récupérer les ObjectId des pays créés
    const t1Country = savedCountries.find(c => c.code === 'T1');
    const t2Country = savedCountries.find(c => c.code === 'T2');
    const t3Country = savedCountries.find(c => c.code === 'T3');

    console.log('\nTEST 1: Création d\'exigences de visa');

    const testVisas = [
      {
        originCountry: t1Country._id,        // ObjectId au lieu de 'T1'
        destinationCountry: t2Country._id,   // ObjectId au lieu de 'T2'
        requirement: 'blue',
        requirementText: 'Visa on arrival',
        maxStay: '90 days',
        cost: 'Free'
      },
      {
        originCountry: t2Country._id,        // ObjectId
        destinationCountry: t1Country._id,   // ObjectId
        requirement: 'green',
        requirementText: 'Visa not required',
        maxStay: '90 days',
        cost: 'Free'
      },
      {
        originCountry: t3Country._id,        // ObjectId
        destinationCountry: t1Country._id,   // ObjectId
        requirement: 'green', 
        requirementText: 'Visa not required',
        maxStay: '90 days'
      },
      {
        originCountry: t1Country._id,        // ObjectId
        destinationCountry: t3Country._id,   // ObjectId
        requirement: 'yellow',
        requirementText: 'eTA required',
        processingTime: 'Immediate',
        cost: '$14'
      }
    ];

    for (const visaData of testVisas) {
      const visa = new VisaRequirement(visaData);
      const savedVisa = await visa.save();
      console.log(`Visa ${savedVisa.originCountry} → ${savedVisa.destinationCountry}: ${savedVisa.requirement}`);
    }

    console.log('\nTEST 2: Validation des données invalides');

    const invalidTests = [
      {
        name: 'Pays origine manquant',
        data: { destinationCountry: t2Country._id, requirement: 'green', requirementText: 'Visa not required' }
      },
      {
        name: 'Requirement invalide',
        data: { originCountry: t1Country._id, destinationCountry: t2Country._id, requirement: 'purple', requirementText: 'Invalid' }
      },
      {
        name: 'RequirementText invalide',
        data: { originCountry: t1Country._id, destinationCountry: t2Country._id, requirement: 'green', requirementText: 'Invalid text' }
      }
    ];

    for (const test of invalidTests) {
      try {
        const invalidVisa = new VisaRequirement(test.data);
        await invalidVisa.save();
        console.log(`  PROBLÈME: ${test.name} - devrait être rejeté !`);
      } catch (error) {
        console.log(` ${test.name} - correctement rejeté:`);
        console.log(`   Erreur: ${error.message.split(',')[0]}`);
      }
    }

    console.log('\nTEST 3: Contrainte unique sur paire de pays');

    try {
      const duplicateVisa = new VisaRequirement({
        originCountry: t1Country._id,
        destinationCountry: t2Country._id,    // Même paire qu'un visa existant !
        requirement: 'red',
        requirementText: 'Visa required'
      });
      await duplicateVisa.save();
      console.log(' PROBLÈME: Paire dupliquée acceptée !');
    } catch (error) {
      console.log('Paire dupliquée correctement rejetée:');
      console.log(`   Erreur: Index unique violé`);
    }

    console.log('\nTEST 4: Recherches sans populate');

    // Recherche simple
    const visa1 = await VisaRequirement.findOne({
      originCountry: t1Country._id,      // Utiliser l'ObjectId
      destinationCountry: t2Country._id   // Utiliser l'ObjectId
    });

    console.log(' Visa T1→T2 sans populate:');
    console.log(`   Origine: ${visa1.originCountry} (juste le code)`);
    console.log(`   Destination: ${visa1.destinationCountry} (juste le code)`);
    console.log(`   Exigence: ${visa1.requirementText}`);

    // Toutes les exigences depuis T1 (France test)
    const visasFromT1 = await VisaRequirement.find({ originCountry: t1Country._id });
    console.log(`\n Visas depuis T1: ${visasFromT1.length} destinations`);

    console.log('\n TEST 5: Recherches avec populate');

    // Recherche enrichie d'un visa
    const enrichedVisa = await VisaRequirement.findOne({
      originCountry: t1Country._id,
      destinationCountry: t2Country._id
    }).populate('originCountry destinationCountry');

    console.log(' Visa T1→T2 avec populate:');
    console.log(`   ${enrichedVisa.originCountry.flag} ${enrichedVisa.originCountry.name}`);
    console.log(`   → ${enrichedVisa.destinationCountry.flag} ${enrichedVisa.destinationCountry.name}`);
    console.log(`   Exigence: ${enrichedVisa.requirementText}`);
    console.log(`   Durée max: ${enrichedVisa.maxStay || 'Non spécifié'}`);
    console.log(`   Coût: ${enrichedVisa.cost || 'Non spécifié'}`);

    // Toutes les destinations depuis T1 avec pays complets
    const enrichedVisasFromT1 = await VisaRequirement.find({ 
      originCountry: t1Country._id 
    }).populate('destinationCountry');

    console.log(`\n  Destinations depuis ${testCountries[0].name}:`);
    enrichedVisasFromT1.forEach(visa => {
      const dest = visa.destinationCountry;
      console.log(`   ${dest.flag} ${dest.name}: ${visa.requirementText}`);
    });

    // =============================================================================
    // TEST 6: Méthode personnalisée getReadableRequirement()
    // =============================================================================
    console.log('\n TEST 6: Méthode personnalisée');

    const visaForMethod = await VisaRequirement.findOne({ requirement: 'yellow' });
    console.log(` Requirement code: ${visaForMethod.requirement}`);
    console.log(` Méthode getReadableRequirement(): ${visaForMethod.getReadableRequirement()}`);
    console.log(` RequirementText: ${visaForMethod.requirementText}`);

    console.log('\nTEST 7: Recherches pour l\'app Vizza');

    // Cas d'usage 1: Tous les pays sans visa depuis T1
    const noVisaRequired = await VisaRequirement.find({
      originCountry: t1Country._id,
      requirement: 'green'
    }).populate('destinationCountry');

    console.log(` Pays sans visa depuis T1:`);
    noVisaRequired.forEach(visa => {
      console.log(`   ${visa.destinationCountry.flag} ${visa.destinationCountry.name}`);
    });

    // Cas d'usage 2: Tous les pays nécessitant eTA
    const etaRequired = await VisaRequirement.find({
      requirement: 'yellow'
    }).populate('originCountry destinationCountry');

    console.log(` Voyages nécessitant eTA:`);
    etaRequired.forEach(visa => {
      console.log(`   ${visa.originCountry.name} → ${visa.destinationCountry.name}`);
    });

    // Cas d'usage 3: Vérifier si visa existe pour une paire
    const visaExists = await VisaRequirement.exists({
      originCountry: t1Country._id,
      destinationCountry: t2Country._id
    });
    console.log(`\n Visa T1→T2 existe? ${visaExists ? 'Oui' : 'Non'}`);

    console.log('\n TEST 8: Performance des recherches');

    const startTime1 = Date.now();
    await VisaRequirement.findOne({ originCountry: t1Country._id, destinationCountry: t2Country._id });
    const endTime1 = Date.now();
    console.log(` Recherche avec index composé: ${endTime1 - startTime1}ms`);

    const startTime2 = Date.now();
    await VisaRequirement.find({ originCountry: t1Country._id });
    const endTime2 = Date.now();
    console.log(` Recherche avec index simple: ${endTime2 - startTime2}ms`);

    console.log('\n STATISTIQUES FINALES:');

    const totalVisas = await VisaRequirement.countDocuments();
    const greenVisas = await VisaRequirement.countDocuments({ requirement: 'green' });
    const blueVisas = await VisaRequirement.countDocuments({ requirement: 'blue' });
    const yellowVisas = await VisaRequirement.countDocuments({ requirement: 'yellow' });

    console.log(`   - Total visas: ${totalVisas}`);
    console.log(`   - Visa libre (green): ${greenVisas}`);
    console.log(`   - Visa à l'arrivée (blue): ${blueVisas}`);
    console.log(`   - eTA requis (yellow): ${yellowVisas}`);

    console.log('\n Nettoyage des données de test');
    await Country.deleteMany({ code: { $in: ['T1', 'T2', 'T3'] } });
    await VisaRequirement.deleteMany({}); // Supprimer tous les visas de test
    console.log(' Données de test supprimées');

    console.log('\n Tests VisaRequirement terminés avec succès !');

  } catch (error) {
    console.error(' Erreur pendant les tests:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Connexion MongoDB fermée');
    process.exit(0);
  }
};

testVisaRequirementModel();
