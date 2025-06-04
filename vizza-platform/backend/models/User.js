const mongoose = require('mongoose');  // on recupere mongoose pour créer le schema
const bcrypt = require('bcrypt');  // bcrypt sert a hasher le password

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,  // crée un index automatiquement
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  // Favoris
  favoriteVisas: [{
    originCountry: {
      type: String,
      required: true,
      uppercase: true
    },
    destinationCountry: {
      type: String,
      required: true,
      uppercase: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Préférences utilisateur
  defaultOriginCountry: {
    type: String,
    uppercase: true,
    default: null
  },
  language: {
    type: String,
    enum: ['fr', 'en'],
    default: 'fr'
  }
}, {
  timestamps: true
});

// Hash du mot de passe avant sauvegarde
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Méthode pour vérifier le mot de passe
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Méthode pour ajouter aux favoris
userSchema.methods.addToFavorites = function(originCountry, destinationCountry) {
  // Vérifier si déjà dans les favoris
  const exists = this.favoriteVisas.some(fav => 
    fav.originCountry === originCountry && fav.destinationCountry === destinationCountry
  );
  
  if (!exists) {
    this.favoriteVisas.push({ originCountry, destinationCountry });
  }
  
  return this.save();
};

// Méthode pour retirer des favoris
userSchema.methods.removeFromFavorites = function(originCountry, destinationCountry) {
  this.favoriteVisas = this.favoriteVisas.filter(fav => 
    !(fav.originCountry === originCountry && fav.destinationCountry === destinationCountry)
  );
  
  return this.save();
};

// Index pour optimiser les recherches
userSchema.index({ email: 1 });

module.exports = mongoose.model('User', userSchema);
