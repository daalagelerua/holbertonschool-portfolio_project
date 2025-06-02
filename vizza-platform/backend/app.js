// Configuration Express
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ success: false, message: 'Invalid JSON' });
  }
  next(err);
});

// Middleware de sécurité et configuration

// - Helmet: pour proteger l'application des
// vulnerabilités connues d'express (headers HTTP)
app.use(helmet());

// CORS pour permettre les requêtes cross-origin
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://ton-domaine.com'] 
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));

// Parser JSON (limite à 10MB)
app.use(express.json({ limit: '10mb' }));

// Parser URL-encoded (pour les formulaires)
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers statiques
app.use(express.static('frontend/public'));

// Tests Temporaires
// Route de santé
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Vizza API is running!',
    timestamp: new Date().toISOString()
  });
});

// Route de test pour les pays
app.get('/api/countries', (req, res) => {
  // Données mockées pour commencer
  const mockCountries = [
    { code: 'FR', name: 'France', flag: '🇫🇷' },
    { code: 'ES', name: 'Spain', flag: '🇪🇸' },
    { code: 'US', name: 'United States', flag: '🇺🇸' },
    { code: 'JP', name: 'Japan', flag: '🇯🇵' },
    { code: 'AU', name: 'Australia', flag: '🇦🇺' }
  ];
  
  res.json({
    success: true,
    data: mockCountries,
    count: mockCountries.length
  });
});

// Route de test pour l'API visa requirement
app.get('/api/test-visa-api/:passport', async (req, res) => {
  try {
    const { passport } = req.params;
    
    // Configuration de la requête
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'x-rapidapi-host': process.env.RAPIDAPI_HOST,
        'x-rapidapi-key': process.env.RAPIDAPI_KEY
      },
      body: `passport=${passport}`
    };

    // Import fetch pour Node.js < 18
    const fetch = require('node-fetch');
    
    // Appel à l'API
    const response = await fetch('https://visa-requirement.p.rapidapi.com/map', options);
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Retourner les données avec quelques infos de debug
    res.json({
      success: true,
      passport: passport,
      totalCountries: data ? Object.keys(data).length : 0,
      sampleData: data ? Object.entries(data).slice(0, 5) : [],
      fullData: data
    });

  } catch (error) {
    console.error('Erreur API Visa:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      passport: req.params.passport
    });
  }
});

// Gestion d'erreur
// Route inexistante
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Gestionnaire d'erreurs global
app.use((err, req, res, next) => {
  console.error('💥 Erreur serveur:', err.stack);
  
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong!' 
      : err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

module.exports = app;
