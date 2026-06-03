# Use official lightweight Node.js 22 Alpine image
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package list and package-lock to cache dependency installation stage
COPY package*.json ./

# Install dependencies (only production deps if NODE_ENV=production, but keeping all for ease)
RUN npm install

# Copy application source code
COPY . .

# Expose server port
EXPOSE 5000

# Set environment variable
ENV NODE_ENV=production

# Start Node application
CMD ["npm", "start"]
