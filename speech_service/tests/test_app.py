import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient

# Import the app module
import sys
from pathlib import Path

# Add speech_service directory to sys.path so we can import app
sys.path.append(str(Path(__file__).parent.parent))
from app import app, normalize_result, clean_text

client = TestClient(app)

def test_clean_text():
    assert clean_text("  hello   world  ") == "hello world"
    assert clean_text("<|speech|> hello <|music|>") == "hello"
    assert clean_text(None) == ""

def test_normalize_result_list_of_dicts():
    result = [{"text": "hello"}, {"sentence": "world"}]
    assert normalize_result(result) == "hello world"

def test_normalize_result_list_of_strings():
    result = ["hello", "", "world"]
    assert normalize_result(result) == "hello world"

def test_normalize_result_single_dict():
    result = {"text": "test output"}
    assert normalize_result(result) == "test output"

def test_normalize_result_string():
    assert normalize_result("plain text") == "plain text"

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "model" in data
    assert "device" in data

def test_transcribe_invalid_content_type():
    response = client.post(
        "/transcribe",
        files={"file": ("test.txt", b"hello world", "text/plain")}
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "File must be an audio upload."

@patch("app.get_model")
def test_transcribe_success(mock_get_model):
    # Setup mock model
    mock_model = MagicMock()
    mock_model.generate.return_value = [{"text": "hello from gymster voice command"}]
    mock_get_model.return_value = mock_model
    
    # Send fake audio file
    response = client.post(
        "/transcribe",
        files={"file": ("sample.wav", b"fake audio content", "audio/wav")}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["filename"] == "sample.wav"
    assert data["text"] == "hello from gymster voice command"
    assert data["raw"] == [{"text": "hello from gymster voice command"}]
    
    # Verify mock model generate was called
    mock_model.generate.assert_called_once()

@patch("app.AutoModel")
@patch("app.resolve_model")
def test_get_model_initialization(mock_resolve, mock_automodel):
    import app as app_module
    
    # Reset global _model to force initialization
    app_module._model = None
    
    # Setup mock AutoModel
    mock_resolve.return_value = "/path/to/resolved/model"
    
    # Call get_model
    model = app_module.get_model()
    
    mock_resolve.assert_called_once_with(app_module.MODEL_NAME)
    mock_automodel.assert_called_once()
    assert model == mock_automodel.return_value
