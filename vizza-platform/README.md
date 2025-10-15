# Vizza - Visa Requirements Platform

[![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-v4.18+-blue.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-v5.0+-brightgreen.svg)](https://www.mongodb.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> 🛂 **Vizza** is a modern web application that helps travelers instantly find visa requirements for their next destination. Built as a full-stack project with Node.js, Express, and MongoDB.

Here is the link to the landing page of the application:
<a href="">https://daalagelerua.github.io/vizza_landing/</a>

## ✨ Features

- **🔍 Smart Search**: Quick visa lookup between any two countries
- **👤 User Authentication**: Secure JWT-based authentication system
- **⭐ Favorites System**: Save and manage your favorite visa routes
- **📱 Responsive Design**: Mobile-first Bootstrap 5 UI
- **🌍 Multi-language Support**: French and English interface
- **📊 Statistics Dashboard**: Real-time visa data statistics
- **🚀 Fast Performance**: Optimized MongoDB queries with proper indexing
- **🐳 Dev Containers**: Ready-to-use development environment
- **☁️ Cloud Deployment**: Deployed on Railway with MongoDB Atlas

## 🏗️ Architecture

```
vizza-platform/
├── .devcontainer/          # VS Code Dev Container configuration
│   ├── Dockerfile          # Development container setup
│   ├── devcontainer.json   # Container settings and extensions
│   └── docker-compose.yml  # Multi-container orchestration
├── server/
│   ├── app.js          # Express configuration
│   ├── server.js       # Entry point
│   ├── config/
│   │   └── database.js # Connexion MongoDB
│   ├── controllers/    # Business logic
│   ├── models/         # Mongoose models
│   ├── routes/         # API endpoints
│   ├── middleware/     # Authentication & validation
│   ├── utils/          # JWT utilities
│   ├── views/          # EJS templates
│   ├── public/         # Static assets
│   └── scripts/        # Database seeding
├── Dockerfile              # Production container
└── README.md
```

## 🛠️ Tech Stack

**Backend:**
- Node.js & Express.js
- MongoDB with Mongoose ODM
- JWT Authentication
- bcrypt for password hashing
- EJS templating engine

**Frontend:**
- Bootstrap 5 for responsive design
- Vanilla JavaScript (ES6+)
- Bootstrap Icons
- Custom CSS with modern animations

**External APIs:**
- RapidAPI Visa Requirements API
- REST Countries API

**Development & Deployment:**

- Docker & Dev Containers
- Railway (hosting)
- MongoDB Atlas (database)

## 🚀 Quick Start

### Option 1: Using Dev Containers (recommended)

#### Prerequisites

- Docker Desktop installed
- VS Code with Dev Containers extension 

#### Steps

1. Clone the repository

   ```bash
   git clone https://github.com/daalagelerua/vizza-platform.git
   cd vizza-platform
   ```

2. Open in VS Code

   ```bash
   code .
   ```

3. When prompted, click "Reopen in container" (or use command palette: `Dev Containers: Reopen in Container`)

4. Create your `.env` file in the root directory

   ```env
   NODE_ENV=development
   PORT=3000
   MONGODB_URI=mongodb://vizza_admin:vizza_dev_password@mongodb:27017/vizza_db?authSource=admin
   TOKEN_SECRET=your-jwt-secret-key-256-bits
   TOKEN_EXPIRE=4h
   RAPIDAPI_KEY=your-rapidapi-key
   RAPIDAPI_HOST=visa-requirement.p.rapidapi.com
   ```

5. The container will automatically:

- Install all dependencies (if not: `npm install`)
- Set up MongoDB
- Configure development tools

6. Seed the database

   ```bash
   node scripts/seedDatabase.js
   ```

7. Start the development server

   ```bash
   npm run dev
   ```

8. Open your browser at http://localhost:3000

- Hot-reload with nodemon
- Pre-configured VS Code extensions (ESLint, Prettier, MongoDB, Docker, GitLens)
- MongoDB running in a separate container
- Persistent data volumes
- Port forwarding automatically configured

### Option 2: Local Installation

#### Prerequisites

- Node.js 18+ installed
- MongoDB 5.0+ running locally or MongoDB Atlas account
- RapidAPI key for visa data

#### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/vizza-platform.git
   cd vizza-platform/server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   NODE_ENV=development
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/vizza
   TOKEN_SECRET=your-jwt-secret-key-256-bits
   TOKEN_EXPIRE=4h
   RAPIDAPI_KEY=your-rapidapi-key
   RAPIDAPI_HOST=visa-requirement.p.rapidapi.com
   ```

4. **Seed the database**
   ```bash
   node scripts/seedDatabase.js
   ```

5. **Start the server**
   ```bash
   npm start
   # or for development
   npm run dev
   ```

6. **Open your browser**
   ```
   http://localhost:3000
   ```

## 📚 API Documentation

### Authentication Endpoints

```http
POST /api/auth/register    # User registration
POST /api/auth/login       # User login  
POST /api/auth/logout      # User logout
GET  /api/auth/profile     # Get user profile
PUT  /api/auth/profile     # Update user profile
```

### Visa Endpoints

```http
GET /api/visas/countries           # Get all countries
GET /api/visas/search?from=FR&to=JP # Search specific visa
GET /api/visas/from/:country       # Get all visas from country
GET /api/visas/stats               # Get visa statistics
```

### Favorites Endpoints (Auth Required)

```http
POST   /api/visas/favorites  # Add to favorites
DELETE /api/visas/favorites  # Remove from favorites  
GET    /api/visas/favorites  # Get user favorites
```

## 🎯 Usage Examples

### Search Visa Requirements

```javascript
// Using the API
const response = await fetch('/api/visas/search?from=FR&to=JP');
const data = await response.json();

console.log(data.visa.requirement.text); // "Visa not required"
```

### User Authentication

```javascript
// Register new user
const userData = {
  firstName: "John",
  lastName: "Doe", 
  email: "john@example.com",
  password: "secure123",
  defaultOriginCountry: "US"
};

const response = await fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(userData)
});
```

## 🧪 Testing

The project includes comprehensive test scripts:

```bash
# Test individual components
npm run test:user      or   node scripts/testUserModel.js
npm run test:country   or   node scripts/testCountryModel.js
npm run test:visa      or   node scripts/testVisaRequirementModel.js
npm run test:auth      or   node scripts/testAuthMiddleware.js

