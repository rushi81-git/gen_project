# Windows PowerShell Setup Guide

Follow these exact steps to run the **Generative AI Model Deployment & Monitoring Dashboard** on Windows using PowerShell.

---

## 1. Prerequisites Verification

Open PowerShell and verify Python, Node.js, and Git:

```powershell
python --version
node --version
npm --version
git --version
```

Requirements:
- **Python**: 3.11+
- **Node.js**: v18+ (verified with v20/v24)
- **PowerShell**: Windows PowerShell 5.1 or PowerShell 7+

---

## 2. Backend Setup (Terminal 1)

Navigate to the project root and enter the `backend/` directory:

```powershell
cd backend

# 1. Create a Python virtual environment
python -m venv .venv

# 2. Activate the virtual environment
# If script execution is blocked on Windows, run: Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1

# 3. Install required backend dependencies
pip install -r requirements.txt

# 4. Copy the environment configuration template
Copy-Item .env.example .env

# 5. Run database schema migrations
alembic upgrade head

# 6. Start the FastAPI development server
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Verify backend health in PowerShell:
```powershell
Invoke-RestMethod -Uri http://127.0.0.1:8000/api/health
```

Interactive API Swagger documentation is available at: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

## 3. Frontend Setup (Terminal 2)

Open a **second PowerShell window** and run:

```powershell
cd frontend

# 1. Install frontend packages
npm install

# 2. Copy the environment configuration template
Copy-Item .env.example .env

# 3. Start the Vite development server
npm run dev
```

Open your browser at: [http://localhost:5173](http://localhost:5173)

---

## 4. Running Backend Automated Tests

In the backend terminal with `.venv` active:

```powershell
cd backend
pytest -v
```

All 11 automated unit and integration tests will run using an in-memory SQLite test database.

---

## 5. Building Frontend for Production

In the frontend terminal:

```powershell
cd frontend
npm run build
```

This compiles TypeScript and builds optimized production assets to `frontend/dist/`.
