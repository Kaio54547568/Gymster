# Gymster Speech-to-Text Service

Python FastAPI service using FunASR SenseVoiceSmall.

The service loads `FunAudioLLM/SenseVoiceSmall` through Hugging Face cache and
transcribes uploaded audio files.

## Start

From the repository root:

```powershell
npm run dev:speech
```

Or run the service directly:

```powershell
cd speech_service
.\.venv\Scripts\Activate.ps1
uvicorn app:app --host 127.0.0.1 --port 8000
```

## Endpoints

- `GET /health`
- `POST /transcribe` with multipart form field `file`

Example:

```powershell
Invoke-RestMethod -Uri http://127.0.0.1:8000/transcribe -Method Post -Form @{ file = Get-Item .\sample.wav }
```
