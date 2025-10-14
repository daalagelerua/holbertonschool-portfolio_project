require('dotenv').config({ path: '../.env' });
const fetch = require('node-fetch');

async function testAPI() {
  console.log('🔑 RAPIDAPI_KEY:', process.env.RAPIDAPI_KEY ? 'Définie (' + process.env.RAPIDAPI_KEY.substring(0, 10) + '...)' : '❌ NON DÉFINIE');
  console.log('🌐 RAPIDAPI_HOST:', process.env.RAPIDAPI_HOST);
  
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'x-rapidapi-host': process.env.RAPIDAPI_HOST,
      'x-rapidapi-key': process.env.RAPIDAPI_KEY
    },
    body: 'passport=FR'
  };
  
  console.log('\n📤 Envoi de la requête...');
  console.log('URL:', 'https://visa-requirement.p.rapidapi.com/v2/visa/map');
  console.log('Headers:', JSON.stringify(options.headers, null, 2));
  console.log('Body:', options.body);
  
  try {
    const response = await fetch('https://visa-requirement.p.rapidapi.com/v2/visa/map', options);
    
    console.log('\n📥 Réponse:');
    console.log('Status:', response.status, response.statusText);
    console.log('Headers:', JSON.stringify(Object.fromEntries(response.headers), null, 2));
    
    const text = await response.text();
    console.log('\n📄 Body:', text.substring(0, 500));
    
    if (response.ok) {
      const data = JSON.parse(text);
      console.log('\n✅ Succès !');
      console.log('Structure:', Object.keys(data));
      if (data.data?.colors) {
        console.log('Couleurs:', Object.keys(data.data.colors));
      }
    } else {
      console.log('\n❌ Erreur');
      try {
        const error = JSON.parse(text);
        console.log('Erreur détaillée:', JSON.stringify(error, null, 2));
      } catch (e) {
        console.log('Réponse texte:', text);
      }
    }
  } catch (error) {
    console.error('\n💥 Erreur:', error.message);
  }
}

testAPI();
