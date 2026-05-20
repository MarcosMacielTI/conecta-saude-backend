#!/bin/bash
# Quick start script for local testing

echo "🚀 Starting Backend..."
cd backend

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found in backend/"
    echo "📝 Please create .env with required variables:"
    echo "   MONGO_URI, JWT_SECRET, MP_ACCESS_TOKEN, etc."
    exit 1
fi

# Start backend on port 3000
npm start
