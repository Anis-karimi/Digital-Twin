# Build Stage
FROM node:20-alpine AS build

WORKDIR /app

# Accept build arguments for environment variables
ARG VITE_BACKEND_URL=http://localhost:8000
ARG VITE_DGTW_URL=http://localhost:5000

ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
ENV VITE_DGTW_URL=$VITE_DGTW_URL

# Copy dependency definitions and npm configuration
COPY package*.json .npmrc* ./

# Install dependencies cleanly (sanitizing any proxy variables passed by Docker build)
RUN for var in http_proxy https_proxy HTTP_PROXY HTTPS_PROXY all_proxy ALL_PROXY npm_config_proxy npm_config_https_proxy; do \
      eval val=\$$var; \
      if [ -z "$val" ]; then \
        unset $var; \
      else \
        case "$val" in \
          http://*|https://*|socks5://*) ;; \
          *) eval export $var="http://\$val" ;; \
        esac; \
      fi; \
    done && \
    (npm ci || npm install)

# Copy application files
COPY . ./

# Build production bundle
RUN npm run build

# Production Stage with Nginx
FROM nginx:alpine AS production

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build artifacts from build stage
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
