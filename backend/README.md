# Field Notes Laravel API

Laravel 12 REST API with Sanctum session auth, Socialite Google login, PostgreSQL, and direct-to-MinIO presigned uploads.

## Local start

From the repository root:

```bash
docker compose up --build
```

The API is served at `http://localhost:8080`, MinIO at `http://localhost:9000`, and the MinIO console at `http://localhost:9001`. Run the Vite frontend with `VITE_API_URL=http://localhost:8080 npm run dev`.

The compose entrypoint migrates and seeds the database. Change all passwords and OAuth settings before production deployment.
