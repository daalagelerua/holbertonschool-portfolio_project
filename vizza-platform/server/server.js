// Point d'entrée
const app = require('./app');  // recupere la configuration d'express
const connectDB = require('./config/database');  // Récupère la fonction pour se connecter à MongoDB

const PORT = process.env.PORT || 3000;  // recupere variable d'environnement, par default 3000

// Fonction de démarrage asynchrone
const startServer = async () => {
  try {
    // 1. Connecter à la base de données
    await connectDB();
    
    // 2. Démarrer le serveur (stocké dans 'server' pour pouvoir l'arreté proprement derriere)
    const server = app.listen(PORT, 'localhost', () => {
      console.log(`Serveur Vizza démarré sur le port ${PORT}`);
      console.log(`API: http://localhost:${PORT}/api`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });

    // Gestion propre de l'arrêt du serveur (SIGTERM = signal de terminaison)
    // permet d'attendre la fin des requetes en cours avant la fermeture du server
    process.on('SIGTERM', () => {
      console.log('SIGTERM reçu, arrêt du serveur...');
      server.close(() => {
        console.log('Serveur arrêté proprement');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('Erreur au démarrage:', error);
    process.exit(1);
  }
};

// Démarrer l'application
startServer();
