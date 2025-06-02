// Point d'entrée
const app = require('./app');
const connectDB = require('./config/database');

const PORT = process.env.PORT || 3000;

// Fonction de démarrage asynchrone
const startServer = async () => {
  try {
    // 1. Connecter à la base de données
    // await connectDB();
    if (process.env.MONGODB_URI && !process.env.SKIP_DB) {
      await connectDB();
    } else {
      console.log('⚠️  MongoDB skippé - mode développement sans DB');
    }
    
    // 2. Démarrer le serveur
    const server = app.listen(PORT, () => {
      console.log(`Serveur Vizza démarré sur le port ${PORT}`);
      console.log(`API: http://localhost:${PORT}/api`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });

    // Gestion propre de l'arrêt du serveur
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
