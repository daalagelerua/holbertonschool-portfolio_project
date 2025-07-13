# Projet Portfolio
## Étape 4 : Développement MVP

### 0. Planifier et Définir les Sprints

#### Vue d'ensemble des Sprints
**Durée du projet** : 6-7 semaines 
**Durée des sprints** : 1 à 2 semaine chacun
**Membre de l'équipe** : Aurèle Périllat (assumant tous les rôles)

#### Répartition des Sprints

**Sprint 1 (Semaine 1 et 2) : Fondation & Backend Principal**
*Priorité : Must Have*
- **Durée** : 14 jours
- **Focus** : Configuration de la base de données, endpoints API principaux, et architecture backend

**Tâches :**
1. **Configuration de la Base de Données** (Jour 1-4)
   - Installer et configurer MongoDB
   - Créer le schéma de base pour pays, visas et utilisateurs
   - Alimenter avec des données initiales (10 pays, types de visas de base)

2. **Développement API Backend** (Jours 5-12)
   - Mettre en place le serveur Node.js/Express
   - Implémenter l'endpoint `/api/countries`
   - Implémenter l'endpoint `/api/visas` avec fonctionnalité de recherche
   - Implémenter l'endpoint `/api/visas/{id}` pour la vue détaillée

3. **Tests API & Documentation** (Jour 12-14)
   - Tester tous les endpoints avec Postman
   - Créer la documentation API
   - Gérer les cas d'erreur et la validation

**Critères d'Achèvement Sprint 1 :**
- Base de données opérationnelle avec données d'exemple
- Tous les endpoints API principaux répondent correctement
- Les tests Postman passent pour tous les endpoints
- Documentation API complète

---

**Sprint 2 (Semaine 3 et 4) : Frontend Principal & Intégration**
*Priorité : Must Have*
- **Durée** : 14 jours
- **Focus** : Développement interface utilisateur et intégration API

**Tâches :**
1. **Configuration Frontend** (Jour 1-4)
   - Créer la structure HTML pour la page principale
   - Configurer le framework CSS (Bootstrap)
   - Créer un layout responsive

2. **Interface de Recherche** (Jours 5-9)
   - Implémenter les menus déroulants de sélection des pays
   - Créer le formulaire de recherche avec validation
   - Intégrer avec l'API backend
   - Afficher les résultats de recherche sous forme de cartes

3. **Page Détails du Visa** (Jours 10-14)
   - Créer la vue détaillée du visa
   - Implémenter la navigation entre recherche et détails
   - Ajouter le design responsive pour mobile

**Critères d'Achèvement Sprint 2 :**
- Les utilisateurs peuvent rechercher des visas entre pays
- Les résultats de visa s'affichent correctement
- Les utilisateurs peuvent voir les informations détaillées du visa
- L'interface est responsive sur mobile et desktop

---

**Sprint 3 (Semaine 5) : Fonctionnalités Améliorées & Support Multilingue**
*Priorité : Should Have*
- **Durée** : 5 jours
- **Focus** : Filtrage, support multilingue, et améliorations UX

**Tâches :**
1. **Système de Filtrage** (Jours 1-2)
   - Implémenter les filtres par type de visa (tourisme, travail, études)
   - Ajouter le filtre par durée de traitement
   - Mettre à jour l'API pour supporter les paramètres de filtrage

2. **Support Multilingue** (Jours 3-4)
   - Implémenter le basculement français/anglais
   - Créer les fichiers de traduction
   - Mettre à jour l'UI pour supporter le changement de langue

3. **Améliorations Expérience Utilisateur** (Jour 5)
   - Ajouter des indicateurs de chargement
   - Implémenter la gestion d'erreurs et feedback utilisateur
   - Optimiser les performances

**Critères d'Achèvement Sprint 3 :**
- Les utilisateurs peuvent filtrer les résultats par type et critères
- L'interface supporte le français et l'anglais
- États de chargement et messages d'erreur implémentés
- Performance répond aux standards acceptables

---