# Test API endpoints
node scripts/debug_visa_api.js
```

## 📊 Data Models

### User Schema
```javascript
{
  email: String (unique),
  password: String (hashed),
  firstName: String,
  lastName: String,
  favoriteVisas: [{ originCountry, destinationCountry, addedAt }],
  defaultOriginCountry: String,
  language: String ('fr' | 'en')
}
```

### Country Schema
```javascript
{
  code: String (ISO 2-letter),
  name: String,
  flag: String (emoji),
  continent: String,
  isActive: Boolean
}
```

### VisaRequirement Schema
```javascript
{
  originCountry: ObjectId,
  destinationCountry: ObjectId,
  requirement: String ('green'|'yellow'|'blue'|'red'),
  requirementText: String,
  maxStay: String,
  cost: String,
  processingTime: String
}
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds
- **CORS Protection**: Configured for production
- **Helmet.js**: Security headers
- **Input Validation**: Mongoose schema validation
- **Rate Limiting**: API endpoint protection

## 🎨 UI/UX Features

- **Responsive Design**: Mobile-first approach
- **Modern Animations**: Smooth transitions and hover effects
- **Dark Theme Support**: Consistent color scheme
- **Accessibility**: ARIA labels and keyboard navigation
- **Loading States**: User feedback during API calls
- **Error Handling**: User-friendly error messages

## 📈 Performance Optimizations

- **Database Indexing**: Optimized MongoDB queries
- **Caching**: Static asset caching
- **CDN Integration**: Bootstrap and icons from CDN
- **Gzip Compression**: Reduced payload size
- **Lazy Loading**: Efficient resource loading

## 🚀 Deployment

### Production Setup

#### Prerequisites:

- Railway account
- MongoDB Atlas account (or Railway MongoDB service)
- RapidAPI account

#### Steps

1. **Prepare MongoDB Atlas**

- Create a cluster on MongoDB Atlas
- Get your connection string
- Whitelist Railway's IP adresses

2. **Deploy to Railway**

   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login to Railway
   railway login
   
   # Initialize project
   railway init
   
   # Link to your Railway project
   railway link
   ```

3. **Set Environment Variables on Railway**
   ```env
   NODE_ENV=production
   PORT=3000
   MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/vizza?retryWrites=true&w=majority
   TOKEN_SECRET=your-production-secret-key-256-bits
   TOKEN_EXPIRE=4h
   RAPIDAPI_KEY=your-rapidapi-key
   RAPIDAPI_HOST=visa-requirement.p.rapidapi.com
   ```

4. **Deploy**
   
   ```bash
   railway up
   ```

5. **Seed Pproduction Database**

   ```bash
   railway run npm run seed
   ```

***Railway automatically***:

- Detects the Dockerfile
- Builds the production image
- Deploys on their infrastructure
- Provides HTTPS endpoint
- Handles auto-scaling

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Development Guidelines

- Use the dev container for consistent environment
- Run tests before committing
- Follow ESLint and Prettier configurations
- Write meaningful commit messages
- Update documentation for new features

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Aurèle Périllat**
- GitHub: [@daalagelerua](https://github.com/daalagelerua)
- Project: [Holberton School Final Project](https://github.com/daalagelerua/holbertonschool-portfolio_project/vizza-platform)

## 🙏 Acknowledgments

- [RapidAPI](https://rapidapi.com/) for visa requirements data
- [REST Countries](https://restcountries.com/) for country information
- [Bootstrap](https://getbootstrap.com/) for responsive design

## 📊 Project Status

- ✅ **MVP Complete**: Core functionality implemented
- ✅ **Authentication**: User registration and login
- ✅ **Visa Search**: Real-time visa lookup
- ✅ **Favorites**: User preference system
- ✅ Dev Containers: Consistent development environment
- ✅ Production Deployment: Live on Railway
- 🔄 **In Progress**: Advanced filtering
- 📋 **Planned**: Mobile app version, Admin dashboard

---

## 📞 Support

For support, open an issue on GitHub.

⭐ **Star this repository if you found it helpful!**
