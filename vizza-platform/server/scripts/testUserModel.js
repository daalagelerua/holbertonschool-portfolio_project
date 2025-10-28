const mongoose = require('mongoose');
require('dotenv').config();

// Import du modèle User
const User = require('../models/User');

const testUserModel = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connecté à MongoDB pour les tests User');

    await User.deleteMany({ email: { $regex: /^test_.*@example\.com$/ } });
    console.log(' Utilisateurs de test supprimés');

    console.log('\n TEST 1: Création d\'utilisateurs valides');

    const validUsers = [
      {
        email: 'test_jean@example.com',
        password: 'motdepasse123',
        firstName: 'Jean',
        lastName: 'Dupont',
        defaultOriginCountry: 'FR',
        language: 'fr'
      },
      {
        email: 'test_marie@example.com',
        password: 'password456',
        firstName: 'Marie',
        lastName: 'Martin',
        defaultOriginCountry: 'US',
        language: 'en'
      },
      {
        email: 'test_pierre@example.com',
        password: 'secure789',
        firstName: ' Pierre ',  // Test trim
        lastName: ' Bernard ',  // Test trim
        // Pas de defaultOriginCountry (optionnel)
        // language prendra la valeur par défaut 'fr'
      }
    ];

    const createdUsers = [];
    for (const userData of validUsers) {
      const user = new User(userData);
      const savedUser = await user.save();
      createdUsers.push(savedUser);
      
      console.log(` Utilisateur créé: ${savedUser.firstName} ${savedUser.lastName}`);
      console.log(`   Email: ${savedUser.email}`);
      console.log(`   Password hashé: ${savedUser.password.substring(0, 20)}...`);
      console.log(`   Langue: ${savedUser.language}`);
      console.log(`   Pays par défaut: ${savedUser.defaultOriginCountry || 'Non défini'}`);
      console.log(`   Créé le: ${savedUser.createdAt}`);
    }

    console.log('\nTEST 2: Validation des données invalides');

    const invalidTests = [
      {
        name: 'Email manquant',
        data: { password: 'test123', firstName: 'Test', lastName: 'User' }
      },
      {
        name: 'Email invalide (pas de @)',
        data: { email: 'invalid-email', password: 'test123', firstName: 'Test', lastName: 'User' }
      },
      {
        name: 'Email invalide (pas d\'extension)',
        data: { email: 'test@domain', password: 'test123', firstName: 'Test', lastName: 'User' }
      },
      {
        name: 'Mot de passe trop court',
        data: { email: 'test_short@example.com', password: '123', firstName: 'Test', lastName: 'User' }
      },
      {
        name: 'Prénom manquant',
        data: { email: 'test_noname@example.com', password: 'test123', lastName: 'User' }
      },
      {
        name: 'Langue invalide',
        data: { email: 'test_lang@example.com', password: 'test123', firstName: 'Test', lastName: 'User', language: 'es' }
      }
    ];

    for (const test of invalidTests) {
      try {
        const invalidUser = new User(test.data);
        await invalidUser.save();
        console.log(`  PROBLÈME: ${test.name} - devrait être rejeté !`);
      } catch (error) {
        console.log(` ${test.name} - correctement rejeté:`);
        console.log(`   Erreur: ${error.message.split(',')[0]}`);
      }
    }

    console.log('\nTEST 3: Contrainte unique sur email');

    try {
      const duplicateUser = new User({
        email: 'test_jean@example.com',  // Email déjà utilisé
        password: 'autremotdepasse',
        firstName: 'Jean',
        lastName: 'Autre'
      });
      await duplicateUser.save();
      console.log('  PROBLÈME: Email dupliqué accepté !');
    } catch (error) {
      console.log(' Email dupliqué correctement rejeté:');
      console.log(`   Erreur: Duplicate key error`);
    }

    console.log('\n TEST 4: Hashing automatique des mots de passe');

    const testUser = await User.findOne({ email: 'test_jean@example.com' });
    const originalPassword = 'motdepasse123';
    
    console.log(` Mot de passe original: "${originalPassword}"`);
    console.log(` Mot de passe hashé: "${testUser.password}"`);
    console.log(` Commence par $2b (bcrypt): ${testUser.password.startsWith('$2b')}`);
    console.log(` Longueur du hash: ${testUser.password.length} caractères`);
    
    // Vérifier que le mot de passe n'est PAS stocké en clair
    const isNotPlainText = testUser.password !== originalPassword;
    console.log(`Pas stocké en clair: ${isNotPlainText}`);

    console.log('\nTEST 5: Méthode comparePassword()');

    // Test avec le bon mot de passe
    const correctPassword = await testUser.comparePassword('motdepasse123');
    console.log(`Bon mot de passe: ${correctPassword}`);

    // Test avec un mauvais mot de passe
    const wrongPassword = await testUser.comparePassword('mauvais');
    console.log(`Mauvais mot de passe: ${wrongPassword}`);

    // Test avec un mot de passe proche (sensibilité à la casse)
    const casePassword = await testUser.comparePassword('MOTDEPASSE123');
    console.log(`Casse différente: ${casePassword}`);

    console.log('\nTEST 6: Conversions automatiques');

    const conversionUser = new User({
      email: '  TEST_CONVERSION@EXAMPLE.COM  ',  // Espaces + majuscules
      password: 'test123',
      firstName: '  Marc  ',                     // Espaces
      lastName: '  Dubois  ',                    // Espaces
      defaultOriginCountry: 'gb'                 // Minuscules
    });

    await conversionUser.save();
    
    console.log(` Email converti: "${conversionUser.email}" (lowercase + trim)`);
    console.log(` Prénom converti: "${conversionUser.firstName}" (trim)`);
    console.log(` Nom converti: "${conversionUser.lastName}" (trim)`);
    console.log(` Pays converti: "${conversionUser.defaultOriginCountry}" (uppercase)`);

    console.log('\nTEST 7: Gestion des favoris - addToFavorites()');

    const userForFavorites = await User.findOne({ email: 'test_marie@example.com' });
    console.log(`Utilisateur: ${userForFavorites.firstName} ${userForFavorites.lastName}`);
    console.log(`Favoris initiaux: ${userForFavorites.favoriteVisas.length}`);

    // Ajouter des favoris
    await userForFavorites.addToFavorites('FR', 'JP');
    console.log('Ajouté: FR → JP');

    await userForFavorites.addToFavorites('US', 'IT');
    console.log('Ajouté: US → IT');

    await userForFavorites.addToFavorites('DE', 'ES');
    console.log('Ajouté: DE → ES');

    // Recharger depuis la DB pour voir les favoris
    const updatedUser = await User.findById(userForFavorites._id);
    console.log(`Favoris après ajouts: ${updatedUser.favoriteVisas.length}`);
    
    updatedUser.favoriteVisas.forEach((fav, index) => {
      console.log(`   ${index + 1}. ${fav.originCountry} → ${fav.destinationCountry} (ajouté le ${fav.addedAt.toLocaleDateString()})`);
    });

    // Tenter d'ajouter un doublon
    console.log('\nTest ajout doublon:');
    const beforeDuplicate = updatedUser.favoriteVisas.length;
    await updatedUser.addToFavorites('FR', 'JP');  // Déjà existant
    const afterDuplicate = (await User.findById(updatedUser._id)).favoriteVisas.length;
    
    console.log(`Avant doublon: ${beforeDuplicate}, Après doublon: ${afterDuplicate}`);
    console.log(`Doublon évité: ${beforeDuplicate === afterDuplicate}`);

    console.log('\nTEST 8: Gestion des favoris - removeFromFavorites()');

    const userForRemoval = await User.findById(updatedUser._id);
    console.log(`Favoris avant suppression: ${userForRemoval.favoriteVisas.length}`);

    // Supprimer un favori existant
    await userForRemoval.removeFromFavorites('US', 'IT');
    console.log('Supprimé: US → IT');

    // Vérifier la suppression
    const afterRemoval = await User.findById(userForRemoval._id);
    console.log(` Favoris après suppression: ${afterRemoval.favoriteVisas.length}`);
    
    afterRemoval.favoriteVisas.forEach((fav, index) => {
      console.log(`   ${index + 1}. ${fav.originCountry} → ${fav.destinationCountry}`);
    });

    // Tenter de supprimer un favori inexistant
    const beforeNonExistent = afterRemoval.favoriteVisas.length;
    await afterRemoval.removeFromFavorites('XX', 'YY');  // N'existe pas
    const afterNonExistent = (await User.findById(afterRemoval._id)).favoriteVisas.length;
    
    console.log(` Suppression inexistant: ${beforeNonExistent} → ${afterNonExistent} (pas de changement)`);

    console.log('\n TEST 9: Modification de mot de passe');

    const userForPasswordChange = await User.findOne({ email: 'test_pierre@example.com' });
    const oldPasswordHash = userForPasswordChange.password;
    
    console.log(`Ancien hash: ${oldPasswordHash.substring(0, 20)}...`);
    
    // Modifier le mot de passe
    userForPasswordChange.password = 'nouveaumotdepasse';
    await userForPasswordChange.save();
    
    const newPasswordHash = userForPasswordChange.password;
    console.log(`Nouveau hash: ${newPasswordHash.substring(0, 20)}...`);
    
    const hashChanged = oldPasswordHash !== newPasswordHash;
    console.log(`Hash changé: ${hashChanged}`);
    
    // Vérifier que l'ancien mot de passe ne marche plus
    const oldPasswordWorks = await userForPasswordChange.comparePassword('secure789');
    const newPasswordWorks = await userForPasswordChange.comparePassword('nouveaumotdepasse');
    
    console.log(`Ancien mot de passe: ${oldPasswordWorks}`);
    console.log(`Nouveau mot de passe: ${newPasswordWorks}`);

    console.log('\nTEST 10: Timestamps automatiques');

    const timestampUser = await User.findOne({ email: 'test_jean@example.com' });
    console.log(` createdAt: ${timestampUser.createdAt}`);
    console.log(` updatedAt: ${timestampUser.updatedAt}`);
    
    const originalUpdatedAt = timestampUser.updatedAt;
    
    // Attendre 1 seconde puis modifier
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    timestampUser.firstName = 'Jean-Baptiste';
    await timestampUser.save();
    
    const newUpdatedAt = timestampUser.updatedAt;
    console.log(` Nouveau updatedAt: ${newUpdatedAt}`);
    
    const timestampUpdated = newUpdatedAt > originalUpdatedAt;
    console.log(` Timestamp mis à jour: ${timestampUpdated}`);

    console.log('\nSTATISTIQUES FINALES:');

    const totalUsers = await User.countDocuments();
    const frenchUsers = await User.countDocuments({ language: 'fr' });
    const usersWithFavorites = await User.countDocuments({ 'favoriteVisas.0': { $exists: true } });
    const usersWithDefaultCountry = await User.countDocuments({ defaultOriginCountry: { $ne: null } });

    console.log(`   - Total utilisateurs: ${totalUsers}`);
    console.log(`   - Utilisateurs français: ${frenchUsers}`);
    console.log(`   - Utilisateurs avec favoris: ${usersWithFavorites}`);
    console.log(`   - Utilisateurs avec pays par défaut: ${usersWithDefaultCountry}`);

    console.log('\n Nettoyage des données de test');
    const deletedCount = await User.deleteMany({ email: { $regex: /^test_.*@example\.com$/ } });
    console.log(` ${deletedCount.deletedCount} utilisateurs de test supprimés`);

    console.log('\n Tests User terminés avec succès !');

  } catch (error) {
    console.error(' Erreur pendant les tests:', error);
  } finally {
    await mongoose.connection.close();
    console.log(' Connexion MongoDB fermée');
    process.exit(0);
  }
};

testUserModel();