**Sprint 4 (Semaine 6) : Comptes Utilisateurs & Finition**
*Priorité : Could Have + QA Final*
- **Durée** : 5 jours
- **Focus** : Authentification utilisateur, favoris, et tests finaux

**Tâches :**
1. **Authentification Utilisateur** (Jours 1-2)
   - Implémenter inscription et connexion utilisateur
   - Créer la gestion de profil utilisateur
   - Ajouter la gestion des tokens JWT

2. **Système de Favoris** (Jours 3-4)
   - Permettre aux utilisateurs de sauvegarder leurs visas favoris
   - Implémenter la gestion des favoris
   - Créer le tableau de bord utilisateur

3. **QA Final & Déploiement** (Jour 5)
   - Tests end-to-end complets
   - Corrections de bugs et optimisation performance
   - Préparation du déploiement

**Critères d'Achèvement Sprint 4 :**
- Les utilisateurs peuvent créer des comptes et se connecter
- Le système de favoris est fonctionnel
- Tous les bugs critiques sont résolus
- L'application est prête pour le déploiement

---

### 1. Exécuter les Tâches de Développement

#### Standards de Développement

**Standards de Code :**
- Utiliser la syntaxe JavaScript ES6+
- Suivre les conventions API RESTful
- Implémenter une gestion d'erreurs appropriée
- Utiliser des noms de variables et fonctions explicites
- Ajouter des commentaires pour la logique complexe

**Workflow Git :**
- Commits fréquents avec messages descriptifs
- Utiliser le format de commit conventionnel : `feat: ajouter fonctionnalité recherche visa`
- Auto-révision pour projet solo

**Exigences de Documentation :**
- Mettre à jour la documentation API pour chaque endpoint
- Documenter tout changement de configuration
- Créer un guide utilisateur pour les fonctionnalités clés
- Maintenir un changelog pour chaque sprint

#### Routine de Développement Quotidienne

**Stand-up Quotidien (Auto-réflexion) :**
- Qu'ai-je terminé hier ?
- Sur quoi vais-je travailler aujourd'hui ?
- Quels obstacles ai-je ?
- Y a-t-il des risques pour l'objectif du sprint ?

**Révision de Fin de Journée :**
- Mettre à jour le statut des tâches dans l'outil de gestion
- Committer les changements de code
- Documenter les problèmes ou apprentissages
- Planifier les priorités du lendemain

---

### 2. Surveiller les Progrès et Ajuster

#### Outils de Suivi des Progrès

**Gestion de Projet :**
- Utiliser GitHub pour le suivi des tâches
- Créer des tableaux pour : Backlog, En cours, Tests, Terminé
- Mettre à jour le statut quotidiennement
- Ajouter estimations de temps et temps réel passé

**Métriques Clés à Suivre :**
- **Vélocité du Sprint** : Tâches complétées par sprint
- **Points d'Histoire** : Effort estimé vs. réel
- **Nombre de Bugs** : Bugs trouvés et résolus
- **Qualité du Code** : Retours de révision de code
- **Couverture de Tests** : Pourcentage de code couvert par les tests

#### Gestion des Risques

**Risques Identifiés & Atténuation :**
1. **Courbe d'Apprentissage Node.js**
   - *Atténuation* : Dédier les 2 premiers jours aux tutoriels Node.js
   - *Contingence* : Simplifier le backend si nécessaire

2. **Problèmes d'Intégration API**
   - *Atténuation* : Tester les endpoints API tôt avec Postman
   - *Contingence* : Utiliser des données simulées si les APIs externes échouent

3. **Gestion du Temps**
   - *Atténuation* : Révisions quotidiennes et priorisation des tâches
   - *Contingence* : Reporter les fonctionnalités "Could Have" aux versions futures

4. **Complexité de la Base de Données**
   - *Atténuation* : Commencer avec un schéma simple, itérer selon les besoins
   - *Contingence* : Utiliser des fichiers JSON si MongoDB s'avère trop complexe

---

### 3. Mener des Révisions de Sprint et Rétrospectives

#### Format de Révision de Sprint

