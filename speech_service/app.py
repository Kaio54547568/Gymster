import os
import re
import tempfile
from pathlib import Path
from typing import Any, Dict, Optional

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from huggingface_hub import snapshot_download

try:
    from funasr import AutoModel
except ImportError:  # pragma: no cover - startup guard
    AutoModel = None


MODEL_REPOS = {
    "SenseVoiceSmall": "FunAudioLLM/SenseVoiceSmall",
    "iic/SenseVoiceSmall": "FunAudioLLM/SenseVoiceSmall",
    "FunAudioLLM/SenseVoiceSmall": "FunAudioLLM/SenseVoiceSmall",
}

MODEL_NAME = MODEL_REPOS.get(
    os.getenv("FUNASR_MODEL", "SenseVoiceSmall"),
    os.getenv("FUNASR_MODEL", "SenseVoiceSmall"),
)
DEVICE = os.getenv("FUNASR_DEVICE", "cpu")

app = FastAPI(title="Gymster Speech-to-Text Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ALLOW_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_model: Optional[Any] = None


def resolve_model(model_name: str) -> str:
    repo_id = MODEL_REPOS.get(model_name)
    if repo_id is None:
        return model_name

    return snapshot_download(
        repo_id,
        allow_patterns=[
            "config.yaml",
            "configuration.json",
            "am.mvn",
            "*.model",
            "model.pt",
        ],
    )


def get_model() -> Any:
    global _model

    if AutoModel is None:
        raise RuntimeError(
            "funasr is not installed. Install dependencies from requirements.txt first."
        )

    if _model is None:
        _model = AutoModel(
            model=resolve_model(MODEL_NAME),
            trust_remote_code=False,
            device=DEVICE,
            disable_update=True,
        )

    return _model


def normalize_result(result: Any) -> str:
    if isinstance(result, list):
        chunks = []
        for item in result:
            if isinstance(item, dict):
                text = item.get("text") or item.get("sentence") or ""
                if text:
                    chunks.append(str(text))
            elif item:
                chunks.append(str(item))
        return clean_text(" ".join(chunks))

    if isinstance(result, dict):
        return clean_text(result.get("text") or result.get("sentence") or "")

    return clean_text(result or "")


def clean_text(text: Any) -> str:
    return re.sub(r"\s+", " ", re.sub(r"<\|[^|]*\|>", "", str(text or ""))).strip()


@app.get("/health")
def health() -> Dict[str, str]:
    return {
        "status": "ok",
        "model": MODEL_NAME,
        "device": DEVICE,
    }


@app.post("/transcribe")
async def transcribe(file: UploadFile = File(...)) -> Dict[str, Any]:
    if not file.content_type or not file.content_type.startswith("audio/"):
        raise HTTPException(status_code=400, detail="File must be an audio upload.")

    suffix = Path(file.filename or "audio.wav").suffix or ".wav"

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            temp_path = temp_file.name
            while chunk := await file.read(1024 * 1024):
                temp_file.write(chunk)

        model = get_model()
        result = model.generate(
            input=temp_path,
            cache={},
            language="auto",
            use_itn=True,
            batch_size_s=60,
            merge_vad=True,
            merge_length_s=15,
        )
        text = normalize_result(result)

        return {
            "filename": file.filename,
            "text": text,
            "raw": result,
        }
    except RuntimeError as error:
        raise HTTPException(status_code=500, detail=str(error)) from error
    except Exception as error:  # pragma: no cover - surfaced through API
        raise HTTPException(status_code=500, detail=f"Transcription failed: {error}") from error
    finally:
        if "temp_path" in locals():
            try:
                os.remove(temp_path)
            except OSError:
                pass
