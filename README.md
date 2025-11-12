# SpaceGuide AI Frontend

Modern AI Business Portal Frontend built with React, Vite, and Tailwind CSS.

## 🚀 Quick Start

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 🐳 Docker Deployment

### Quick Start

```bash
# Build Docker image
docker build \
  --build-arg VITE_API_URL=https://api.yourdomain.com/api \
  --build-arg VITE_STRIPE_PUBLISHABLE_KEY=pk_live_... \
  -t spaceguide-ai-frontend:latest .

# Run container
docker run -d -p 3000:80 --name spaceguide-ai-frontend spaceguide-ai-frontend:latest
```

### Using Docker Compose

```bash
# Create .env file with your variables
cp env.example .env

# Edit .env with your production values
# Then run:
docker-compose up -d
```

See [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md) for detailed deployment instructions.

## 📋 Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_URL=https://api.yourdomain.com/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_key_here
VITE_APP_NAME=SpaceGuideAI
VITE_APP_VERSION=1.0.0
```

## 🛠️ Tech Stack

- **React 18** - UI Library
- **Vite** - Build Tool
- **Tailwind CSS** - Styling
- **React Router** - Routing
- **Zustand** - State Management
- **Axios** - HTTP Client
- **Socket.IO** - Real-time Communication
- **Stripe** - Payment Processing
- **Recharts** - Data Visualization

## 📁 Project Structure

```
src/
├── components/     # Reusable components
├── pages/         # Page components
├── services/      # API services
├── store/         # State management
├── hooks/         # Custom hooks
├── utils/         # Utility functions
├── constants/     # Constants and config
└── config/        # Configuration files
```

## ✅ Production Readiness

✅ **Production Ready** - See [PRODUCTION_READINESS_REPORT.md](./PRODUCTION_READINESS_REPORT.md) for details.

- ✅ Optimized build configuration
- ✅ Environment variable support
- ✅ Security best practices
- ✅ Error handling
- ✅ Performance optimizations
- ✅ Docker support

## 📚 Documentation

- [Production Readiness Report](./PRODUCTION_READINESS_REPORT.md)
- [Docker Deployment Guide](./DOCKER_DEPLOYMENT.md)

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run docker:build` - Build Docker image
- `npm run docker:run` - Run Docker container
- `npm run docker:compose:up` - Start with Docker Compose
- `npm run docker:compose:down` - Stop Docker Compose

## 📝 License

Proprietary - All rights reserved
