"""Local tag generation helpers for RAG playground."""
from __future__ import annotations

import json
import os
import time
from typing import Dict, Iterable, List, Sequence, Tuple


class LocalTagGenerator:
    """Generate structured tags using a local transformers model."""

    def __init__(
        self,
        *,
        model_name: str | None = None,
        device: str | None = None,
        max_new_tokens: int = 256,
        temperature: float = 0.2,
        top_p: float = 0.9,
        trust_remote_code: bool = False,
    ) -> None:
        try:
            import torch  # type: ignore
        except Exception as exc:  # pragma: no cover - optional dependency
            raise RuntimeError("PyTorch is required for local tag generation.") from exc
        try:
            from transformers import pipeline  # type: ignore
        except Exception as exc:  # pragma: no cover - optional dependency
            raise RuntimeError(
                "transformers is required for local tag generation. Install via `pip install transformers`."
            ) from exc

        self.model_name = model_name or os.getenv("RAG_LOCAL_TAG_MODEL", "TinyLlama/TinyLlama-1.1B-Chat-v1.0")
        self.max_new_tokens = max_new_tokens
        self.temperature = temperature
        self.top_p = top_p
        self._device = (device or os.getenv("RAG_LOCAL_TAG_DEVICE") or "").strip().lower()
        if self._device not in ("cpu", "cuda", "mps"):
            if torch.cuda.is_available():
                self._device = "cuda"
            elif getattr(torch.backends, "mps", None) and torch.backends.mps.is_available():  # type: ignore[attr-defined]
                self._device = "mps"
            else:
                self._device = "cpu"
        torch_dtype = torch.float16 if self._device in ("cuda", "mps") else torch.float32
        device_map = 0 if self._device in ("cuda", "mps") else -1
        self._generator = pipeline(
            "text-generation",
            model=self.model_name,
            tokenizer=self.model_name,
            device=device_map,
            torch_dtype=torch_dtype,
            trust_remote_code=trust_remote_code,
        )

        self._tokenizer = getattr(self._generator, "tokenizer", None)

    def suggest_tags(self, text: str, categories: Sequence[str]) -> Tuple[Dict[str, List[str]], Dict[str, float]]:
        """Generate tag suggestions for each category."""
        prompt = self._build_prompt(text, categories)
        prompt_tokens = self._count_tokens(prompt)
        start = time.perf_counter()
        outputs = self._generator(
            prompt,
            max_new_tokens=self.max_new_tokens,
            temperature=self.temperature,
            top_p=self.top_p,
            do_sample=True,
            return_full_text=False,
        )
        elapsed = time.perf_counter() - start
        result_text = ""
        if outputs and isinstance(outputs, list):
            payload = outputs[0]
            if isinstance(payload, dict):
                result_text = str(payload.get("generated_text", "")).strip()
            else:
                result_text = str(payload).strip()
        parsed = self._parse_suggestions(result_text, categories)
        completion_tokens = self._count_tokens(result_text)
        stats = {
            "prompt_tokens": float(prompt_tokens),
            "completion_tokens": float(completion_tokens),
            "total_tokens": float(prompt_tokens + completion_tokens),
            "elapsed_seconds": float(elapsed),
        }
        return parsed, stats

    def _build_prompt(self, text: str, categories: Sequence[str]) -> str:
        cat_list = ", ".join(categories)
        clipped = text.strip().replace("\r\n", "\n")
        if len(clipped) > 4000:
            clipped = clipped[:4000]
        return (
            "You are an expert research curator.\n"
            "Analyze the following academic excerpt and extract at most three concise tags per category.\n"
            f"Categories: {cat_list}.\n"
            "Respond with a STRICT JSON object mapping each category to an array of lowercase tags.\n"
            "Use short noun phrases (2-4 words) without punctuation. Example: {\"study_design\": [\"randomized trial\"]}.\n"
            f"Text:\n{clipped}\n"
            "JSON:"
        )

    def _parse_suggestions(self, text: str, categories: Sequence[str]) -> Dict[str, List[str]]:
        data: Dict[str, List[str]] = {cat: [] for cat in categories}
        payload = self._extract_json(text)
        if payload is None:
            payload = self._fallback_parse(text)
        if isinstance(payload, dict):
            for key, values in payload.items():
                if key not in data:
                    continue
                if isinstance(values, str):
                    values = [values]
                if isinstance(values, (list, tuple, set)):
                    cleaned = self._normalize_tags(values)
                    if cleaned:
                        data[key] = cleaned
        return data

    @staticmethod
    def _extract_json(text: str) -> Dict[str, Iterable[str]] | None:
        if not text:
            return None
        start = text.find("{")
        end = text.rfind("}")
        if start == -1 or end == -1 or end <= start:
            return None
        snippet = text[start : end + 1]
        try:
            parsed = json.loads(snippet)
        except Exception:
            return None
        if isinstance(parsed, dict):
            return parsed  # type: ignore[return-value]
        return None

    @staticmethod
    def _fallback_parse(text: str) -> Dict[str, List[str]]:
        results: Dict[str, List[str]] = {}
        if not text:
            return results
        lines = text.splitlines()
        for line in lines:
            if ":" not in line:
                continue
            key, value = line.split(":", 1)
            key = key.strip().strip("-* ").lower()
            values = [part.strip() for part in value.split(",") if part.strip()]
            if not key or not values:
                continue
            results[key] = values
        return results

    @staticmethod
    def _normalize_tags(values: Iterable[str]) -> List[str]:
        seen: set[str] = set()
        cleaned: List[str] = []
        for value in values:
            token = str(value).strip()
            if not token:
                continue
            token = token.strip(",.; ")
            token = token.lower()
            if not token or token in seen:
                continue
            seen.add(token)
            cleaned.append(token)
        return cleaned

    def _count_tokens(self, text: str) -> int:
        if not text:
            return 0
        tokenizer = getattr(self, "_tokenizer", None)
        if tokenizer is None:
            return max(1, len(text) // 4)
        try:
            encoded = tokenizer(text, return_tensors="pt", add_special_tokens=False)
            token_ids = encoded.get("input_ids")
            if token_ids is None:
                return max(1, len(text) // 4)
            return int(token_ids.shape[-1])
        except Exception:
            return max(1, len(text) // 4)


__all__ = ["LocalTagGenerator"]
