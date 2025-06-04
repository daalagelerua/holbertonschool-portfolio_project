const mongoose = require('mongoose');  // on recupere mongoose pour créer le schema

// schema principal
const countrySchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,  //crée un index automatiquement
    uppercase: true,
    minlength: 2,
    maxlength: 3
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  flag: {
    type: String,  // emoji = texte unicode
    required: true
  },
  continent: {
    type: String,  // enum -> limite les options, evite les erreurs
    enum: ['Africa', 'Asia', 'Europe', 'North America', 'South America', 'Oceania', 'Antarctica']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Données supplémentaires de REST Countries API
  capital: String,
  population: Number,
  region: String,
  subregion: String
}, {
  timestamps: true  // ajoute createAt et updatedAt automatiquement
});

// Index pour optimiser les recherches
// regle importante: Crée des index seulement pour les requêtes que tu fais SOUVENT (trop d'index degrade les performances)
countrySchema.index({ code: 1 });
countrySchema.index({ name: 1 });
countrySchema.index({ isActive: 1 });

module.exports = mongoose.model('Country', countrySchema);
