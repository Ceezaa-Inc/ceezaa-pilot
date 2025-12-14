"""Health check endpoint tests."""

from __future__ import annotations

from fastapi.testclient import TestClient

from app.config import get_settings


class TestHealthEndpoint:
    """Tests for the health check endpoint."""

    def test_health_returns_ok(self, client: TestClient) -> None:
        """Health endpoint should return status ok."""
        response = client.get("/health")

        assert response.status_code == 200
        assert response.json() == {"status": "ok"}

    def test_root_returns_app_info(self, client: TestClient) -> None:
        """Root endpoint should return app information from settings."""
        settings = get_settings()
        response = client.get("/")

        assert response.status_code == 200
        data = response.json()
        assert data["app"] == settings.app_name
        assert data["status"] == "running"
        assert "version" in data
