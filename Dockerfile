# Build Stage reusing cached node_modules from digital-twin-dev
FROM digital-twin-dev:latest AS build

WORKDIR /app

# Accept build arguments for environment variables
ARG VITE_BACKEND_URL=http://localhost:8000
ARG VITE_DGTW_URL=http://localhost:5000

ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
ENV VITE_DGTW_URL=$VITE_DGTW_URL

# Copy application source files
COPY . ./

# Build production bundle using cached node_modules (zero internet / zero npm download)
RUN npm run build

# Production Stage with Nginx
FROM nginx:alpine AS production

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build artifacts from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Ensure all static files have read permissions for the nginx worker process
RUN chmod -R 755 /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
