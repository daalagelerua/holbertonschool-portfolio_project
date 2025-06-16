const mongoose = require('mongoose');  // outil pour parler à MongoDB depuis Node.js

const connectDB = async () => {
  try {
    // Connexion à MongoDB
    const connection = await mongoose.connect(process.env.MONGODB_URI, {  // recupere l'adresse depuis .env
      // useNewUrlParser: true,   par default depuis v6 (ancien obsolete)
      // useUnifiedTopology: true,   par default depuis v6 (eviter probleme de reconnexion)
    });

    console.log(`MongoDB connecté: ${connection.connection.host}`);  // Récupère l'adresse du serveur MongoDB
    
    // Événements de connexion pour debugging
    // 'on' = etre a l'ecoute/surveiller
    mongoose.connection.on('error', (err) => {
      console.error('Erreur MongoDB:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB déconnecté');
    });

  } catch (error) {
    console.error('Erreur de connexion MongoDB:', error.message);
    process.exit(1); // Arrêter l'app si pas de DB
  }
};

module.exports = connectDB;
