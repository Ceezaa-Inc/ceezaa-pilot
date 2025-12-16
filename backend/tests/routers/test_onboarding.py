"""Tests for onboarding router - quiz submission endpoint.

TDD: Write tests first, then implement.
"""

from __future__ import annotations

from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient

from app.dependencies import get_supabase_client
from app.main import app


@pytest.fixture
def mock_supabase() -> MagicMock:
    """Create a mock Supabase client."""
    mock = MagicMock()
    # Mock successful upsert operations
    mock.table.return_value.upsert.return_value.execute.return_value = MagicMock(
        data=[{"id": "test-id"}]
    )
    return mock


@pytest.fixture
def client(mock_supabase: MagicMock) -> TestClient:
    """Create a test client with mocked Supabase."""
    # Override the dependency
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase
    yield TestClient(app)
    # Clean up
    app.dependency_overrides.clear()


class TestSubmitQuiz:
    """Test suite for POST /api/onboarding/quiz endpoint."""

    def test_submit_quiz_returns_profile_title(self, client: TestClient) -> None:
        """Submitting quiz should return profile title and tagline."""
        response = client.post(
            "/api/onboarding/quiz",
            json={
                "user_id": "test-user-123",
                "answers": [
                    {"question_id": 1, "answer_id": "c"},  # trendy restaurant
                    {"question_id": 2, "answer_id": "c"},  # adventurous
                    {"question_id": 3, "answer_id": "c"},  # energetic & fun
                    {"question_id": 4, "answer_id": "b"},  # asian
                    {"question_id": 5, "answer_id": "b"},  # moderate budget
                ],
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "profile_title" in data
        assert "profile_tagline" in data
        assert data["success"] is True

    def test_submit_quiz_adventurous_trendy_returns_trend_hunter(
        self, client: TestClient
    ) -> None:
        """Adventurous + trendy vibe should return Trend Hunter."""
        response = client.post(
            "/api/onboarding/quiz",
            json={
                "user_id": "test-user-123",
                "answers": [
                    {"question_id": 1, "answer_id": "c"},  # trendy restaurant -> trendy vibe
                    {"question_id": 2, "answer_id": "c"},  # adventurous
                    {"question_id": 3, "answer_id": "a"},  # upscale
                    {"question_id": 4, "answer_id": "a"},  # italian
                    {"question_id": 5, "answer_id": "c"},  # premium
                ],
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["profile_title"] == "Trend Hunter"

    def test_submit_quiz_routine_casual_returns_neighborhood_regular(
        self, client: TestClient
    ) -> None:
        """Routine + casual vibe should return Neighborhood Regular."""
        response = client.post(
            "/api/onboarding/quiz",
            json={
                "user_id": "test-user-123",
                "answers": [
                    {"question_id": 1, "answer_id": "d"},  # cooking at home -> chill, homebody
                    {"question_id": 2, "answer_id": "a"},  # routine
                    {"question_id": 3, "answer_id": "b"},  # casual & relaxed
                    {"question_id": 4, "answer_id": "c"},  # american
                    {"question_id": 5, "answer_id": "a"},  # budget
                ],
            },
        )

        assert response.status_code == 200
        data = response.json()
        # casual has higher priority than chill, so dominant vibe is casual
        assert data["profile_title"] == "Neighborhood Regular"

    def test_submit_quiz_validates_user_id(self, client: TestClient) -> None:
        """Should require user_id in request."""
        response = client.post(
            "/api/onboarding/quiz",
            json={
                "answers": [{"question_id": 1, "answer_id": "a"}],
            },
        )

        assert response.status_code == 422  # Validation error

    def test_submit_quiz_validates_answers(self, client: TestClient) -> None:
        """Should require answers in request."""
        response = client.post(
            "/api/onboarding/quiz",
            json={
                "user_id": "test-user-123",
            },
        )

        assert response.status_code == 422  # Validation error

    def test_submit_quiz_handles_empty_answers(self, client: TestClient) -> None:
        """Empty answers should return default profile."""
        response = client.post(
            "/api/onboarding/quiz",
            json={
                "user_id": "test-user-123",
                "answers": [],
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["profile_title"] == "Taste Explorer"

    def test_submit_quiz_saves_to_database(
        self, client: TestClient, mock_supabase: MagicMock
    ) -> None:
        """Should save quiz responses and declared taste to database."""
        response = client.post(
            "/api/onboarding/quiz",
            json={
                "user_id": "test-user-123",
                "answers": [
                    {"question_id": 1, "answer_id": "a"},
                    {"question_id": 2, "answer_id": "b"},
                ],
            },
        )

        assert response.status_code == 200
        # Verify database calls were made
        assert mock_supabase.table.called


class TestQuizAnswerValidation:
    """Test suite for quiz answer validation."""

    def test_answer_requires_question_id(self, client: TestClient) -> None:
        """Each answer should have question_id."""
        response = client.post(
            "/api/onboarding/quiz",
            json={
                "user_id": "test-user-123",
                "answers": [{"answer_id": "a"}],
            },
        )

        assert response.status_code == 422

    def test_answer_requires_answer_id(self, client: TestClient) -> None:
        """Each answer should have answer_id."""
        response = client.post(
            "/api/onboarding/quiz",
            json={
                "user_id": "test-user-123",
                "answers": [{"question_id": 1}],
            },
        )

        assert response.status_code == 422
