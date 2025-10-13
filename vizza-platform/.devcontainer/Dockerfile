# Image de base Node.js, bullseye -> image complete (pour developpement, pour prod -> alpine)
FROM node:20-bullseye

# Installer des outils utiles pour le développement
RUN apt-get update && apt-get install -y \
    git \
    curl \
    vim \
    nano \
    && rm -rf /var/lib/apt/lists/*
    # nettoie les fichiers temporaires

# Installer nodemon globalement pour le hot-reload (redemarrage automatique lors des modifs)
RUN npm install -g nodemon

# Installer sudo
RUN apt-get update && apt-get install -y sudo && rm -rf /var/lib/apt/lists/*

# Donner les droits sudo à node
RUN echo "node ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

# Créer le répertoire de travail
WORKDIR /workspace

# Passer à l'utilisateur node
USER node

# Exposer le port de l'application (documentation)
EXPOSE 3000
