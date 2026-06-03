# Stage 1: Build Vite bundle
FROM node:22-alpine AS build

WORKDIR /app

# Copy dependency configs
COPY package*.json ./
RUN npm install

# Copy source code and build
COPY . .
RUN npm run build

# Stage 2: Serve assets with Nginx
FROM nginx:alpine

# Copy built assets to Nginx default public directory
COPY --from=build /app/dist /usr/share/nginx/html

# Copy a basic Nginx configuration to support SPA routing on port 3000
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose client port
EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
