import time
import uuid
import traceback
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from app.schemas.generation_schemas import GenerationRequest, GenerationResponse
from app.database.models import RequestLog, ModelConfig
from app.services.mock_provider import MockProvider
from app.services.local_provider import LocalProvider
from app.services.hosted_provider import HostedProvider
from app.services.alert_service import AlertService
from app.core.config import settings
from app.core.logging import logger

class ModelAdapter:
    """
    Unified adapter executing local, hosted, or mock models,
    guaranteeing reliable latency metrics collection and persistent audit logs.
    """

    @staticmethod
    async def execute_generation(request: GenerationRequest, db: Session) -> GenerationResponse:
        request_id = str(uuid.uuid4())
        start_time = time.perf_counter()
        
        status = "success"
        generated_text = ""
        prompt_tokens = max(1, len(request.prompt) // 4)
        completion_tokens = 0
        total_tokens = prompt_tokens
        tokens_estimated = True
        cost_usd = 0.0
        is_mock = (request.provider == "mock")
        error_type: Optional[str] = None
        sanitized_error: Optional[str] = None
        http_status: Optional[int] = 200

        try:
            if request.provider == "mock":
                result = await MockProvider.generate(
                    model_id=request.model_id,
                    prompt=request.prompt,
                    max_tokens=request.max_tokens or 128,
                    temperature=request.temperature or 0.7,
                    simulate_delay_ms=request.simulate_delay_ms or 0,
                    simulate_error=request.simulate_error or False
                )
                generated_text = result["text"]
                prompt_tokens = result["prompt_tokens"]
                completion_tokens = result["completion_tokens"]
                total_tokens = result["total_tokens"]
                tokens_estimated = result["tokens_estimated"]
                cost_usd = result["cost_usd"]
                is_mock = True

            elif request.provider == "local":
                result = await LocalProvider.generate(
                    model_id=request.model_id,
                    prompt=request.prompt,
                    max_tokens=request.max_tokens or 128,
                    temperature=request.temperature or 0.7
                )
                generated_text = result["text"]
                prompt_tokens = result["prompt_tokens"]
                completion_tokens = result["completion_tokens"]
                total_tokens = result["total_tokens"]
                tokens_estimated = result["tokens_estimated"]
                cost_usd = result["cost_usd"]
                is_mock = False

            elif request.provider == "hosted":
                # Check if custom endpoint exists in db config
                cfg = db.query(ModelConfig).filter(ModelConfig.model_id == request.model_id).first()
                custom_endpoint = cfg.endpoint_url if cfg else None

                result = await HostedProvider.generate(
                    model_id=request.model_id,
                    prompt=request.prompt,
                    endpoint_url=custom_endpoint,
                    max_tokens=request.max_tokens or 128,
                    temperature=request.temperature or 0.7
                )
                generated_text = result["text"]
                prompt_tokens = result["prompt_tokens"]
                completion_tokens = result["completion_tokens"]
                total_tokens = result["total_tokens"]
                tokens_estimated = result["tokens_estimated"]
                cost_usd = result["cost_usd"]
                is_mock = False

            else:
                raise ValueError(f"Unsupported execution provider '{request.provider}'")

        except Exception as exc:
            status = "failed"
            error_type = exc.__class__.__name__
            # Sanitize error to prevent leaking secrets/tokens
            raw_err = str(exc)
            if settings.HF_API_TOKEN and settings.HF_API_TOKEN in raw_err:
                raw_err = raw_err.replace(settings.HF_API_TOKEN, "[REDACTED_TOKEN]")
            sanitized_error = raw_err
            http_status = 500
            if isinstance(exc, PermissionError):
                http_status = 401
            elif isinstance(exc, FileNotFoundError):
                http_status = 404
            elif isinstance(exc, TimeoutError):
                http_status = 504
            logger.warning(f"Generation failure on model '{request.model_id}': {sanitized_error}")

        end_time = time.perf_counter()
        latency_ms = round((end_time - start_time) * 1000.0, 2)

        # Prompt & response previews respecting privacy retention config
        prompt_preview = request.prompt[:settings.MAX_PROMPT_PREVIEW_LENGTH] if settings.LOG_PROMPT_BODY else "[LOGGING_DISABLED]"
        response_preview = generated_text[:settings.MAX_PROMPT_PREVIEW_LENGTH] if status == "success" else None

        # Guarantee DB persistence
        try:
            log_entry = RequestLog(
                id=request_id,
                model_id=request.model_id,
                provider=request.provider,
                execution_mode=request.provider,
                status=status,
                latency_ms=latency_ms,
                prompt_tokens=prompt_tokens,
                completion_tokens=completion_tokens,
                total_tokens=total_tokens,
                tokens_estimated=tokens_estimated,
                estimated_cost_usd=cost_usd,
                prompt_preview=prompt_preview,
                response_preview=response_preview,
                error_type=error_type,
                sanitized_error=sanitized_error,
                http_status=http_status
            )
            db.add(log_entry)
            db.commit()
            db.refresh(log_entry)

            # Check alerts asynchronously or inline
            AlertService.evaluate_operational_thresholds(db)

        except Exception as db_err:
            db.rollback()
            logger.error(f"Failed to record request log to database: {db_err}")

        if status == "failed":
            raise RuntimeError(f"Model generation failed ({error_type}): {sanitized_error}")

        return GenerationResponse(
            request_id=request_id,
            model_id=request.model_id,
            provider=request.provider,
            execution_mode=request.provider,
            generated_text=generated_text,
            latency_ms=latency_ms,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            total_tokens=total_tokens,
            tokens_estimated=tokens_estimated,
            estimated_cost_usd=cost_usd,
            is_mock=is_mock,
            created_at=log_entry.timestamp
        )
