// =============================================================================
// backend/scripts/testAuthMiddleware.js - Test du middleware d'authentification
// =============================================================================
const express = require('express');
const cookieParser = require('cookie-parser');
const { generateToken } = require('../utils/jwt');
const { authenticateToken, optionalAuthentication, extractToken } = require('../middleware/auth');

// Créer une app Express pour les tests
const app = express();
app.use(cookieParser()); // Pour parser les cookies
app.use(express.json());

// =============================================================================
// ROUTES DE TEST
// =============================================================================

// Route publique (pas d'auth)
app.get('/api/public', (req, res) => {
  res.json({ message: 'Route publique accessible' });
});

// Route protégée obligatoire
app.get('/api/protected', authenticateToken, (req, res) => {
  res.json({ 
    message: `Bonjour ${req.user.firstName} !`,
    user: req.user 
  });
});

// Route avec auth optionnelle
app.get('/api/optional', optionalAuthentication, (req, res) => {
  if (req.user) {
    res.json({ 
      message: `Contenu personnalisé pour ${req.user.firstName}`,
      user: req.user 
    });
  } else {
    res.json({ 
      message: 'Contenu public',
      user: null 
    });
  }
});

// Route pour créer un token de test
app.post('/api/test/token', (req, res) => {
  const testUser = {
    _id: '507f1f77bcf86cd799439011',
    email: 'test@vizza.com',
    firstName: 'Jean',
    lastName: 'Test'
  };
  
  const token = generateToken(testUser);
  
  // Définir le cookie
  res.cookie('token', token, {
    httpOnly: true,
    secure: false, // false pour les tests locaux
    sameSite: 'strict',
    maxAge: 4 * 60 * 60 * 1000 // 4 heures
  });
  
  res.json({ 
    success: true,
    message: 'Token créé et défini dans les cookies',
    token: token
  });
});

// Route pour supprimer le token
app.post('/api/test/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ 
    success: true,
    message: 'Token supprimé des cookies'
  });
});

// =============================================================================
// FONCTION DE TEST
// =============================================================================

const testAuthMiddleware = async () => {
  try {
    console.log('🧪 === TEST DU MIDDLEWARE D\'AUTHENTIFICATION ===\n');
    
    // Démarrer le serveur de test
    const server = app.listen(3001, () => {
      console.log('🚀 Serveur de test démarré sur http://localhost:3001');
    });
    
    // Attendre un peu pour que le serveur démarre
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Importer fetch pour les tests
    const fetch = require('node-fetch');
    const baseURL = 'http://localhost:3001';
    
    // ==========================================================================
    // TEST 1: Route publique (doit marcher)
    // ==========================================================================
    console.log('📋 TEST 1: Route publique');
    
    const publicResponse = await fetch(`${baseURL}/api/public`);
    const publicData = await publicResponse.json();
    
    console.log('✅ Statut:', publicResponse.status);
    console.log('✅ Réponse:', publicData.message);
    
    // ==========================================================================
    // TEST 2: Route protégée sans token (doit échouer)
    // ==========================================================================
    console.log('\n🔒 TEST 2: Route protégée sans token');
    
    const protectedResponse = await fetch(`${baseURL}/api/protected`);
    const protectedData = await protectedResponse.json();
    
    console.log('❌ Statut:', protectedResponse.status);
    console.log('❌ Code erreur:', protectedData.code);
    console.log('❌ Message:', protectedData.message);
    
    // ==========================================================================
    // TEST 3: Créer un token
    // ==========================================================================
    console.log('\n🔑 TEST 3: Création d\'un token de test');
    
    const tokenResponse = await fetch(`${baseURL}/api/test/token`, {
      method: 'POST'
    });
    const tokenData = await tokenResponse.json();
    
    console.log('✅ Token créé:', tokenData.success);
    console.log('🍪 Cookie défini automatiquement');
    
    // Récupérer le cookie pour les tests suivants
    const cookies = tokenResponse.headers.get('set-cookie');
    
    // ==========================================================================
    // TEST 4: Route protégée avec token (doit marcher)
    // ==========================================================================
    console.log('\n🔓 TEST 4: Route protégée avec token');
    
    const authResponse = await fetch(`${baseURL}/api/protected`, {
      headers: {
        'Cookie': cookies // Inclure le cookie
      }
    });
    const authData = await authResponse.json();
    
    console.log('✅ Statut:', authResponse.status);
    console.log('✅ Message:', authData.message);
    console.log('👤 Utilisateur:', authData.user.firstName, authData.user.lastName);
    console.log('📧 Email:', authData.user.email);
    
    // ==========================================================================
    // TEST 5: Authorization header
    // ==========================================================================
    console.log('\n📡 TEST 5: Token via Authorization header');
    
    const headerResponse = await fetch(`${baseURL}/api/protected`, {
      headers: {
        'Authorization': `Bearer ${tokenData.token}`
      }
    });
    const headerData = await headerResponse.json();
    
    console.log('✅ Statut:', headerResponse.status);
    console.log('✅ Message:', headerData.message);
    
    // ==========================================================================
    // TEST 6: Route optionnelle sans token
    // ==========================================================================
    console.log('\n⚡ TEST 6: Route optionnelle sans token');
    
    const optionalResponse = await fetch(`${baseURL}/api/optional`);
    const optionalData = await optionalResponse.json();
    
    console.log('✅ Statut:', optionalResponse.status);
    console.log('✅ Message:', optionalData.message);
    console.log('👤 Utilisateur:', optionalData.user);
    
    // ==========================================================================
    // TEST 7: Route optionnelle avec token
    // ==========================================================================
    console.log('\n⚡ TEST 7: Route optionnelle avec token');
    
    const optionalAuthResponse = await fetch(`${baseURL}/api/optional`, {
      headers: {
        'Cookie': cookies
      }
    });
    const optionalAuthData = await optionalAuthResponse.json();
    
    console.log('✅ Statut:', optionalAuthResponse.status);
    console.log('✅ Message:', optionalAuthData.message);
    console.log('👤 Utilisateur:', optionalAuthData.user.firstName);
    
    // ==========================================================================
    // TEST 8: Token invalide
    // ==========================================================================
    console.log('\n❌ TEST 8: Token invalide');
    
    const invalidResponse = await fetch(`${baseURL}/api/protected`, {
      headers: {
        'Authorization': 'Bearer token.invalide.signature'
      }
    });
    const invalidData = await invalidResponse.json();
    
    console.log('❌ Statut:', invalidResponse.status);
    console.log('❌ Code erreur:', invalidData.code);
    console.log('❌ Message:', invalidData.message);
    
    console.log('\n🎉 === TOUS LES TESTS TERMINÉS ===');
    
    // Fermer le serveur
    server.close();
    
  } catch (error) {
    console.error('💥 Erreur durant les tests:', error.message);
  }
};

// Lancer les tests si ce fichier est exécuté directement
if (require.main === module) {
  testAuthMiddleware();
}

module.exports = { testAuthMiddleware };
