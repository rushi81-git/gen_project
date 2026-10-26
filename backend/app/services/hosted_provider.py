import httpx
import asyncio
from typing import Dict, Any, Optional
from app.core.config import settings
from app.core.logging import logger

class HostedProvider:
    """
    Hosted Hugging Face Inference Provider client.
    Supports official router endpoints and custom hosted inference endpoints.
    """

    @staticmethod
    async def generate(
        model_id: str,
        prompt: str,
        endpoint_url: Optional[str] = None,
        max_tokens: int = 128,
        temperature: float = 0.7,
        token: Optional[str] = None
    ) -> Dict[str, Any]:
        hf_token = token or settings.HF_API_TOKEN
        if not hf_token or hf_token.startswith("hf_your_"):
            raise ValueError(
                "Hugging Face API token is not configured. "
                "Set HF_API_TOKEN in backend/.env to access hosted inference."
            )

        # Endpoint resolution: custom endpoint or official HF Router
        url = endpoint_url or f"{settings.HF_API_BASE_URL}/{model_id}"
        headers = {
            "Authorization": f"Bearer {hf_token}",
            "Content-Type": "application/json"
        }

        payload = {
            "inputs": prompt,
            "parameters": {
                "max_new_tokens": max_tokens,
                "temperature": max(0.01, temperature),
                "return_full_text": False
            }
        }

        timeout = httpx.Timeout(30.0, connect=10.0)
        max_loading_retries = 2
        retry_delay = 3.0

        async with httpx.AsyncClient(timeout=timeout) as client:
            for attempt in range(max_loading_retries + 1):
                try:
                    response = await client.post(url, headers=headers, json=payload)
                except httpx.TimeoutException:
                    raise TimeoutError(f"Request to hosted endpoint '{url}' timed out after 30 seconds.")
                except httpx.RequestError as exc:
                    raise ConnectionError(f"Network error connecting to hosted endpoint: {str(exc)}")

                if response.status_code == 200:
                    data = response.json()
                    # HF text-generation returns list: [{"generated_text": "..."}]
                    generated_text = ""
                    if isinstance(data, list) and len(data) > 0:
                        first = data[0]
                        if isinstance(first, dict):
                            generated_text = first.get("generated_text", "")
                        else:
                            generated_text = str(first)
                    elif isinstance(data, dict):
                        generated_text = data.get("generated_text") or data.get("text") or str(data)
                    else:
                        generated_text = str(data)

                    prompt_tokens = max(1, len(prompt) // 4)
                    completion_tokens = max(1, len(generated_text) // 4)
                    total_tokens = prompt_tokens + completion_tokens
                    # Approx standard HF inference serverless pricing estimate: $0.0002 / 1k tokens
                    cost_usd = round((total_tokens / 1000.0) * 0.0002, 6)

                    return {
                        "text": generated_text,
                        "prompt_tokens": prompt_tokens,
                        "completion_tokens": completion_tokens,
                        "total_tokens": total_tokens,
                        "tokens_estimated": True,
                        "cost_usd": cost_usd,
                        "is_mock": False
                    }

                elif response.status_code == 503:
                    # Model loading on Hugging Face infrastructure
                    err_info = response.json() if "application/json" in response.headers.get("content-type", "") else {}
                    estimated_time = err_info.get("estimated_time", retry_delay)
                    if attempt < max_loading_retries:
                        sleep_time = min(10.0, float(estimated_time) if isinstance(estimated_time, (int, float)) else retry_delay)
                        logger.info(f"Model '{model_id}' is loading on provider. Retrying in {sleep_time}s (attempt {attempt+1}/{max_loading_retries})...")
                        await asyncio.sleep(sleep_time)
                        continue
                    else:
                        raise RuntimeError(f"Hosted model '{model_id}' is still loading on Hugging Face (503 Service Unavailable). Try again in a minute.")

                elif response.status_code == 401:
                    raise PermissionError("Hugging Face authentication failed (401 Unauthorized). Check HF_API_TOKEN.")
                elif response.status_code == 404:
                    raise FileNotFoundError(f"Model '{model_id}' was not found on provider (404 Not Found).")
                elif response.status_code == 429:
                    raise RuntimeError("Hugging Face API rate limit reached (429 Too Many Requests).")
                else:
                    error_detail = response.text[:200]
                    raise RuntimeError(f"Hosted provider returned HTTP {response.status_code}: {error_detail}")
