## Portfolio Project
## Stage 2 - Project Charter Development

### <ins>0. Define Project Objectives</ins> 
(using 2/3 objectives from 'SMART' Specific, Measurable, Achievable, Relevant, and Time-bound)

- ***Objectif principal*** :

Développer une plateforme web fonctionnelle qui simplifie la recherche et la visualisation des informations sur les visas entre différents pays, permettant aux utilisateurs de trouver facilement les types de visas disponibles et leurs conditions d'obtention.

- ***Spécifique***:

    Créer une application web qui permet aux utilisateurs de :

    * Sélectionner leur pays d'origine via une interface intuitive
    * Choisir leur pays de destination
    * Visualiser tous les types de visas disponibles entre ces deux pays
    * Consulter les conditions détaillées d'obtention pour chaque visa
    * Naviguer dans une interface responsive adaptée aux mobiles et ordinateurs

- ***Mesurable***:

    L'application doit inclure au minimum :

    * 5 pays d'origine et 5 pays de destination
    * 3-5 types de visas différents par combinaison de pays
    * Une interface utilisateur fonctionnelle
    * Support pour au moins 2 langues (français et anglais)

- ***Relevant***:

    Le projet répond à un besoin réel des voyageurs internationaux qui font face à :

    * Des informations fragmentées sur différents sites gouvernementaux
    * Des interfaces souvent peu intuitives et dans des langues étrangères
    * Des difficultés à comprendre rapidement les conditions d'éligibilité
    * L'absence de plateforme centralisée et multilingue

### <ins>1. Identify Stakeholders and Team Roles</ins>

- ***Internal Stakeholders***:

    - Aurèle Périllat : Concepteur, développeur et gestionnaire principal du projet
    - Formateurs d'Holberton school : Evaluateur du projet

- ***External Stakeholders***:

    - Voyageurs/Etudiants/Professionnels internationnaux : Utilisateurs potentiels
    - Administrations des services d'immigrations : Fournisseurs d'informations officielles sur les visas

- ***Rôles dans le projet***: (assumés par Aurèle Périllat)

    - **Chef de projet** : Définition des objectifs et du périmetre, suivi de l'avancement
    - **Développeur backend** : Implementation de l'API avec Node.js/Express, gestion de la base de données avec MongoDB, Développement de la logique métier
    - **Développeur frontend** : Création des interfaces utilisateur avec HTML/CSS/JavaScript, implementation du responsive design
    - **Testeur** : Elaboration des tests, execution des tests, identification et suivi des bugs
    - **Responsable du deploiement**: configuration de l'environnement de production, déploiement de l'application


### <ins>2. Define Scope</ins>

#### Périmètre du projet (In-Scope) :

- ***Interface de recherche***:

    - Sélection du pays d'origine via un menu déroulant
    - Sélection du pays de destination via un menu déroulant
    - Bouton de recherche pour lancer la requête


- ***Affichage des résultats***:

    - Liste complète des visas disponibles entre les deux pays sélectionnés
    - Présentation des différents types de visas (tourisme, affaires, études, travail)
    - Filtres simples pour affiner les résultats par durée ou par type de voyage


- ***Détails des visas***:

    - Conditions d'éligibilité pour chaque type de visa
    - Documents requis
    - Durée de validité
    - Frais approximatifs


- ***Fonctionnalités techniques***:

    - Interface responsive adaptée aux mobiles et ordinateurs
    - Support multilingue (français et anglais)
    - Minimum de 3 types de visas par combinaison de pays


- ***Éléments visuels***:

    - Design simple et professionnel utilisant Bootstrap
    - Map monde pour une identification rapide
    - Icônes représentant les différents types de visas

#### Hors périmètre du projet (Out-of-Scope) :

- ***Processus de demande de visa***:

    - Le système n'inclura pas la possibilité de soumettre une demande de visa
    - Aucun formulaire de demande ne sera implémenté dans cette version
    - Les utilisateurs ne pourront pas télécharger ou remplir des documents officiels


- ***Authentification et comptes utilisateurs***:

    - Pas de fonctionnalité de sauvegarde des recherches ou des profils
    - Pas d'espace personnel pour suivre les demandes


- ***Paiement***:

    - Aucun système de paiement pour les frais de visa


- ***Couverture géographique complète***:

    - Le système ne couvrira pas tous les pays du monde


### <ins>3. Identify Risks</ins>

- ***Risques***:

    - Difficulté d'apprentissage de node.js
    - Problème d'integration front-end/back-end
    - Complexité et difference de la structure de données des visas pour differents pays
    - Difficultés à obtenir des informations précises sur les visas
    - obsolescence des données

- ***Atténuation***:

    - 3/4 jours d'entrainement exclusif sur node.js
    - Tester l'API avec Postman avant de l'integrer au front-end
    - Analyse détaillée des données sur les visas pour un nombre limités de pays
    - Prévoir des champs pour gerer les exceptions
    - Se limiter à des pays dont l'accés aux données est facile
    - structurer la base de données pour faciliter les mises à jour

### <ins>4. Develop a High-Level Plan</ins>