**À la fin de chaque sprint :**
1. **Démonstration des Fonctionnalités Terminées** (30 minutes)
   - Montrer les fonctionnalités opérationnelles
   - Documenter les écarts par rapport au plan
   - Recueillir les commentaires (auto-évaluation)

2. **Révision des Métriques du Sprint** (15 minutes)
   - Réviser la vélocité et le taux de completion
   - Analyser les estimations vs. temps réel
   - Identifier les patterns de productivité

#### Questions de Rétrospective

**Ce qui a Bien Fonctionné :**
- Quelles tâches ont été terminées plus rapidement que prévu ?
- Quels outils ou techniques ont aidé la productivité ?
- Quelles connaissances ont été acquises ?

**Ce qui n'a Pas Bien Fonctionné :**
- Quelles tâches ont pris plus de temps que prévu ?
- Quels obstacles ont été rencontrés ?
- Qu'est-ce qui a causé des retards ou frustrations ?

**Ce qu'il Faut Améliorer :**
- Comment améliorer l'estimation des tâches ?
- Quels processus peuvent être optimisés ?
- Quelles compétences nécessitent plus de développement ?

**Actions à Entreprendre :**
- Changements spécifiques à implémenter au prochain sprint
- Ressources nécessaires pour l'amélioration
- Calendrier pour implémenter les changements

---

### 4. Intégration Finale et Tests QA

#### Stratégie de Tests d'Intégration

**Tests d'Intégration Backend :**
- Tester les endpoints API avec diverses combinaisons d'entrées
- Vérifier les opérations de base de données sous différentes conditions
- Tester la gestion d'erreurs et cas limites
- Valider la cohérence des données

**Tests d'Intégration Frontend :**
- Tester les workflows utilisateur de bout en bout
- Vérifier l'intégration API avec l'UI
- Tester le design responsive sur différents appareils
- Valider les soumissions de formulaires et états d'erreur

#### Liste de Contrôle Tests QA

**Tests Fonctionnels :**
- [x] L'utilisateur peut sélectionner pays d'origine et destination
- [x] La recherche de visa retourne des résultats précis
- [ ] La page détails du visa affiche les informations complètes
- [ ] Les filtres fonctionnent correctement
- [ ] Le changement de langue fonctionne correctement
- [x] L'inscription et connexion utilisateur fonctionnent
- [x] Le système de favoris fonctionne correctement

**Tests Non-Fonctionnels :**
- [x] Temps de chargement des pages sous 3 secondes
- [x] Design responsive mobile fonctionne sur appareils courants
- [x] Compatibilité navigateur (Chrome, Firefox, Safari)
- [x] Messages d'erreur sont conviviaux
- [x] Navigation est intuitive

**Tests de Sécurité :**
- [x] Mots de passe utilisateur sont correctement hachés
- [x] Endpoints API nécessitent authentification appropriée
- [x] Validation d'entrée prévient les attaques par injection
- [ ] Gestion de session est sécurisée

#### Liste de Contrôle Déploiement Final

**Pré-déploiement :**
- [x] Tous les tests passent
- [x] Base de données correctement configurée
- [x] Variables d'environnement définies
- [x] Logging d'erreurs implémenté
- [ ] Optimisation performance terminée

**Post-déploiement :**
- [ ] Application accessible via URL
- [ ] Toutes les fonctionnalités marchent en environnement de production
- [ ] Connexions base de données sont stables
- [ ] Monitoring et logging sont actifs
- [ ] Stratégie de sauvegarde en place

---

### Critères de Réussite

**Métriques de Réussite MVP :**
- Toutes les user stories "Must Have" sont implémentées
- Application est responsive sur mobile et desktop
- Fonctionnalité de recherche retourne des résultats précis
- Qualité du code répond aux standards établis
- Application est déployée et accessible

**Seuils de Qualité :**
- 90% des fonctionnalités planifiées sont terminées
- Tous les bugs critiques sont résolus
- Performance répond aux standards acceptables
- Expérience utilisateur est intuitive et fluide
- Documentation est complète et précise
