"""Tests for ProfileTitleMapper - maps taste attributes to profile titles.

TDD: Write tests first, then implement.
"""

from __future__ import annotations

import pytest

from app.intelligence.profile_titles import ProfileTitleMapper, TasteTrait
from app.intelligence.quiz_processor import DeclaredTaste


class TestProfileTitleMapper:
    """Test suite for ProfileTitleMapper."""

    @pytest.fixture
    def mapper(self) -> ProfileTitleMapper:
        """Create a ProfileTitleMapper instance."""
        return ProfileTitleMapper()

    def test_get_title_for_adventurous_trendy(
        self, mapper: ProfileTitleMapper
    ) -> None:
        """Adventurous + trendy should return 'Trend Hunter'."""
        declared = DeclaredTaste(
            exploration_style="adventurous",
            vibe_preferences=["trendy", "social"],
        )
        title, tagline = mapper.get_title(declared)

        assert title == "Trend Hunter"
        assert "next big thing" in tagline.lower()

    def test_get_title_for_adventurous_social(
        self, mapper: ProfileTitleMapper
    ) -> None:
        """Adventurous + social (as dominant vibe) should return 'Social Explorer'."""
        declared = DeclaredTaste(
            exploration_style="adventurous",
            vibe_preferences=["social"],  # Only social, so it's the dominant vibe
        )
        title, tagline = mapper.get_title(declared)

        assert title == "Social Explorer"

    def test_get_title_for_routine_chill(
        self, mapper: ProfileTitleMapper
    ) -> None:
        """Routine + chill should return 'Comfort Connoisseur'."""
        declared = DeclaredTaste(
            exploration_style="routine",
            vibe_preferences=["chill", "relaxed"],
        )
        title, tagline = mapper.get_title(declared)

        assert title == "Comfort Connoisseur"

    def test_get_title_for_very_adventurous(
        self, mapper: ProfileTitleMapper
    ) -> None:
        """Very adventurous should map to appropriate title."""
        declared = DeclaredTaste(
            exploration_style="very_adventurous",
            vibe_preferences=["energetic", "fun"],
        )
        title, tagline = mapper.get_title(declared)

        assert title == "Flavor Chaser"

    def test_get_title_returns_default_for_empty_preferences(
        self, mapper: ProfileTitleMapper
    ) -> None:
        """Empty preferences should return default title."""
        declared = DeclaredTaste()
        title, tagline = mapper.get_title(declared)

        assert title == "Taste Explorer"
        assert "discovering" in tagline.lower()

    def test_get_title_handles_moderate_exploration(
        self, mapper: ProfileTitleMapper
    ) -> None:
        """Moderate exploration should have its own titles."""
        declared = DeclaredTaste(
            exploration_style="moderate",
            vibe_preferences=["casual", "chill"],
        )
        title, tagline = mapper.get_title(declared)

        assert title == "Easy Going Eater"


class TestTraitCalculation:
    """Test suite for trait score calculation."""

    @pytest.fixture
    def mapper(self) -> ProfileTitleMapper:
        """Create a ProfileTitleMapper instance."""
        return ProfileTitleMapper()

    def test_calculate_traits_for_adventurous(
        self, mapper: ProfileTitleMapper
    ) -> None:
        """Adventurous exploration should give high adventure score."""
        declared = DeclaredTaste(
            exploration_style="adventurous",
            vibe_preferences=["trendy", "social"],
        )
        traits = mapper.calculate_traits(declared)

        adventure_trait = next(t for t in traits if t.name == "Adventurous")
        assert adventure_trait.score >= 70

    def test_calculate_traits_for_routine(
        self, mapper: ProfileTitleMapper
    ) -> None:
        """Routine exploration should give low adventure score."""
        declared = DeclaredTaste(
            exploration_style="routine",
            vibe_preferences=["chill"],
        )
        traits = mapper.calculate_traits(declared)

        adventure_trait = next(t for t in traits if t.name == "Adventurous")
        assert adventure_trait.score <= 40

    def test_calculate_traits_social_from_vibes(
        self, mapper: ProfileTitleMapper
    ) -> None:
        """Social vibes should give high social score."""
        declared = DeclaredTaste(
            exploration_style="moderate",
            vibe_preferences=["social", "energetic"],
            social_preference="big_group",
        )
        traits = mapper.calculate_traits(declared)

        social_trait = next(t for t in traits if t.name == "Social")
        assert social_trait.score >= 70

    def test_calculate_traits_refined_from_upscale(
        self, mapper: ProfileTitleMapper
    ) -> None:
        """Upscale vibes and premium price should give high refined score."""
        declared = DeclaredTaste(
            exploration_style="moderate",
            vibe_preferences=["upscale", "elegant"],
            price_tier="premium",
        )
        traits = mapper.calculate_traits(declared)

        refined_trait = next(t for t in traits if t.name == "Refined")
        assert refined_trait.score >= 70

    def test_calculate_traits_cozy_from_vibes(
        self, mapper: ProfileTitleMapper
    ) -> None:
        """Chill and intimate vibes should give high cozy score."""
        declared = DeclaredTaste(
            exploration_style="routine",
            vibe_preferences=["chill", "intimate", "cozy"],
        )
        traits = mapper.calculate_traits(declared)

        cozy_trait = next(t for t in traits if t.name == "Cozy")
        assert cozy_trait.score >= 60

    def test_calculate_traits_returns_four_traits(
        self, mapper: ProfileTitleMapper
    ) -> None:
        """Should always return exactly 4 traits."""
        declared = DeclaredTaste(
            exploration_style="adventurous",
            vibe_preferences=["trendy"],
        )
        traits = mapper.calculate_traits(declared)

        assert len(traits) == 4
        trait_names = {t.name for t in traits}
        assert trait_names == {"Adventurous", "Social", "Refined", "Cozy"}

    def test_calculate_traits_have_required_fields(
        self, mapper: ProfileTitleMapper
    ) -> None:
        """Each trait should have name, emoji, description, score, color."""
        declared = DeclaredTaste(exploration_style="moderate")
        traits = mapper.calculate_traits(declared)

        for trait in traits:
            assert trait.name
            assert trait.emoji
            assert trait.description
            assert 0 <= trait.score <= 100
            assert trait.color.startswith("#")


class TestTasteTrait:
    """Test suite for TasteTrait data model."""

    def test_taste_trait_creation(self) -> None:
        """TasteTrait should accept all required fields."""
        trait = TasteTrait(
            name="Adventurous",
            emoji="🌍",
            description="You love trying new cuisines",
            score=85,
            color="#14B8A6",
        )

        assert trait.name == "Adventurous"
        assert trait.emoji == "🌍"
        assert trait.description == "You love trying new cuisines"
        assert trait.score == 85
        assert trait.color == "#14B8A6"
