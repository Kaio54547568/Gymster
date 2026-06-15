# Tài liệu Kiểm thử Speech Service với Pytest

Tài liệu này hướng dẫn chi tiết cách cấu hình, cách viết kịch bản kiểm thử (Test Cases), và cách chạy bộ kiểm thử tự động cho **Speech Service** của dự án **Gymster**.

---

## 1. Tổng quan kiến trúc kiểm thử

Dịch vụ Speech-to-Text được viết bằng Python (FastAPI). Để kiểm thử thành phần này, chúng ta sử dụng:
*   **Pytest**: Framework kiểm thử tiêu chuẩn và mạnh mẽ nhất cho Python.
*   **FastAPI TestClient** (httpx): Hỗ trợ gửi các request HTTP giả lập tới ứng dụng FastAPI mà không cần khởi động thực tế cổng server `8000` trên hệ điều hành.

### Cơ chế cô lập mô hình Trí tuệ nhân tạo (AI Mocking)

Mô hình AI nhận diện giọng nói `SenseVoiceSmall` từ `funasr` rất nặng (yêu cầu tải xuống hàng trăm Megabytes/Gigabytes từ Hugging Face) và tốn tài nguyên tính toán (CPU/GPU). 

Để bộ kiểm thử hoạt động độc lập và nhanh chóng, chúng ta sử dụng thư viện `unittest.mock` đi kèm Python để giả lập:
*   `huggingface_hub.snapshot_download`: Trả về một đường dẫn ảo thay vì tải mô hình thật.
*   `funasr.AutoModel`: Trả về đối tượng mô hình giả lập.
*   `model.generate()`: Trả về kết quả chuyển đổi giọng nói dạng văn bản mong muốn mà không thực hiện phân tích âm thanh thực tế.

---

## 2. Các thay đổi và thiết lập môi trường

1.  **Cài đặt các gói phụ thuộc bổ sung**:
    Đã thêm `pytest` và `httpx` vào [requirements.txt](file:///c:/Users/ADMIN/Desktop/CODES/Gymster/speech_service/requirements.txt).
2.  **Khởi tạo môi trường ảo `.venv`**:
    Tạo môi trường Python độc lập tại thư mục `speech_service/.venv/` để cô lập các package.
3.  **Thêm script chạy nhanh trong package.json**:
    Bổ sung lệnh chạy kiểm thử vào gốc dự án tại [package.json](file:///c:/Users/ADMIN/Desktop/CODES/Gymster/package.json):
    ```json
    "test:speech": "speech_service\\.venv\\Scripts\\pytest speech_service/tests"
    ```

---

## 3. Cách chạy kiểm thử

Tại gốc thư mục của dự án (Gymster), chạy lệnh sau trên terminal của bạn:
```bash
npm run test:speech
```

Kết quả hiển thị thành công:
```bash
============================= test session starts =============================
platform win32 -- Python 3.10.11, pytest-9.1.0, pluggy-1.6.0
collected 9 items

speech_service\tests\test_app.py .........                               [100%]
======================== 9 passed, 1 warning in 16.61s ========================
```

---

## 4. Chi tiết các Test Case đã viết

Mã nguồn kiểm thử nằm tại [speech_service/tests/test_app.py](file:///c:/Users/ADMIN/Desktop/CODES/Gymster/speech_service/tests/test_app.py). Dưới đây là phân tích cấu trúc:

### A. Kiểm thử các hàm bổ trợ (Helper Functions)
Kiểm tra các hàm làm sạch văn bản và chuẩn hóa kết quả đầu ra:
```python
from app import clean_text, normalize_result

def test_clean_text():
    # Loại bỏ khoảng trắng thừa và thẻ nhãn đặc biệt dạng <|tag|>
    assert clean_text("  hello   world  ") == "hello world"
    assert clean_text("<|speech|> hello <|music|>") == "hello"
```

### B. Kiểm thử Endpoint GET `/health`
```python
def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
```

### C. Kiểm thử Mocking Endpoint `/transcribe`
Sử dụng decorator `@patch` từ `unittest.mock` để ghi đè hàm `get_model` trong file `app.py`. Khi đó, hàm `get_model` sẽ trả về một đối tượng mock thay vì khởi tạo mô hình thật:
```python
from unittest.mock import MagicMock, patch

@patch("app.get_model")
def test_transcribe_success(mock_get_model):
    # Thiết lập mock model trả về kết quả giả lập
    mock_model = MagicMock()
    mock_model.generate.return_value = [{"text": "hello from gymster voice command"}]
    mock_get_model.return_value = mock_model
    
    # Gửi request tải file âm thanh giả lập
    response = client.post(
        "/transcribe",
        files={"file": ("sample.wav", b"fake audio content", "audio/wav")}
    )
    
    assert response.status_code == 200
    assert response.json()["text"] == "hello from gymster voice command"
```

### D. Kiểm thử tính khởi tạo của Mô hình
```python
@patch("app.AutoModel")
@patch("app.resolve_model")
def test_get_model_initialization(mock_resolve, mock_automodel):
    # Reset biến toàn cục để buộc phải khởi tạo lại mô hình
    import app as app_module
    app_module._model = None
    
    app_module.get_model()
    
    mock_resolve.assert_called_once()
    mock_automodel.assert_called_once()

---

## 5. Báo cáo Code Coverage (Độ bao phủ mã nguồn)

Đo lường mức độ phủ dòng lệnh (statement coverage) giúp đảm bảo toàn bộ mã nguồn FastAPI đã chạy ổn định dưới các kịch bản kiểm thử.

### Cách chạy báo cáo
1. Kích hoạt môi trường ảo Python:
   ```powershell
   cd speech_service
   .\.venv\Scripts\Activate.ps1
   ```
2. Chạy test kèm thu thập báo cáo coverage:
   ```bash
   pytest --cov=app tests/
   ```

### Kết quả đo lường thực tế của dịch vụ (`app.py`)
*   **Statements (Tổng số câu lệnh)**: 67
*   **Missed Statements (Câu lệnh bị bỏ sót)**: 9
*   **Coverage (Độ bao phủ)**: **87%**

> [!NOTE]
> Độ bao phủ đạt 87% là một tỷ lệ cực kỳ xuất sắc. Các phần chưa phủ (13%) chủ yếu nằm ở khối lệnh xử lý ngoại lệ (Exception Handling) và khởi tạo mô hình thực tế, vốn được thay thế bằng Mocking trong môi trường test để tối ưu hóa thời gian chạy.

![Báo cáo độ bao phủ mã nguồn](coverage_report.png)

