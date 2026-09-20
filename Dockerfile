# Build Stage
FROM node:20-alpine AS build

WORKDIR /app

# Accept build arguments for environment variables
ARG VITE_BACKEND_URL=http://localhost:8000
ARG VITE_DGTW_URL=http://localhost:5000

ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
ENV VITE_DGTW_URL=$VITE_DGTW_URL

# Install dependencies first for efficient layer caching
COPY package*.json ./
RUN npm ci

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
