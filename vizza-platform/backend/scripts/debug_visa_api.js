const mongoose = require('mongoose');
const fetch = require('node-fetch');
require('dotenv').config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');
    
    // Test API avec plus de détails
    console.log('\n🌐 Test API RapidAPI détaillé...');
    const response = await fetch('https://visa-requirement.p.rapidapi.com/map', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'x-rapidapi-host': process.env.RAPIDAPI_HOST,
        'x-rapidapi-key': process.env.RAPIDAPI_KEY
      },
      body: 'passport=FR'
    });
    
    if (!response.ok) {
      console.log('❌ Erreur API:', response.status, response.statusText);
      return;
    }
    
    const data = await response.json();
    console.log('📊 Structure complète des données:');
    console.log('Type:', typeof data);
    console.log('Clés totales:', Object.keys(data).length);
    
    // Afficher les 10 premières entrées
    console.log('\n📋 Premiers 10 éléments:');
    const entries = Object.entries(data).slice(0, 10);
    entries.forEach(([key, value]) => {
      console.log(`  "${key}": "${value}"`);
    });
    
    // Chercher des patterns
    console.log('\n🔍 Analyse des patterns:');
    const keys = Object.keys(data);
    console.log('Premières clés:', keys.slice(0, 10));
    console.log('Dernières clés:', keys.slice(-10));
    
    // Test si certaines clés ressemblent à des codes pays
    const possibleCountryCodes = keys.filter(key => 
      key.length === 2 && key.match(/^[A-Z]{2}$/)
    );
    console.log('Codes qui ressemblent à ISO:', possibleCountryCodes.slice(0, 10));
    
  } catch (error) {
    console.error('💥 Erreur:', error.message);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Connexion fermée');
  }
})();
