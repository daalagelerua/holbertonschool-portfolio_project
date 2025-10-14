# Utiliser l'image Node.js officielle
FROM node:20-alpine

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances de production uniquement
RUN npm ci --only=production

# Copier tout le code source
COPY . .

# Exposer le port (Railway détecte automatiquement)
EXPOSE 3000

# Définir les variables d'environnement par défaut
ENV NODE_ENV=production

# Commande de démarrage
CMD ["node", "server/server.js"]
