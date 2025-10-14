const mongoose = require('mongoose');
require('dotenv').config();
const { Country, VisaRequirement } = require('../models');

const cleanDuplicates = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Supprimer les pays en double (garde seulement le premier de chaque code)
    const countries = await Country.find();
    const seen = new Set();
    let deletedCount = 0;

    for (const country of countries) {
      if (seen.has(country.code)) {
        // Doublon trouvé, supprimer
        await Country.findByIdAndDelete(country._id);
        deletedCount++;
        console.log(`🗑️  Supprimé doublon: ${country.code} - ${country.name}`);
      } else {
        seen.add(country.code);
      }
    }

    console.log(`✅ ${deletedCount} doublons supprimés`);

    // Vérifier le résultat
    const totalCountries = await Country.countDocuments();
    const activeCountries = await Country.countDocuments({ isActive: true });
    
    console.log(`📊 Pays restants: ${totalCountries} (actifs: ${activeCountries})`);

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
};

cleanDuplicates();
