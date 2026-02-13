#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "🚀 Installing dependencies for all projects..."

echo "--------------------------------------------------"
echo "📦 Installing admin (Frontend)..."
cd admin
npm install
cd ..

echo "--------------------------------------------------"
echo "📦 Installing be-admin (Backend)..."
cd be-admin
npm install
cd ..

echo "--------------------------------------------------"
echo "📦 Installing showgrid-landing (Frontend)..."
cd showgrid-landing
npm install
cd ..

echo "--------------------------------------------------"
echo "📦 Installing showgrid-be (Backend)..."
cd showgrid-be
npm install
cd ..

echo "--------------------------------------------------"
echo "✅ All dependencies installed successfully!"
