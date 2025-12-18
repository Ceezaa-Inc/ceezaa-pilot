"""Tests for InsightGenerator - AI-powered insight generation."""

import pytest
from unittest.mock import Mock, patch
from datetime import date

from app.intelligence.insight_generator import (
    InsightGenerator,
    Insight,
    InsightsResponse,
)


class TestInsightGenerator:
    """Test the InsightGenerator class."""

    @pytest.fixture
    def mock_anthropic_response(self):
        """Create a mock Anthropic API response."""
        return InsightsResponse(
            insights=[
                Insight(
                    type="streak",
                    title="Coffee Streak!",
                    body="You've had coffee 5 days in a row at Blue Bottle.",
                    emoji="☕",
                ),
                Insight(
                    type="discovery",
                    title="Explorer Mode",
                    body="You tried 3 new spots this week!",
                    emoji="🌟",
                ),
            ]
        )

    @pytest.fixture
    def sample_user_data(self):
        """Sample user analysis data for testing."""
        return {
            "total_transactions": 48,
            "categories": {
                "coffee": {"count": 20, "total_spend": 150.0, "merchants": ["Blue Bottle", "Starbucks"]},
                "dining": {"count": 15, "total_spend": 400.0, "merchants": ["Tartine", "State Bird"]},
                "fast_food": {"count": 8, "total_spend": 80.0, "merchants": ["In-N-Out"]},
            },
            "streaks": {
                "coffee": {"current": 5, "longest": 7, "last_date": "2024-12-16"},
            },
            "exploration": {
                "coffee": {"unique": 4, "total": 20},
                "dining": {"unique": 8, "total": 15},
            },
            "time_buckets": {
                "morning": 25,
                "afternoon": 12,
                "evening": 8,
                "night": 3,
            },
            "top_merchants": [
                {"merchant_name": "Blue Bottle", "count": 12},
                {"merchant_name": "Starbucks", "count": 8},
            ],
        }

    def test_generates_insights_from_user_data(self, mock_anthropic_response, sample_user_data):
        """InsightGenerator should generate insights from user data."""
        with patch("app.intelligence.insight_generator.anthropic") as mock_anthropic:
            # Set up mock
            mock_client = Mock()
            mock_anthropic.Anthropic.return_value = mock_client
            mock_client.beta.messages.parse.return_value = Mock(
                parsed_output=mock_anthropic_response
            )

            generator = InsightGenerator()
            insights = generator.generate(sample_user_data)

            assert len(insights) == 2
            assert insights[0].type == "streak"
            assert insights[0].title == "Coffee Streak!"

    def test_returns_list_of_insight_objects(self, mock_anthropic_response, sample_user_data):
        """Each insight should be an Insight object with required fields."""
        with patch("app.intelligence.insight_generator.anthropic") as mock_anthropic:
            mock_client = Mock()
            mock_anthropic.Anthropic.return_value = mock_client
            mock_client.beta.messages.parse.return_value = Mock(
                parsed_output=mock_anthropic_response
            )

            generator = InsightGenerator()
            insights = generator.generate(sample_user_data)

            for insight in insights:
                assert isinstance(insight, Insight)
                assert insight.type in ["streak", "discovery", "pattern", "milestone"]
                assert len(insight.title) > 0
                assert len(insight.body) > 0
                assert len(insight.emoji) > 0

    def test_limits_to_max_3_insights(self, sample_user_data):
        """Generator should return at most 3 insights."""
        four_insights = InsightsResponse(
            insights=[
                Insight(type="streak", title="T1", body="B1", emoji="1️⃣"),
                Insight(type="discovery", title="T2", body="B2", emoji="2️⃣"),
                Insight(type="pattern", title="T3", body="B3", emoji="3️⃣"),
                Insight(type="milestone", title="T4", body="B4", emoji="4️⃣"),
            ]
        )

        with patch("app.intelligence.insight_generator.anthropic") as mock_anthropic:
            mock_client = Mock()
            mock_anthropic.Anthropic.return_value = mock_client
            mock_client.beta.messages.parse.return_value = Mock(
                parsed_output=four_insights
            )

            generator = InsightGenerator()
            insights = generator.generate(sample_user_data)

            # Should be limited to 3 max
            assert len(insights) <= 3

    def test_uses_structured_outputs_beta(self, sample_user_data):
        """Generator should use Anthropic's structured outputs beta."""
        with patch("app.intelligence.insight_generator.anthropic") as mock_anthropic:
            mock_client = Mock()
            mock_anthropic.Anthropic.return_value = mock_client
            mock_response = InsightsResponse(
                insights=[Insight(type="streak", title="T", body="B", emoji="🎯")]
            )
            mock_client.beta.messages.parse.return_value = Mock(
                parsed_output=mock_response
            )

            generator = InsightGenerator()
            generator.generate(sample_user_data)

            # Verify beta.messages.parse was called
            mock_client.beta.messages.parse.assert_called_once()
            call_kwargs = mock_client.beta.messages.parse.call_args.kwargs

            # Should include structured outputs beta
            assert "betas" in call_kwargs
            assert "structured-outputs-2025-11-13" in call_kwargs["betas"]

    def test_uses_haiku_model(self, sample_user_data):
        """Generator should use Claude Haiku for cost efficiency."""
        with patch("app.intelligence.insight_generator.anthropic") as mock_anthropic:
            mock_client = Mock()
            mock_anthropic.Anthropic.return_value = mock_client
            mock_response = InsightsResponse(
                insights=[Insight(type="streak", title="T", body="B", emoji="🎯")]
            )
            mock_client.beta.messages.parse.return_value = Mock(
                parsed_output=mock_response
            )

            generator = InsightGenerator()
            generator.generate(sample_user_data)

            call_kwargs = mock_client.beta.messages.parse.call_args.kwargs
            assert "claude-haiku" in call_kwargs["model"]

    def test_includes_user_data_in_prompt(self, sample_user_data):
        """User data should be included in the prompt."""
        with patch("app.intelligence.insight_generator.anthropic") as mock_anthropic:
            mock_client = Mock()
            mock_anthropic.Anthropic.return_value = mock_client
            mock_response = InsightsResponse(
                insights=[Insight(type="streak", title="T", body="B", emoji="🎯")]
            )
            mock_client.beta.messages.parse.return_value = Mock(
                parsed_output=mock_response
            )

            generator = InsightGenerator()
            generator.generate(sample_user_data)

            call_kwargs = mock_client.beta.messages.parse.call_args.kwargs
            messages = call_kwargs["messages"]

            # User data should be in the message content
            user_message = messages[0]["content"]
            assert "48" in user_message  # total_transactions
            assert "Blue Bottle" in user_message  # merchant name

    def test_handles_empty_user_data(self):
        """Generator should handle users with no transaction data gracefully."""
        empty_data = {
            "total_transactions": 0,
            "categories": {},
            "streaks": {},
            "exploration": {},
            "time_buckets": {},
            "top_merchants": [],
        }

        with patch("app.intelligence.insight_generator.anthropic") as mock_anthropic:
            mock_client = Mock()
            mock_anthropic.Anthropic.return_value = mock_client
            mock_response = InsightsResponse(
                insights=[
                    Insight(
                        type="discovery",
                        title="Getting Started",
                        body="Link your card to start tracking your taste!",
                        emoji="🚀",
                    )
                ]
            )
            mock_client.beta.messages.parse.return_value = Mock(
                parsed_output=mock_response
            )

            generator = InsightGenerator()
            insights = generator.generate(empty_data)

            # Should still return something (starter insight)
            assert len(insights) >= 1


class TestInsightModel:
    """Test the Insight Pydantic model."""

    def test_insight_valid_types(self):
        """Insight type should be one of the allowed values."""
        valid_types = ["streak", "discovery", "pattern", "milestone"]

        for insight_type in valid_types:
            insight = Insight(
                type=insight_type,
                title="Test",
                body="Test body",
                emoji="🎯",
            )
            assert insight.type == insight_type

    def test_insight_requires_all_fields(self):
        """Insight should require type, title, body, and emoji."""
        with pytest.raises(Exception):  # Pydantic validation error
            Insight(type="streak", title="Test")  # Missing body and emoji
