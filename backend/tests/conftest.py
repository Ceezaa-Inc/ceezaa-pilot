"""Pytest configuration and fixtures."""

from __future__ import annotations

from pathlib import Path

import pytest
from dotenv import load_dotenv
from fastapi.testclient import TestClient


# Load test environment before importing app modules
test_env_path = Path(__file__).parent.parent / ".env.test"
load_dotenv(test_env_path, override=True)

# Now import app modules after env is loaded
from app.config import get_settings
from app.dependencies import get_supabase_client
from app.main import app


@pytest.fixture(autouse=True)
def clear_caches() -> None:
    """Clear lru_cache before each test to ensure fresh settings."""
    get_settings.cache_clear()
    get_supabase_client.cache_clear()


@pytest.fixture
def client() -> TestClient:
    """Create a test client for the FastAPI app."""
    return TestClient(app)


@pytest.fixture
def base_url() -> str:
    """Base URL for API requests."""
    return "http://testserver"
