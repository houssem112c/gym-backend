# Use Node.js 18 LTS
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Copy prisma directory
COPY prisma ./prisma/

# Install ALL dependencies (including devDependencies needed for build)
RUN npm ci && npm cache clean --force

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Make startup script executable
RUN chmod +x startup.sh

# Build the application (requires devDependencies)
RUN npm run build

# Create uploads directory in tmp (ephemeral storage)
RUN mkdir -p /tmp/uploads

# Remove devDependencies to reduce image size (optional)
RUN npm prune --production

# Expose port
EXPOSE 3001

# Start the application
CMD ["node", "dist/src/main.js"]