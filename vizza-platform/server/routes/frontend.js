const express = require('express');
const path = require('path');
const ejsLayouts = require('express-ejs-layouts');
const router = express.Router();

// Configuration d'EJS
const configureEJS = (app) => {
  // Définir EJS comme moteur de template
  app.set('view engine', 'ejs');
  
  // Définir le dossier des vues
  app.set('views', path.join(__dirname, '../views'));
  
  // Configurer le middleware express-ejs-layouts
  app.use(ejsLayouts);
  app.set('layout', 'layout/main'); // Chemin vers layout principal
};

/**
 * Page d'accueil
 * GET /
 */
router.get('/', (req, res) => {
  res.render('pages/index', {
    title: 'Accueil',
    pageScript: '/js/index.js' // Script externe pour éviter CSP
  });
});

/**
 * Page de recherche
 * GET /search
 */
router.get('/search', (req, res) => {
  res.render('pages/search', {
    title: 'Recherche de Visas',
    pageScript: '/js/search.js' // Script spécifique à la recherche
  });
});

/**
 * Page des favoris (protégée)
 * GET /favorites
 */
router.get('/favorites', (req, res) => {
  res.render('pages/favorites', {
    title: 'Mes Favoris',
    pageScript: '/js/favorites.js'
  });
});

/**
 * Page de connexion
 * GET /login
 */
router.get('/login', (req, res) => {
  res.render('pages/login', {
    title: 'Connexion',
    pageScript: '/js/login.js'
  });
});

/**
 * Page d'inscription
 * GET /register
 */
router.get('/register', (req, res) => {
  res.render('pages/register', {
    title: 'Inscription',
    pageScript: '/js/register.js'
  });
});

/**
 * Page de profil (protégée)
 * GET /profile
 */
router.get('/profile', (req, res) => {
  res.render('pages/profile', {
    title: 'Mon Profil',
    pageScript: '/js/profile.js'
  });
});


module.exports = {
  router,
  configureEJS
};
