# Field Notes — React + Laravel + MinIO

A peaceful personal portfolio and media journal using the original **Hopecore Peace** React interface with a fully self-hosted Laravel backend.

## Architecture

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS 4
- **API:** Laravel 12 REST API in `/backend`
- **Authentication:** Laravel Sanctum SPA sessions plus Socialite Google OAuth
- **Database:** PostgreSQL
- **Media storage:** MinIO through Laravel's S3 filesystem, with browser-to-MinIO presigned uploads
- **Local services:** Docker Compose, PHP-FPM, Nginx, PostgreSQL, MinIO

## Run locally

```bash
# Build and start React, Laravel, PostgreSQL, and MinIO together
docker compose up --build -d

# Exercise registration, login, chat writes, owner inbox, MinIO upload,
# and media create/update/delete through the same frontend origin
sh scripts/smoke-test.sh
```

Services:

- Complete application: `http://localhost:5173`
- Laravel API: `http://localhost:8080`
- MinIO API: `http://localhost:9000`
- MinIO console: `http://localhost:9001`

The frontend Nginx container proxies `/api` and `/sanctum` to Laravel, so Sanctum cookies are same-origin and no local CORS workarounds are needed. The Laravel container automatically runs migrations and seeds the portfolio. The local owner account defaults to `portfolio.owner@example.com` / `peaceful123`; override it with `ADMIN_EMAIL` and `ADMIN_PASSWORD` before production.

To watch logs or reset all test data:

```bash
docker compose logs -f frontend nginx app minio
docker compose down -v
```

## Configuration

Copy `backend/.env.example` to `backend/.env` when running Laravel outside Docker. Configure the Google OAuth client and callback through `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_REDIRECT_URI`.

For production, serve the React app and Laravel API on the same parent domain, set `FRONTEND_URL`, `FRONTEND_URLS`, `SANCTUM_STATEFUL_DOMAINS`, and `SESSION_DOMAIN`, and use HTTPS with `SESSION_SECURE_COOKIE=true`.
