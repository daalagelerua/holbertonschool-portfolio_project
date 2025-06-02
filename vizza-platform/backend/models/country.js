const mongoose = require('mongoose');

const countrySchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
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
    type: String,
    required: true
  },
  continent: {
    type: String,
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
  timestamps: true
});

// Index pour optimiser les recherches
countrySchema.index({ code: 1 });
countrySchema.index({ name: 1 });
countrySchema.index({ isActive: 1 });

module.exports = mongoose.model('Country', countrySchema);
