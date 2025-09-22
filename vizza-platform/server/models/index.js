const Country = require('./Country');
const VisaRequirement = require('./VisaRequirement');
const User = require('./User');

// index.js est un fichier d'agregation qui simplifie l'importation des modeles
// lorsqu'on fait require('../models'), node.js voit que c'est un dossier et va donc
// chercher automatiquement index.js qui exportera tous les modeles, ce qui permet egalement la destructuration
module.exports = {
  Country,
  VisaRequirement,
  User
};
