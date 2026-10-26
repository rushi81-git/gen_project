# Deployment & Production Operations Guide

This guide describes how to deploy the **Generative AI Model Deployment and Monitoring Dashboard** to production environments.

---

## 1. Containerized Deployment with Docker Compose

### Development / Local Containerized Setup
Runs the FastAPI backend (with SQLite volume) and the React frontend:

```bash
docker-compose up --build -d
```
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000/api`

### Production Setup with PostgreSQL
Uses `docker-compose.prod.yml`, spinning up:
1. `db`: Managed PostgreSQL 15 container with persistent volume `postgres_data`.
2. `backend`: FastAPI with Uvicorn, connecting to Postgres via `psycopg2`.
3. `frontend`: Multi-stage build served through Nginx Alpine reverse-proxying `/api/` traffic.

```bash
# 1. Provide production secrets
export POSTGRES_PASSWORD=your_strong_db_password
export HF_API_TOKEN=hf_your_production_token

# 2. Launch production stack
docker-compose -f docker-compose.prod.yml up --build -d
```

- Access frontend at: `http://localhost` (Port 80)
- Health check: `http://localhost/api/health`

---

## 2. Cloud Provider Deployment Architecture

### Architecture Separation
In enterprise environments, separate the frontend, backend, and database:

1. **Frontend**: Deploy `frontend/` to **Vercel**, **Netlify**, or **AWS CloudFront/S3**.
   - Build command: `npm run build`
   - Output directory: `dist`
   - Environment variable: `VITE_API_URL=https://api.yourdomain.com/api`

2. **Backend**: Deploy `backend/` to **Render**, **Fly.io**, **AWS ECS/Fargate**, or **Google Cloud Run**.
   - Build context: `backend/`
   - Run command: `uvicorn app.main:app --host 0.0.0.0 --port 8000`
   - Health check path: `/api/health`

3. **Database**: Managed **PostgreSQL** (AWS RDS, Neon, Supabase, or Render Postgres).
   - Set `DATABASE_URL=postgresql+psycopg2://user:pass@host:5432/dbname`
   - Run migrations during deployment: `alembic upgrade head`

---

## 3. Production Environment Checklist

| Variable | Recommended Production Value | Description |
|---|---|---|
| `ENVIRONMENT` | `production` | Disables debug stack traces in responses |
| `DEBUG` | `false` | Prevents verbose system logs |
| `DATABASE_URL` | `postgresql+psycopg2://...` | Connection string to persistent relational DB |
| `CORS_ORIGINS` | `https://dashboard.yourdomain.com` | Restricts API access to authorized frontend origin |
| `HF_API_TOKEN` | `hf_...` | Hugging Face token (never expose publicly) |
| `LOG_PROMPT_BODY` | `true` or `false` | Toggle prompt retention compliance |
| `MAX_PROMPT_PREVIEW_LENGTH` | `100` | Limits prompt character length saved to disk |

---

## 4. Database Migrations in CI/CD

Before starting updated backend containers, apply versioned Alembic migrations:

```bash
cd backend
alembic upgrade head
```
All schema modifications are tracked in `backend/migrations/versions/`.
