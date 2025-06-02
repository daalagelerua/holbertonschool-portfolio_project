const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Connexion à MongoDB
    const connection = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB connecté: ${connection.connection.host}`);
    
    // Événements de connexion pour debugging
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
