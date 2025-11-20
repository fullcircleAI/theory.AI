#!/bin/bash

# Deploy to Vercel
# Make sure you're logged in first: npx vercel login

echo "🔗 Linking project to Vercel..."
npx vercel link --yes

echo "🚀 Deploying to production..."
npx vercel --prod

echo "✅ Deployment complete!"

