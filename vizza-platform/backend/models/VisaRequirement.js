const mongoose = require('mongoose');  // on recupere mongoose pour créer le schema

const visaRequirementSchema = new mongoose.Schema({
  originCountry: {
    type: mongoose.Schema.Types.ObjectId,  // ObjectId au lieu de String ("FR") pour correspondre a l'attendu de mongoose
    required: true,
    uppercase: true,
    ref: 'Country'
  },
  destinationCountry: {
    type: mongoose.Schema.Types.ObjectId,  // ObjectId au lieu de String ("FR") pour correspondre a l'attendu de mongoose
    required: true,
    uppercase: true,
    ref: 'Country'
  },
  requirement: {
    type: String,
    required: true,
    enum: ['green', 'yellow', 'blue', 'red'] // Couleurs de l'API
  },
  requirementText: {
    type: String,
    required: true,
    enum: [
      'Visa not required',
      'eTA required', 
      'Visa on arrival',
      'eVisa',
      'Visa required',
      'Not admitted'
    ]
  },
  // Informations détaillées
  maxStay: {
    type: String, // "90 days", "30 days", etc.
    default: null
  },
  processingTime: {
    type: String, // "Immediate", "1-3 days", etc.
    default: null
  },
  cost: {
    type: String, // "Free", "$50", "€35", etc.
    default: null
  },
  notes: {
    type: String,
    default: null
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index composé pour optimiser les recherches de visa
visaRequirementSchema.index({ originCountry: 1, destinationCountry: 1 }, { unique: true });
visaRequirementSchema.index({ originCountry: 1 });
visaRequirementSchema.index({ requirement: 1 });

// Méthode pour obtenir la description lisible
visaRequirementSchema.methods.getReadableRequirement = function() {
  const colorToText = {
    'green': 'Visa not required',
    'yellow': 'eTA required',
    'blue': 'Visa on arrival or eVisa', 
    'red': 'Visa required'
  };
  return colorToText[this.requirement] || 'Unknown requirement';
};

module.exports = mongoose.model('VisaRequirement', visaRequirementSchema);
