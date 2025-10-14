// Configuration Express
const express = require('express');  // le framework
const cors = require('cors');  // permet aux navigateurs d'autres domaines d'accéder à l'API
const helmet = require('helmet');  // ajoute de la sécurité automatiquement
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config();  // lit le fichier .env pour récupérer les variables secrètes

// Import des routes
const authRoutes = require('./routes/authRoutes');
const visaRoutes = require('./routes/visaRoutes');
const { router: frontendRoutes, configureEJS } = require('./routes/frontend');

const app = express();  // va permettre d'equiper le server web(app) de fonctionnalités -> helmet, cors

// app.use = utilise cette fonctionnalité pour toutes les requetes
app.use(cookieParser());

app.use((err, req, res, next) => {  // si JSON malformé renvoie un message d'erreur clair
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ success: false, message: 'Invalid JSON' });
  }
  next(err);  // Si ce n'est pas une erreur JSON -> Passe au gestionnaire d'erreurs suivant
});

// Configurer EJS
configureEJS(app);

// Middleware de sécurité et configuration

// - Helmet: pour proteger l'application des
// vulnerabilités connues d'express (headers HTTP)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
        connectSrc: ["'self'", "https://restcountries.com"],
        imgSrc: ["'self'", "data:", "https:"],
        fontSrc: ["'self'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
      },
    },
  })
);

// CORS pour permettre les requêtes cross-origin
app.use(cors({
  origin: process.env.NODE_ENV === 'production'  // operateur ternaire, si environnement de prod -> ?, sinon -> :
    ? ['https://future_domaine.com']  // a remplacer lors du deployement
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true  // permet aux cookies de passer et a la session de fonctionner
}));

// Parser JSON (limite à 10MB pour eviter les surcharges)
// permet de comprendre les données json
app.use(express.json({ limit: '10mb' }));

// Parser URL-encoded (pour les formulaires html)
app.use(express.urlencoded({ extended: true }));  // extended: true -> permet d'avoir la bonne structure de données pour les requetes future (objets imbriqués, tableaux)

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, 'public')));

// Utilisation des routes API, (/api/ -> convention d'organisation)
app.use('/api/auth', authRoutes);
app.use('/api/visas', visaRoutes);

// Routes frontend (pages)
app.use('/', frontendRoutes);

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
  console.error('Erreur serveur:', err.stack);
  
  res.status(err.status || 500).json({  // Utilise le code d'erreur de l'erreur OU 500 par défaut
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong!'  // message simple sans infos sensibles
      : err.message,  // message détaillé pour debuguer
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

module.exports = app;
