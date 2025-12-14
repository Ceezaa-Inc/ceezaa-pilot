# Ceezaa Backend

Taste Intelligence Layer - Python FastAPI backend for the Ceezaa MVP.

## Setup

1. **Install Poetry** (if not installed):
   ```bash
   curl -sSL https://install.python-poetry.org | python3 -
   ```

2. **Install dependencies**:
   ```bash
   cd backend
   poetry install
   ```

3. **Copy environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```

4. **Run the server**:
   ```bash
   poetry run uvicorn app.main:app --reload
   ```

5. **Run tests**:
   ```bash
   poetry run pytest
   ```

## Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI application
│   ├── config.py            # Settings
│   ├── dependencies.py      # DI
│   ├── routers/             # API endpoints
│   ├── services/            # External APIs (Plaid, Google, OpenAI)
│   ├── intelligence/        # Taste Intelligence Layer
│   └── models/              # Pydantic models
├── tests/
│   ├── exploration/         # Schema exploration tests
│   ├── unit/                # Unit tests
│   └── integration/         # API tests
└── supabase/
    └── migrations/          # Database migrations
```

## API Documentation

When running locally, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Testing

```bash
# Run all tests
poetry run pytest

# Run with coverage
poetry run pytest --cov=app

# Run specific test file
poetry run pytest tests/test_health.py

# Run exploration tests only
poetry run pytest -m exploration
```
