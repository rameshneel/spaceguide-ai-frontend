# 🚀 Deployment Guide

## 📋 Prerequisites

- Docker & Docker Compose installed
- Git installed
- SSH access to deployment server (for CI/CD)

## 🏗️ Project Structure

```
spaceguide-ai-frontend/
├── .github/workflows/     # CI/CD pipelines
├── docker-compose.yml     # Base configuration
├── docker-compose.dev.yml # Development overrides
├── docker-compose.staging.yml # Staging overrides
├── docker-compose.prod.yml # Production overrides
├── .env.dev.example
├── .env.staging.example
└── .env.prod.example
```

## 🔧 Local Development Setup

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/spaceguide-ai-frontend.git
cd spaceguide-ai-frontend
```

### 2. Setup Environment Files

```bash
cp .env.dev.example .env.dev
# Edit .env.dev with your values
```

### 3. Start Development Environment

```bash
# From root directory
docker-compose -p spaceguide-frontend-dev -f docker-compose.yml -f docker-compose.dev.yml up -d
```

### 4. Check Status

```bash
docker-compose -p spaceguide-frontend-dev ps
```

### 5. View Logs

```bash
docker-compose -p spaceguide-frontend-dev logs -f
```

## 🎭 Staging Setup (Customer/Client Testing)

### 1. Setup Environment Files

```bash
cp .env.staging.example .env.staging
# Edit .env.staging with staging values
```

### 2. Start Staging Environment

```bash
docker-compose -p spaceguide-frontend-staging -f docker-compose.yml -f docker-compose.staging.yml up -d
```

### 3. Check Status

```bash
docker-compose -p spaceguide-frontend-staging ps
```

## 🏭 Production Setup

### 1. Setup Environment Files

```bash
cp .env.prod.example .env.prod
# Edit .env.prod with production values
```

### 2. Start Production Environment

```bash
docker-compose -p spaceguide-frontend-prod -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### 3. Check Status

```bash
docker-compose -p spaceguide-frontend-prod ps
```

## 🔄 Port Mapping

| Environment | Port | Backend Port (Default) |
| ----------- | ---- | ---------------------- |
| Dev         | 3000 | 5003                   |
| Staging     | 3002 | 5002                   |
| Prod        | 3001 | 5001                   |

## 🤖 GitHub Actions CI/CD

### Setup Secrets

Go to GitHub Repository → Settings → Secrets and variables → Actions

Add these secrets:

#### Development:

- `DEV_HOST` - Development server IP/hostname
- `DEV_USER` - SSH username
- `DEV_SSH_KEY` - SSH private key
- `DEV_SSH_PORT` - SSH port (optional, default: 22)
- `DEV_DEPLOY_PATH` - Deployment path (optional, default: /opt/spaceguide-ai-frontend)
- `DEV_VITE_API_URL` - Backend API URL for dev
- `DEV_VITE_STRIPE_PUBLISHABLE_KEY` - Stripe key for dev

#### Staging:

- `STAGING_HOST` - Staging server IP/hostname (can be same as DEV_HOST)
- `STAGING_USER` - SSH username
- `STAGING_SSH_KEY` - SSH private key
- `STAGING_SSH_PORT` - SSH port (optional, default: 22)
- `STAGING_DEPLOY_PATH` - Deployment path (optional, default: /opt/spaceguide-ai-frontend)
- `STAGING_VITE_API_URL` - Backend API URL for staging
- `STAGING_VITE_STRIPE_PUBLISHABLE_KEY` - Stripe key for staging

#### Production:

- `PROD_HOST` - Production server IP/hostname
- `PROD_USER` - SSH username
- `PROD_SSH_KEY` - SSH private key
- `PROD_SSH_PORT` - SSH port (optional, default: 22)
- `PROD_DEPLOY_PATH` - Deployment path (optional, default: /opt/spaceguide-ai-frontend)
- `PROD_VITE_API_URL` - Backend API URL for production
- `PROD_VITE_STRIPE_PUBLISHABLE_KEY` - Stripe key for production

### Workflows

#### 1. CI (Continuous Integration)

- **Trigger**: Pull requests to `main` or `develop`
- **Actions**: Run tests, build Docker images

#### 2. Deploy to Development

- **Trigger**: Push to `develop` branch
- **Actions**: Auto-deploy to dev server (internal team testing)

