#!/bin/bash

# Deployment script for offer consistency fixes
# Run this on your VPS production server

echo "🚀 Deploying offer consistency fixes to production..."

# 1. Pull latest changes from git
echo "📥 Pulling latest changes..."
git pull origin main

# 2. Install/update dependencies
echo "📦 Installing dependencies..."
composer install --no-dev --optimize-autoloader

# 3. Clear caches
echo "🧹 Clearing caches..."
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear

# 4. Run database migrations
echo "🗄️ Running database migrations..."
php artisan migrate --force

# 5. Test the monitoring command
echo "🔍 Testing offer consistency check..."
php artisan invoices:check-offer-consistency

# 6. Restart queue workers (if using queues)
echo "🔄 Restarting queue workers..."
php artisan queue:restart

# 7. Clear and cache config for production
echo "⚡ Optimizing for production..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "✅ Deployment completed successfully!"
echo "📊 Monitoring: The system will now check for offer consistency daily at 4 AM"
echo "🛡️ Prevention: Database constraints prevent future offer mismatches"

