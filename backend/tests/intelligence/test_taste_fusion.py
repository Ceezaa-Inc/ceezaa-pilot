"""Tests for TasteFusion - merging declared + observed taste."""

import pytest
from decimal import Decimal

from app.intelligence.taste_fusion import (
    TasteFusion,
    FusedTaste,
    CategoryScore,
)
from app.intelligence.quiz_processor import DeclaredTaste
from app.intelligence.aggregation_engine import UserAnalysis, CategoryStats


class TestTasteFusionWeighting:
    """Test the weighting algorithm based on transaction count."""

    def test_zero_transactions_full_quiz_weight(self):
        """With 0 transactions, quiz should be 100% weighted."""
        fusion = TasteFusion()

        declared = DeclaredTaste(
            vibe_preferences=["chill", "social"],
            cuisine_preferences=["japanese"],
            exploration_style="adventurous",
        )
        observed = UserAnalysis(user_id="test-user")
        observed.total_transactions = 0

        result = fusion.fuse(declared, observed)

        assert result.quiz_weight == 1.0
        assert result.tx_weight == 0.0

    def test_25_transactions_half_weight(self):
        """With 25 transactions, tx weight should be 0.5."""
        fusion = TasteFusion()

        declared = DeclaredTaste()
        observed = UserAnalysis(user_id="test-user")
        observed.total_transactions = 25

        result = fusion.fuse(declared, observed)

        assert result.tx_weight == 0.5
        assert result.quiz_weight == 0.5

    def test_50_transactions_max_weight(self):
        """With 50+ transactions, tx weight caps at 0.7."""
        fusion = TasteFusion()

        declared = DeclaredTaste()
        observed = UserAnalysis(user_id="test-user")
        observed.total_transactions = 50

        result = fusion.fuse(declared, observed)

        assert result.tx_weight == pytest.approx(0.7)
        assert result.quiz_weight == pytest.approx(0.3)

    def test_100_transactions_still_capped(self):
        """With 100+ transactions, tx weight is still capped at 0.7."""
        fusion = TasteFusion()

        declared = DeclaredTaste()
        observed = UserAnalysis(user_id="test-user")
        observed.total_transactions = 100

        result = fusion.fuse(declared, observed)

        assert result.tx_weight == pytest.approx(0.7)
        assert result.quiz_weight == pytest.approx(0.3)


class TestCategoryFusion:
    """Test category score calculation."""

    def test_category_from_transactions_only(self):
        """Categories should come from transaction data."""
        fusion = TasteFusion()

        declared = DeclaredTaste()
        observed = UserAnalysis(user_id="test-user")
        observed.total_transactions = 100
        observed.categories = {
            "coffee": CategoryStats(count=40, total_spend=Decimal("200")),
            "dining": CategoryStats(count=30, total_spend=Decimal("600")),
            "nightlife": CategoryStats(count=20, total_spend=Decimal("300")),
            "other": CategoryStats(count=10, total_spend=Decimal("100")),
        }

        result = fusion.fuse(declared, observed)

        # Categories should have percentages based on count
        assert len(result.categories) > 0
        coffee = next((c for c in result.categories if c.name == "coffee"), None)
        assert coffee is not None
        assert coffee.percentage == 40  # 40/100 = 40%

    def test_category_percentages_sum_to_100(self):
        """Category percentages should sum to 100."""
        fusion = TasteFusion()

        declared = DeclaredTaste()
        observed = UserAnalysis(user_id="test-user")
        observed.total_transactions = 50
        observed.categories = {
            "coffee": CategoryStats(count=25, total_spend=Decimal("100")),
            "dining": CategoryStats(count=15, total_spend=Decimal("300")),
            "other": CategoryStats(count=10, total_spend=Decimal("50")),
        }

        result = fusion.fuse(declared, observed)

        total = sum(c.percentage for c in result.categories)
        assert total == 100

    def test_empty_transactions_no_categories(self):
        """With no transactions, categories should be empty or default."""
        fusion = TasteFusion()

        declared = DeclaredTaste(
            cuisine_preferences=["japanese", "italian"],
        )
        observed = UserAnalysis(user_id="test-user")
        observed.total_transactions = 0

        result = fusion.fuse(declared, observed)

        # Should have empty or minimal categories
        assert len(result.categories) == 0 or all(c.percentage == 0 for c in result.categories)