#### 3. Deploy to Staging

- **Trigger**: Push to `staging` branch
- **Actions**: Auto-deploy to staging server (customer/client testing)

#### 4. Deploy to Production

- **Trigger**: Manual (workflow_dispatch) or push to `main`
- **Actions**: Deploy to prod server (requires approval)

## 📝 Branch Strategy

```
main      → Production
staging   → Staging (Customer/Client Testing)
develop   → Development (Internal Team Testing)
feature/* → Feature branches
```

### Workflow:

1. **Local Development**: `npm run dev` (Windows)
2. **Create feature branch** from `develop`
3. **Make changes and commit**
4. **Create PR to `develop`**
5. **After merge to `develop`**: Auto-deploy to dev server (internal testing)
6. **When ready for customer testing**: Merge `develop` to `staging`
7. **After merge to `staging`**: Auto-deploy to staging server (customer/client testing)
8. **When customer approves**: Merge `staging` to `main`
9. **After merge to `main`**: Deploy to production

## 🛠️ Common Commands

### Development

```bash
# Start
docker-compose -p spaceguide-frontend-dev -f docker-compose.yml -f docker-compose.dev.yml up -d

# Stop
docker-compose -p spaceguide-frontend-dev down

# Restart
docker-compose -p spaceguide-frontend-dev restart

# Logs
docker-compose -p spaceguide-frontend-dev logs -f frontend

# Rebuild
docker-compose -p spaceguide-frontend-dev -f docker-compose.yml -f docker-compose.dev.yml build --no-cache
```

### Staging

```bash
# Start
docker-compose -p spaceguide-frontend-staging -f docker-compose.yml -f docker-compose.staging.yml up -d

# Stop
docker-compose -p spaceguide-frontend-staging down

# Restart
docker-compose -p spaceguide-frontend-staging restart

# Logs
docker-compose -p spaceguide-frontend-staging logs -f frontend

# Update
git pull origin staging
docker-compose -p spaceguide-frontend-staging -f docker-compose.yml -f docker-compose.staging.yml pull
docker-compose -p spaceguide-frontend-staging -f docker-compose.yml -f docker-compose.staging.yml up -d --build
```

### Production

```bash
# Start
docker-compose -p spaceguide-frontend-prod -f docker-compose.yml -f docker-compose.prod.yml up -d

# Stop
docker-compose -p spaceguide-frontend-prod down

# Restart
docker-compose -p spaceguide-frontend-prod restart

# Logs
docker-compose -p spaceguide-frontend-prod logs -f frontend

# Update
git pull origin main
docker-compose -p spaceguide-frontend-prod -f docker-compose.yml -f docker-compose.prod.yml pull
docker-compose -p spaceguide-frontend-prod -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

## 🔍 Troubleshooting

### Check Service Health

```bash
docker-compose -p spaceguide-frontend-dev ps
```

### View Logs

```bash
docker-compose -p spaceguide-frontend-dev logs --tail=100 frontend
```

### Restart Service

```bash
docker-compose -p spaceguide-frontend-dev restart frontend
```

### Clean Up

```bash
# Remove stopped containers
docker-compose -p spaceguide-frontend-dev down

# Remove volumes (⚠️ deletes data)
docker-compose -p spaceguide-frontend-dev down -v
```

### Health Check

```bash
# Check health endpoint
curl http://localhost:3000/health
# Should return: healthy
```

## 📊 Build Arguments

| Argument                      | Description            | Required | Default                     |
| ----------------------------- | ---------------------- | -------- | --------------------------- |
| `VITE_API_URL`                | Backend API URL        | Yes      | `http://localhost:5000/api` |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | No       | -                           |
| `VITE_APP_NAME`               | Application name       | No       | `SpaceGuideAI`              |
| `VITE_APP_VERSION`            | Application version    | No       | `1.0.0`                     |
| `VITE_ENV`                    | Environment            | No       | `production`                |

## 🔒 Security Best Practices

1. **Use HTTPS in production**

   - Configure SSL/TLS certificates
   - Update nginx.conf for HTTPS

2. **Environment Variables**

   - Never commit `.env` files
   - Use secrets management (Docker secrets, Kubernetes secrets)

3. **Image Security**
   - Use specific version tags, not `latest`
   - Regularly update base images
   - Scan images for vulnerabilities

## 📚 Additional Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
