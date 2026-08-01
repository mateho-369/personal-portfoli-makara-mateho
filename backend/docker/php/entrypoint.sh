#!/usr/bin/env sh
set -eu
cd /var/www/html
if [ ! -f vendor/autoload.php ]; then composer install --no-interaction --prefer-dist; fi
if [ -z "${APP_KEY:-}" ]; then export APP_KEY="base64:$(head -c 32 /dev/urandom | base64)"; fi
mkdir -p storage/framework/{cache,sessions,views} storage/logs bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
php artisan migrate --force
php artisan db:seed --force
php artisan config:clear
exec "$@"
