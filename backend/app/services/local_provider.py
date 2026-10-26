import os
import asyncio
import concurrent.futures
from typing import Dict, Any, Optional
from app.core.logging import logger
from app.core.config import settings

# Thread pool for blocking CPU/GPU inference
_executor = concurrent.futures.ThreadPoolExecutor(max_workers=2)

class LocalProvider:
    """
    Local Hugging Face Transformers pipeline manager with lazy loading,
    GPU/CPU detection, model caching, and graceful fallback.
    """
    _pipelines: Dict[str, Any] = {}
    _model_status: Dict[str, str] = {}  # "ready", "loading", "failed", "unavailable"
    _model_errors: Dict[str, str] = {}

    @classmethod
    def is_available(cls) -> bool:
        try:
            import torch
            import transformers
            return True
        except ImportError:
            return False

    @classmethod
    def get_device(cls) -> str:
        try:
            import torch
            return "cuda" if torch.cuda.is_available() else "cpu"
        except ImportError:
            return "cpu"

    @classmethod
    def get_status(cls, model_id: str) -> str:
        if not cls.is_available():
            return "unavailable"
        return cls._model_status.get(model_id, "configured")

    @classmethod
    def load_pipeline(cls, model_id: str):
        if not cls.is_available():
            raise RuntimeError(
                "Local inference requires 'torch' and 'transformers'. "
                "Install them with: pip install -r requirements-ml.txt"
            )

        if model_id in cls._pipelines:
            return cls._pipelines[model_id]

        from transformers import pipeline
        import torch

        device_str = cls.get_device()
        device_id = 0 if device_str == "cuda" else -1

        cls._model_status[model_id] = "loading"
        logger.info(f"Loading local Hugging Face pipeline for '{model_id}' on {device_str}...")

        try:
            # ponytail: load pipeline once per model_id into class dict cache
            pipe = pipeline(
                "text-generation",
                model=model_id,
                device=device_id,
                torch_dtype=torch.float16 if device_str == "cuda" else torch.float32
            )
            cls._pipelines[model_id] = pipe
            cls._model_status[model_id] = "ready"
            cls._model_errors.pop(model_id, None)
            logger.info(f"Successfully loaded local model '{model_id}' on {device_str}")
            return pipe
        except Exception as e:
            cls._model_status[model_id] = "failed"
            cls._model_errors[model_id] = str(e)
            logger.error(f"Failed to load local model '{model_id}': {e}")
            raise

    @classmethod
    async def generate(
        cls,
        model_id: str,
        prompt: str,
        max_tokens: int = 128,
        temperature: float = 0.7
    ) -> Dict[str, Any]:
        if not cls.is_available():
            raise RuntimeError(
                "Local inference engine dependencies not installed. "
                "Run 'pip install -r requirements-ml.txt' or switch execution mode to 'mock' or 'hosted'."
            )

        loop = asyncio.get_running_loop()

        def _run_inference():
            pipe = cls.load_pipeline(model_id)
            # Generation call
            gen_kwargs = {
                "max_new_tokens": max_tokens,
                "temperature": max(0.01, temperature),
                "do_sample": temperature > 0.0,
                "pad_token_id": pipe.tokenizer.eos_token_id if pipe.tokenizer.eos_token_id else 50256
            }
            output = pipe(prompt, **gen_kwargs)
            return output

        output = await loop.run_in_executor(_executor, _run_inference)
        
        # Parse output
        generated_full = output[0]["generated_text"] if output else ""
        # If output starts with prompt, extract new text
        if generated_full.startswith(prompt):
            completion = generated_full[len(prompt):].strip()
        else:
            completion = generated_full

        prompt_tokens = max(1, len(prompt) // 4)
        completion_tokens = max(1, len(completion) // 4)
        total_tokens = prompt_tokens + completion_tokens

        return {
            "text": completion if completion else generated_full,
            "prompt_tokens": prompt_tokens,
            "completion_tokens": completion_tokens,
            "total_tokens": total_tokens,
            "tokens_estimated": True,
            "cost_usd": 0.0,  # Local hardware has 0 cloud cost
            "is_mock": False
        }
