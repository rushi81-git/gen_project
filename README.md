# LUMEN AI — Generative AI Model Deployment & Monitoring Dashboard

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg?logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React_18_|_Vite_|_TS-C6915A.svg?logo=react)](https://react.dev)
[![TailwindCSS](https://img.shields.io/badge/Styling-Tailwind_CSS_Dark_Editorial-F1D7AE.svg?logo=tailwind-css)](https://tailwindcss.com)
[![SQLAlchemy](https://img.shields.io/badge/ORM-SQLAlchemy_2.0_|_Alembic-A5A19C.svg)](https://www.sqlalchemy.org)
[![Hugging Face](https://img.shields.io/badge/AI-Hugging_Face_Transformers-C6915A.svg?logo=huggingface)](https://huggingface.co)

A complete, production-minded platform titled **Generative AI Model Deployment and Monitoring Dashboard** featuring **LUMEN AI** — a cinematic, dark editorial design language inspired by luxury lighting e-commerce discovery applications.

---

## 1. Visual Identity & Design System

The frontend has been designed to reflect a high-end product-design aesthetic:

- **Near-Black Base**: `#060606` background with `#111111` charcoal base.
- **Panels & Discovery Cards**: `#171717` cards bordered with subtle `#303030`.
- **Primary Typography**: Warm ivory `#F1D7AE` for high-contrast, elegant readability.
- **Secondary & Meta Typography**: Muted grey `#A5A19C` for subtle telemetry captions.
- **Focal Accent**: Muted bronze `#C6915A` used sparingly for active states, key CTAs, and performance highlights.
- **Subdued Restrained Indicators**: Soft olive emerald `#78c291` for healthy states and soft terracotta `#e07d7d` for incidents, avoiding harsh neon gradients.
- **Editorial Typography**: Inter and Manrope typography with lightweight headings, clear line-heights, and architectural spacing.

---

## 2. Core Dashboard Modules

1. **Top Navigation & Workspace Rail**
   - Brand mark and title: **LUMEN AI**.
   - Cluster Workspace Selector (`Production Cluster (US-East)`, `Staging Environment`, `Local Engine`).
   - Restrained live system status indicator.
   - Quick action: **Deploy Model** and **Playground**.

2. **Editorial Hero Section**
   - Statement: *"Intelligence, under control."*
   - Subtitle: *"Deploy models. Observe performance. Improve reliability."*
   - Direct model deployment trigger and live telemetry rate display.

3. **Key Performance Cards**
   - **Total Inference Requests** (with success/error breakdown).
   - **Average Latency** (with exact P95 latency percentile).
   - **Error Rate** (with status classification).
   - **Active Models** (with total tokens processed and cost estimates).

4. **Main Monitoring Area**
   - Large dual-metric Area Chart showing traffic throughput and failure events in bronze & terracotta.
   - **Model Fleet Health Panel** tracking endpoint states and average latency.
   - **Recent Invocations Stream** with real-time audit entries.
   - **Active Alarms Panel** with direct in-app acknowledge action.

5. **Model Registry & Discovery Gallery**
   - Architectural model cards displaying provider type (Local, Hosted, Mock), task, max tokens, and temperature.
   - On-demand endpoint health probing with millisecond feedback.
   - Modal for registering new Hugging Face models or cloud router endpoints.

6. **Distraction-Free Prompt Playground**
   - Two-panel desktop layout (stacked on mobile).
   - Dedicated System Instruction context editor and user prompt input.
   - Generation parameter sliders (max tokens 10–1024, temperature 0.0–1.5).
   - Mock delay and provider failure injection switches.
   - Output pane with real-time latency, token usage, cost estimate, and one-click copy.

7. **Audit Logs & CSV Streaming**
   - Searchable, filterable, paginated audit table with multi-criteria filters.
   - Mini-bar distribution chart of recent invocations.
   - One-click standard CSV export (`/api/logs/export`).
   - Detailed trace inspector drawer.

8. **Operational Alerting & Thresholds**
   - Automated threshold evaluations on rolling 50-request windows.
   - Rules: High Error Rate (>10%), Consecutive Outages (>=3), and High P95 Latency (>2,500ms).
   - Acknowledge and resolve workflow with deduplication.

9. **AI Response Quality Benchmark**
   - Deterministic QA and instruction benchmark engine measuring completeness, keyword relevance, and malformed rates.
   - Scorecard report and historical run comparison.

10. **System & Security Configuration**
    - Database connectivity status (SQLite / PostgreSQL).
    - Hardware accelerator detection (CPU vs CUDA).
    - Server-side Hugging Face secret protection notice.
    - Prompt logging privacy policy (default truncation to 250 characters).

---

## 3. Windows PowerShell Setup Instructions

Follow these exact commands to run the application locally on Windows.

### Prerequisites Verification

Open PowerShell:
```powershell
python --version   # Python 3.11+
node --version     # Node.js 18+ (tested with v20 and v24)
npm --version      # npm 9+
```

---

### Step 1: Run the Backend (Terminal 1)

1. Navigate to `backend/`:
   ```powershell
   cd c:\Users\Rushikesh\OneDrive\문서\Desktop\gen_project\backend
   ```

2. Create and activate a Python virtual environment:
   ```powershell
   python -m venv .venv
   
   # If PowerShell script execution is restricted:
   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
   
   .\.venv\Scripts\Activate.ps1
   ```

3. Install backend dependencies:
   ```powershell
   pip install -r requirements.txt
   ```

4. Create local environment configuration:
   ```powershell
   Copy-Item .env.example .env
   ```

5. Run database schema migrations:
   ```powershell
   alembic upgrade head
   ```

6. Start the FastAPI development server:
   ```powershell
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```
   - API Health Endpoint: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)
   - Interactive Swagger Docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

### Step 2: Run the Frontend (Terminal 2)

1. Open a **second PowerShell window** and navigate to `frontend/`:
   ```powershell
   cd c:\Users\Rushikesh\OneDrive\문서\Desktop\gen_project\frontend
   ```

2. Install dependencies:
   ```powershell
   npm install
   ```

3. Create frontend environment configuration:
   ```powershell
   Copy-Item .env.example .env
   ```

4. Start the Vite development server:
   ```powershell
   npm run dev
   ```
   *(Notice: ensure you type `npm run dev` with a single 'n')*

5. Open your browser:
   - **Dashboard Web UI**: [http://localhost:5173](http://localhost:5173)

---

## 4. Automated Testing & Verification

### Backend Tests
In your backend terminal with `.venv` active:
```powershell
cd backend
pytest -v
```
**Results**: 11 passed in 0.32s (health, readiness, mock generation, prompt validation, failure logging, metrics calculation, P95 percentiles, log filtering, CSV exports, alert thresholds, and evaluation benchmarks).

### Frontend Production Build
In your frontend terminal:
```powershell
cd frontend
npm run build
```
**Results**: Built in 6.79s. TypeScript typechecking passed cleanly with zero errors; production bundle output to `frontend/dist/`.

---

## 5. Docker Compose Quickstart

### Development Stack
```bash
docker-compose up --build -d
```
- Web UI: `http://localhost:5173`
- Backend API: `http://localhost:8000/api`

### Production Stack with PostgreSQL
```bash
docker-compose -f docker-compose.prod.yml up --build -d
```
- Web UI: `http://localhost` (Port 80 via Nginx reverse proxy)
- PostgreSQL: Port 5432 with persistent volume `postgres_data`

---

## 6. Troubleshooting Quick Reference

| Issue | Cause | Fix |
|---|---|---|
| `Unknown command: runn` | Typo in terminal | Run `npm run dev` (single 'n') |
| `Activate.ps1 cannot be loaded` | PowerShell execution policy | Run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` |
| `Port 8000 already in use` | Zombie Uvicorn process | Run `Get-NetTCPConnection -LocalPort 8000` and stop with `Stop-Process -Id <PID> -Force` |
| `Hugging Face 401 Unauthorized` | Missing / invalid token | Set valid `HF_API_TOKEN` in `backend/.env` or switch to **Mock** mode |
| `Local ML dependencies not found` | Optional torch not installed | Run `pip install -r requirements-ml.txt` or use **Mock** / **Hosted** mode |

---

## License
MIT License. Built for generative AI operational engineering and monitoring.
