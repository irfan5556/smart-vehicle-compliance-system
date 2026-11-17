# ==============================================================================
# Stage 1: Build the React Application with Vite
# ==============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Cache package manifests
COPY package*.json ./
RUN npm ci || npm install

# Copy source and build static assets
COPY . .
RUN npm run build

# ==============================================================================
# Stage 2: Serve optimized static assets with Nginx
# ==============================================================================
FROM nginx:1.25-alpine

LABEL maintainer="Smart Vehicle Compliance System Team"
LABEL description="React Frontend with Nginx Reverse Proxy"

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built frontend assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration with reverse proxy for /api
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]

