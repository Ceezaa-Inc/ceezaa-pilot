"""Tests for /api/taste/ring endpoint - TDD RED phase."""

import pytest
from unittest.mock import patch, MagicMock


class TestTasteRingEndpoint:
    """Test the taste ring visualization endpoint."""

    @pytest.fixture
    def mock_supabase(self):
        """Create mock Supabase client."""
        mock = MagicMock()
        return mock

    def test_ring_returns_segments_from_user_analysis(self, mock_supabase):
        """Ring endpoint should return segments derived from user_analysis."""
        # Mock user_analysis data
        mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = {
            "user_id": "test-user",
            "categories": {
                "coffee": {"count": 40, "total_spend": 200.00},
                "dining": {"count": 30, "total_spend": 450.00},
                "fast_food": {"count": 20, "total_spend": 100.00},
                "nightlife": {"count": 10, "total_spend": 150.00},
            },
            "total_transactions": 100,
        }

        from app.intelligence.ring_builder import RingBuilder

        builder = RingBuilder(mock_supabase)
        result = builder.build_ring("test-user")

        assert "segments" in result
        assert len(result["segments"]) == 4
        # Segments should be sorted by percentage descending
        assert result["segments"][0]["category"] == "coffee"
        assert result["segments"][0]["percentage"] == 40

    def test_ring_limits_to_max_5_segments(self, mock_supabase):
        """Ring should show at most 5 segments, combining rest into 'other'."""
        mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = {
            "user_id": "test-user",
            "categories": {
                "coffee": {"count": 25, "total_spend": 100},
                "dining": {"count": 20, "total_spend": 200},
                "fast_food": {"count": 15, "total_spend": 75},
                "nightlife": {"count": 15, "total_spend": 150},
                "entertainment": {"count": 10, "total_spend": 100},
                "fitness": {"count": 10, "total_spend": 50},
                "groceries": {"count": 5, "total_spend": 25},
            },
            "total_transactions": 100,
        }

        from app.intelligence.ring_builder import RingBuilder

        builder = RingBuilder(mock_supabase)
        result = builder.build_ring("test-user")

        assert len(result["segments"]) <= 5

    def test_ring_excludes_segments_below_minimum_percentage(self, mock_supabase):
        """Segments below 3% should be excluded or combined."""
        mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = {
            "user_id": "test-user",
            "categories": {
                "coffee": {"count": 90, "total_spend": 450},
                "dining": {"count": 8, "total_spend": 160},
                "fast_food": {"count": 2, "total_spend": 10},  # 2% - below threshold
            },
            "total_transactions": 100,
        }

        from app.intelligence.ring_builder import RingBuilder

        builder = RingBuilder(mock_supabase)
        result = builder.build_ring("test-user")

        # fast_food at 2% should be excluded or combined
        categories = [s["category"] for s in result["segments"]]
        assert "fast_food" not in categories or result["segments"][-1]["category"] == "other"

    def test_ring_includes_profile_title_and_tagline(self, mock_supabase):
        """Ring should include profile title and tagline."""
        mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = {
            "user_id": "test-user",
            "categories": {"coffee": {"count": 100, "total_spend": 500}},
            "total_transactions": 100,
        }

        # Mock declared_taste for profile title
        mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = {
            "exploration_style": "routine",
            "vibe_preferences": ["chill"],
        }

        from app.intelligence.ring_builder import RingBuilder

        builder = RingBuilder(mock_supabase)
        result = builder.build_ring("test-user")

        assert "profile_title" in result
        assert "tagline" in result

    def test_ring_assigns_correct_colors(self, mock_supabase):
        """Each category should have its designated color."""
        mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = {
            "user_id": "test-user",
            "categories": {
                "coffee": {"count": 50, "total_spend": 250},
                "dining": {"count": 50, "total_spend": 500},
            },
            "total_transactions": 100,
        }

        from app.intelligence.ring_builder import RingBuilder

        builder = RingBuilder(mock_supabase)
        result = builder.build_ring("test-user")

        for segment in result["segments"]:
            assert "color" in segment
            assert segment["color"].startswith("#")

    def test_ring_returns_empty_for_no_transactions(self, mock_supabase):
        """Ring should handle users with no transactions gracefully."""
        mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = None

        from app.intelligence.ring_builder import RingBuilder

        builder = RingBuilder(mock_supabase)
        result = builder.build_ring("test-user")

        assert result["segments"] == []
        assert result["profile_title"] is not None  # Should still have quiz-based title
