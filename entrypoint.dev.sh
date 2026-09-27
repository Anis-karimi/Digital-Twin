#!/bin/sh
set -e

# If node_modules or vite binary is missing in /app, install dependencies
if [ ! -d "/app/node_modules" ] || [ ! -f "/app/node_modules/.bin/vite" ]; then
    echo "=========================================================="
    echo "node_modules or vite binary missing in /app."
    echo "Installing frontend dependencies..."
    echo "=========================================================="
    npm install --include=dev
fi

exec "$@"
