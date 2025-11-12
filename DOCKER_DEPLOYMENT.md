# Docker Deployment Guide - SpaceGuide AI Frontend

## 🐳 Quick Start

### Build and Run with Docker

```bash
# Build the image
docker build \
  --build-arg VITE_API_URL=https://api.yourdomain.com/api \
  --build-arg VITE_STRIPE_PUBLISHABLE_KEY=pk_live_... \
  -t spaceguide-ai-frontend:latest .

# Run the container
docker run -d \
  -p 3000:80 \
  --name spaceguide-ai-frontend \
  --restart unless-stopped \
  spaceguide-ai-frontend:latest
```

### Using Docker Compose

1. **Create `.env` file** (or use environment variables):

```env
VITE_API_URL=https://api.yourdomain.com/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_key_here
VITE_APP_NAME=SpaceGuideAI
VITE_APP_VERSION=1.0.0
```

2. **Build and run**:

```bash
docker-compose up -d
```

3. **View logs**:

```bash
docker-compose logs -f
```

4. **Stop**:

```bash
docker-compose down
```

## 📋 Build Arguments

| Argument                      | Description            | Required | Default                     |
| ----------------------------- | ---------------------- | -------- | --------------------------- |
| `VITE_API_URL`                | Backend API URL        | Yes      | `http://localhost:5000/api` |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | No       | -                           |
| `VITE_APP_NAME`               | Application name       | No       | `SpaceGuideAI`              |
| `VITE_APP_VERSION`            | Application version    | No       | `1.0.0`                     |

## 🔧 Production Deployment

### Option 1: Docker with Environment Variables

```bash
docker build \
  --build-arg VITE_API_URL=https://api.yourdomain.com/api \
  --build-arg VITE_STRIPE_PUBLISHABLE_KEY=pk_live_... \
  -t spaceguide-ai-frontend:latest .

docker run -d \
  -p 80:80 \
  -p 443:443 \
  --name spaceguide-ai-frontend \
  --restart unless-stopped \
  spaceguide-ai-frontend:latest
```

### Option 2: Docker Compose with .env

```yaml
# docker-compose.prod.yml
version: "3.8"

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        VITE_API_URL: ${VITE_API_URL}
        VITE_STRIPE_PUBLISHABLE_KEY: ${VITE_STRIPE_PUBLISHABLE_KEY}
    ports:
      - "80:80"
      - "443:443"
    restart: unless-stopped
    networks:
      - app-network
```

### Option 3: Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: spaceguide-ai-frontend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: spaceguide-ai-frontend
  template:
    metadata:
      labels:
        app: spaceguide-ai-frontend
    spec:
      containers:
        - name: frontend
          image: spaceguide-ai-frontend:latest
          ports:
            - containerPort: 80
          env:
            - name: VITE_API_URL
              value: "https://api.yourdomain.com/api"
```

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

## 📊 Health Checks

The container includes a health check endpoint:

```bash
# Check health
curl http://localhost:3000/health
# Should return: healthy
```

## 🚀 CI/CD Integration

### GitHub Actions Example

```yaml
name: Build and Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Docker image
        run: |
          docker build \
            --build-arg VITE_API_URL=${{ secrets.VITE_API_URL }} \
            --build-arg VITE_STRIPE_PUBLISHABLE_KEY=${{ secrets.VITE_STRIPE_PUBLISHABLE_KEY }} \
            -t spaceguide-ai-frontend:${{ github.sha }} .
      - name: Push to registry
        run: |
          docker push spaceguide-ai-frontend:${{ github.sha }}
```

## 📝 Notes

- **Port**: Container exposes port 80, map to any host port
- **Health Check**: Available at `/health` endpoint
- **Static Files**: Served from `/usr/share/nginx/html`
- **SPA Routing**: All routes redirect to `index.html`
- **Caching**: Static assets cached for 1 year, HTML for 1 hour

## 🔍 Troubleshooting

### Container won't start

```bash
# Check logs
docker logs spaceguide-ai-frontend

# Check if port is in use
netstat -tulpn | grep :3000
```

### Build fails

```bash
# Clear Docker cache
docker builder prune

# Rebuild without cache
docker build --no-cache -t spaceguide-ai-frontend .
```

### Environment variables not working

- Ensure build args are passed during `docker build`
- Check that variables start with `VITE_`
- Verify `.env` file format (if using docker-compose)

---

**Ready for Production!** 🚀
