#!/bin/bash

# Azure App Service startup script for Gym Backend

echo "Starting Gym Backend application..."

# Set Node.js environment
export NODE_ENV=production

# Display Node.js and npm versions for debugging
echo "Node.js version: $(node --version)"
echo "npm version: $(npm --version)"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "WARNING: DATABASE_URL environment variable is not set"
fi

# Run database migrations (optional - only if you want auto-migration)
# echo "Running database migrations..."
# npx prisma migrate deploy

# Start the application
echo "Starting the application..."
exec node dist/src/main.js