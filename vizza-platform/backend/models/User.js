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
  // favoriteVisas -> tableau parce que plusieurs favoris possible
  // string suffit car pas besoin de populate ici 
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
// fonction classique pour avoir accés à this (user document)
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();  // si on modifie autre chose que le password pas besoin de hashage
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);  // ajoute le sel au password puis hash 1024 fois (2^10)
    next();  // passe au middleware suivant
  } catch (error) {
    next(error);
  }
});

// Méthode pour vérifier le mot de passe
// .compare va decomposer le hash du password en bdd et le comparer avec celui donné une fois hashé exactement de la meme façon
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Méthode pour ajouter aux favoris
userSchema.methods.addToFavorites = function(originCountry, destinationCountry) {
  // Vérifier si la combinaison de pays est déjà dans les favoris
  // some() test chaque element et s'arrete si/lorsque une combinaison retourne true
  const exists = this.favoriteVisas.some(fav =>  // fav est un parametre qui represente chaque element de this.favoriteVisas
    fav.originCountry === originCountry && fav.destinationCountry === destinationCountry
  );
  
  if (!exists) {
    this.favoriteVisas.push({ originCountry, destinationCountry });
  }
  
  return this.save();
};

// Méthode pour retirer des favoris
// filter() -> si retourne true, supprime l'element
userSchema.methods.removeFromFavorites = function(originCountry, destinationCountry) {
  this.favoriteVisas = this.favoriteVisas.filter(fav => 
    !(fav.originCountry === originCountry && fav.destinationCountry === destinationCountry)
  );
  
  return this.save();
};

// Index pour optimiser les recherches
// userSchema.index({ email: 1 }); <- unique: true crée deja l'index

module.exports = mongoose.model('User', userSchema);