class TestConfidenceScoring:
    """Test confidence calculation."""

    def test_zero_transactions_zero_confidence(self):
        """0 transactions should give 0 confidence."""
        fusion = TasteFusion()

        declared = DeclaredTaste()
        observed = UserAnalysis(user_id="test-user")
        observed.total_transactions = 0

        result = fusion.fuse(declared, observed)

        assert result.confidence == 0.0

    def test_10_transactions_low_confidence(self):
        """10 transactions should give ~0.19 confidence."""
        fusion = TasteFusion()

        declared = DeclaredTaste()
        observed = UserAnalysis(user_id="test-user")
        observed.total_transactions = 10

        result = fusion.fuse(declared, observed)

        assert 0.1 <= result.confidence <= 0.3

    def test_50_transactions_medium_confidence(self):
        """50 transactions should give ~0.55 confidence."""
        fusion = TasteFusion()

        declared = DeclaredTaste()
        observed = UserAnalysis(user_id="test-user")
        observed.total_transactions = 50

        result = fusion.fuse(declared, observed)

        assert 0.5 <= result.confidence <= 0.7

    def test_100_plus_transactions_full_confidence(self):
        """100+ transactions should give 1.0 confidence."""
        fusion = TasteFusion()

        declared = DeclaredTaste()
        observed = UserAnalysis(user_id="test-user")
        observed.total_transactions = 100

        result = fusion.fuse(declared, observed)

        assert result.confidence == 1.0


class TestVibePreservation:
    """Test that vibes from quiz are preserved."""

    def test_vibes_from_declared_taste(self):
        """Vibes should come from declared taste."""
        fusion = TasteFusion()

        declared = DeclaredTaste(
            vibe_preferences=["chill", "social", "trendy"],
        )
        observed = UserAnalysis(user_id="test-user")

        result = fusion.fuse(declared, observed)

        assert result.vibes == ["chill", "social", "trendy"]

    def test_empty_vibes_preserved(self):
        """Empty vibes should remain empty."""
        fusion = TasteFusion()

        declared = DeclaredTaste(vibe_preferences=[])
        observed = UserAnalysis(user_id="test-user")

        result = fusion.fuse(declared, observed)

        assert result.vibes == []


class TestExplorationRatio:
    """Test exploration ratio calculation."""

    def test_exploration_ratio_from_observed(self):
        """Exploration ratio should be calculated from unique merchants."""
        fusion = TasteFusion()

        declared = DeclaredTaste()
        observed = UserAnalysis(user_id="test-user")
        observed.total_transactions = 50
        # 10 unique merchants out of 50 transactions
        observed.merchant_visits = {
            "merchant1": 10,
            "merchant2": 8,
            "merchant3": 7,
            "merchant4": 6,
            "merchant5": 5,
            "merchant6": 4,
            "merchant7": 4,
            "merchant8": 3,
            "merchant9": 2,
            "merchant10": 1,
        }

        result = fusion.fuse(declared, observed)

        # 10 unique / 50 total = 0.2
        assert result.exploration_ratio == 0.2

    def test_zero_transactions_zero_exploration(self):
        """Zero transactions means zero exploration ratio."""
        fusion = TasteFusion()

        declared = DeclaredTaste()
        observed = UserAnalysis(user_id="test-user")
        observed.total_transactions = 0

        result = fusion.fuse(declared, observed)

        assert result.exploration_ratio == 0.0


class TestFusedTasteOutput:
    """Test the FusedTaste output structure."""

    def test_fused_taste_has_required_fields(self):
        """FusedTaste should have all required fields."""
        fusion = TasteFusion()

        declared = DeclaredTaste(
            vibe_preferences=["chill"],
            exploration_style="adventurous",
        )
        observed = UserAnalysis(user_id="test-user")
        observed.total_transactions = 30
        observed.categories = {
            "coffee": CategoryStats(count=20, total_spend=Decimal("100")),
            "dining": CategoryStats(count=10, total_spend=Decimal("200")),
        }

        result = fusion.fuse(declared, observed)

        assert hasattr(result, "categories")
        assert hasattr(result, "vibes")
        assert hasattr(result, "exploration_ratio")
        assert hasattr(result, "confidence")
        assert hasattr(result, "quiz_weight")
        assert hasattr(result, "tx_weight")

    def test_to_dict_serialization(self):
        """FusedTaste should serialize to dict for DB storage."""
        fusion = TasteFusion()

        declared = DeclaredTaste(vibe_preferences=["trendy"])
        observed = UserAnalysis(user_id="test-user")
        observed.total_transactions = 10
        observed.categories = {
            "coffee": CategoryStats(count=10, total_spend=Decimal("50")),
        }

        result = fusion.fuse(declared, observed)
        result_dict = result.to_dict()

        assert isinstance(result_dict, dict)
        assert "categories" in result_dict
        assert "vibes" in result_dict
        assert "confidence" in result_dict


class TestCategoryColors:
    """Test that categories have colors for ring display."""

    def test_categories_have_colors(self):
        """Each category should have an assigned color."""
        fusion = TasteFusion()

        declared = DeclaredTaste()
        observed = UserAnalysis(user_id="test-user")
        observed.total_transactions = 50
        observed.categories = {
            "coffee": CategoryStats(count=25, total_spend=Decimal("100")),
            "dining": CategoryStats(count=25, total_spend=Decimal("200")),
        }

        result = fusion.fuse(declared, observed)

        for cat in result.categories:
            assert cat.color is not None
            assert cat.color.startswith("#")
            assert len(cat.color) == 7  # #RRGGBB format
