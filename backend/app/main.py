from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.logging import setup_logging, logger
from app.database.session import engine, Base, SessionLocal
from app.database.models import ModelConfig
from app.api.routes_system import router as system_router
from app.api.routes_models import router as models_router
from app.api.routes_generate import router as generate_router
from app.api.routes_metrics import router as metrics_router
from app.api.routes_logs import router as logs_router
from app.api.routes_alerts import router as alerts_router
from app.api.routes_eval import router as eval_router

setup_logging()

def seed_initial_models():
    """
    Seeds initial default model configurations if database is empty.
    """
    db = SessionLocal()
    try:
        count = db.query(ModelConfig).count()
        if count == 0:
            logger.info("Database initialized. Seeding default model configurations...")
            defaults = [
                ModelConfig(
                    model_id="mock-gpt-fast",
                    name="Mock Fast Model (Simulation)",
                    provider="mock",
                    task="text-generation",
                    status="ready",
                    health_status="healthy",
                    max_tokens=150,
                    temperature=0.7
                ),
                ModelConfig(
                    model_id="mock-reasoning-pro",
                    name="Mock Reasoning Pro (Simulation)",
                    provider="mock",
                    task="text-generation",
                    status="ready",
                    health_status="healthy",
                    max_tokens=256,
                    temperature=0.4
                ),
                ModelConfig(
                    model_id="distilbert/distilgpt2",
                    name="DistilGPT-2 (Local Hugging Face)",
                    provider="local",
                    task="text-generation",
                    status="configured",
                    health_status="unknown",
                    max_tokens=100,
                    temperature=0.7
                ),
                ModelConfig(
                    model_id="meta-llama/Llama-3.2-1B-Instruct",
                    name="Llama 3.2 1B (Hosted Hugging Face)",
                    provider="hosted",
                    task="text-generation",
                    status="configured",
                    health_status="unknown",
                    max_tokens=200,
                    temperature=0.7
                )
            ]
            db.add_all(defaults)
            db.commit()
            logger.info("Default model configurations seeded successfully.")
    except Exception as e:
        logger.error(f"Error seeding default models: {e}")
        db.rollback()
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create DB tables
    Base.metadata.create_all(bind=engine)
    seed_initial_models()
    yield

app = FastAPI(
    title="Generative AI Model Deployment and Monitoring Dashboard API",
    version="1.0.0",
    description="Operational telemetry, model adapter, request tracing, and evaluation engine.",
    lifespan=lifespan
)

# CORS Middleware
origins = settings.cors_origins_list
if not origins:
    origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global sanitized exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.method} {request.url.path}: {exc}")
    # Prevent leaking internal server stack traces to client
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Telemetry recorded."}
    )

# Include API Routers under configured prefix
prefix = settings.API_PREFIX

app.include_router(system_router, prefix=prefix)
app.include_router(models_router, prefix=prefix)
app.include_router(generate_router, prefix=prefix)
app.include_router(metrics_router, prefix=prefix)
app.include_router(logs_router, prefix=prefix)
app.include_router(alerts_router, prefix=prefix)
app.include_router(eval_router, prefix=prefix)

@app.get("/")
def root():
    return {
        "service": "Generative AI Model Deployment & Monitoring Dashboard",
        "documentation": "/docs",
        "health": f"{prefix}/health"
    }
