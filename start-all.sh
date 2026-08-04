#!/bin/bash

# Function to kill all background processes on script exit
cleanup() {
    echo ""
    echo "🛑 Stopping all servers..."
    # Kill all child processes
    kill $(jobs -p)
}

# Trap SIGINT (Ctrl+C) and SIGTERM
trap cleanup SIGINT SIGTERM

# Unset proxy for localhost
unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY

echo "🚀 Starting all ShowGrid servers..."

# Start Admin Frontend
echo "Starting Admin Frontend..."
(cd admin && npm run dev) &

# Start Admin Backend
echo "Starting Admin Backend..."
(cd be-admin && if [ -f "node_modules/.bin/nodemon" ]; then ./node_modules/.bin/nodemon server.js; else node server.js; fi) &

# Start ShowGrid Frontend
echo "Starting ShowGrid Frontend..."
(cd showgrid-landing && npm run dev) &

# Start ShowGrid Backend
echo "Starting ShowGrid Backend..."
(cd showgrid-be && if [ -f "node_modules/.bin/nodemon" ]; then ./node_modules/.bin/nodemon server.js; else node server.js; fi) &

echo "✨ All servers are up and running!"
echo "Press Ctrl+C to stop everything."

# Wait for all background processes
wait
