# Troubleshooting Guide

This guide provides causes, diagnostic commands, and safe fixes for common issues when running or deploying the dashboard.

---

## 1. PowerShell Script Execution Policy Blocked
- **Symptom**: `.\.venv\Scripts\Activate.ps1 cannot be loaded because running scripts is disabled on this system.`
- **Likely Cause**: Windows PowerShell execution policy restricts running unsigned scripts by default.
- **Diagnostic Command**:
  ```powershell
  Get-ExecutionPolicy
  ```
- **Safe Fix**: Set execution policy to bypass for the current process:
  ```powershell
  Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
  .\.venv\Scripts\Activate.ps1
  ```

---

## 2. Port 8000 or Port 5173 Already Occupied
- **Symptom**: `[Errno 10048] error while attempting to bind on address ('127.0.0.1', 8000): address already in use` or Vite selecting port 5174.
- **Likely Cause**: A previous instance of Uvicorn, Python, or Vite is already running on that port.
- **Diagnostic Command**:
  ```powershell
  Get-NetTCPConnection -LocalPort 8000, 5173 -ErrorAction SilentlyContinue | Format-Table OwningProcess, LocalPort, State
  ```
- **Safe Fix**: Stop the orphaned process or run Uvicorn on an alternate port:
  ```powershell
  # Kill process by PID (e.g., PID 1234):
  Stop-Process -Id 1234 -Force
  
  # Or start Uvicorn on port 8001:
  uvicorn app.main:app --host 127.0.0.1 --port 8001
  ```

---

## 3. CORS Error in Browser Console
- **Symptom**: `Access to fetch at 'http://127.0.0.1:8000/api/...' has been blocked by CORS policy.`
- **Likely Cause**: The frontend is running on a port or origin not listed in the backend's `CORS_ORIGINS`.
- **Diagnostic Command**: Check `.env` in `backend/`:
  ```powershell
  Get-Content backend\.env | Select-String "CORS_ORIGINS"
  ```
- **Safe Fix**: Add your frontend URL (e.g. `http://localhost:5173,http://127.0.0.1:5173`) to `CORS_ORIGINS` in `backend/.env` and restart Uvicorn.

---

## 4. Hugging Face Authentication Failure (HTTP 401)
- **Symptom**: `PermissionError: Hugging Face authentication failed (401 Unauthorized)`.
- **Likely Cause**: Missing or invalid `HF_API_TOKEN` when calling hosted Hugging Face models.
- **Diagnostic Command**: Check if `HF_API_TOKEN` is loaded:
  ```powershell
  Invoke-RestMethod -Uri http://127.0.0.1:8000/api/ready
  ```
- **Safe Fix**:
  1. Generate an API token at [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens).
  2. Put `HF_API_TOKEN=hf_yourTokenHere` inside `backend/.env`.
  3. Restart Uvicorn, or switch execution mode to **Mock** in the playground.

---

## 5. Hosted Model Loading (HTTP 503)
- **Symptom**: `503 Service Unavailable: Model is currently loading`.
- **Likely Cause**: Serverless Hugging Face endpoints spin down cold models.
- **Safe Fix**: The dashboard backend automatically executes 2 retries with exponential backoff. If it still fails, wait 30 seconds for the model to warm up on Hugging Face and retry.

---

## 6. Hugging Face Rate Limit (HTTP 429)
- **Symptom**: `RuntimeError: Hugging Face API rate limit reached (429 Too Many Requests)`.
- **Likely Cause**: Standard free-tier inference accounts are subject to rolling rate limits.
- **Safe Fix**: Switch the execution mode dropdown in the Playground to **Mock Simulator** to continue testing monitoring, charts, and telemetry without consuming API limits.

---

## 7. Local Transformers Dependencies Missing
- **Symptom**: `RuntimeError: Local inference requires 'torch' and 'transformers'. Install them with: pip install -r requirements-ml.txt`.
- **Likely Cause**: You ran `pip install -r requirements.txt` (standard lightweight stack), but selected a local model pipeline.
- **Safe Fix**:
  ```powershell
  cd backend
  .\.venv\Scripts\pip install -r requirements-ml.txt
  ```
  Or switch to **Mock** or **Hosted** execution mode.

---

## 8. Alembic Migration Sync / SQLite Locked
- **Symptom**: `alembic.util.exc.CommandError: Can't locate revision identified by '...'` or database locked.
- **Likely Cause**: The database schema is out of sync or opened by another tool.
- **Safe Fix**:
  ```powershell
  cd backend
  .\.venv\Scripts\alembic upgrade head
  ```
