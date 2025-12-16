"""Profile Title Mapper - Maps taste attributes to profile titles and traits.

This is a rule-based mapper (no AI). Uses deterministic lookups
from profile_title_mappings.py to generate titles and trait scores.
"""

from __future__ import annotations

from dataclasses import dataclass

from app.intelligence.quiz_processor import DeclaredTaste
from app.mappings.profile_title_mappings import (
    get_dominant_vibe,
    get_profile_title,
)


@dataclass
class TasteTrait:
    """A single taste trait with score and display info."""

    name: str
    emoji: str
    description: str
    score: int  # 0-100
    color: str  # Hex color code


class ProfileTitleMapper:
    """Maps declared taste to profile title and trait scores.

    Uses rule-based lookups for titles (no AI).
    Calculates trait scores from taste preferences.

    Example:
        mapper = ProfileTitleMapper()
        declared = DeclaredTaste(
            exploration_style="adventurous",
            vibe_preferences=["trendy", "social"]
        )
        title, tagline = mapper.get_title(declared)
        traits = mapper.calculate_traits(declared)
    """

    def get_title(self, declared: DeclaredTaste) -> tuple[str, str]:
        """Get profile title and tagline based on declared taste.

        Args:
            declared: User's declared taste from quiz

        Returns:
            Tuple of (title, tagline)
        """
        dominant_vibe = get_dominant_vibe(declared.vibe_preferences)
        return get_profile_title(declared.exploration_style, dominant_vibe)

    def calculate_traits(self, declared: DeclaredTaste) -> list[TasteTrait]:
        """Calculate trait scores from declared taste.

        Returns 4 traits: Adventurous, Social, Refined, Cozy

        Args:
            declared: User's declared taste from quiz

        Returns:
            List of 4 TasteTrait objects with calculated scores
        """
        return [
            TasteTrait(
                name="Adventurous",
                emoji="🌍",
                description="You love trying new cuisines",
                score=self._get_adventure_score(declared),
                color="#14B8A6",
            ),
            TasteTrait(
                name="Social",
                emoji="👥",
                description="Dining is a group activity",
                score=self._get_social_score(declared),
                color="#0EA5E9",
            ),
            TasteTrait(
                name="Refined",
                emoji="✨",
                description="Quality over quantity",
                score=self._get_refined_score(declared),
                color="#D3B481",
            ),
            TasteTrait(
                name="Cozy",
                emoji="🏠",
                description="Comfort food lover",
                score=self._get_cozy_score(declared),
                color="#F59E0B",
            ),
        ]

    def _get_adventure_score(self, declared: DeclaredTaste) -> int:
        """Calculate adventure score from exploration style and vibes."""
        base_score = {
            "routine": 30,
            "moderate": 55,
            "adventurous": 80,
            "very_adventurous": 95,
        }.get(declared.exploration_style or "", 50)

        # Bonus for adventurous vibes
        adventure_vibes = {"adventurous", "trendy", "energetic", "fun"}
        vibe_bonus = sum(
            5 for v in declared.vibe_preferences if v in adventure_vibes
        )

        return min(100, base_score + vibe_bonus)

    def _get_social_score(self, declared: DeclaredTaste) -> int:
        """Calculate social score from social preference and vibes."""
        # Base from social preference
        base_score = {
            "solo": 25,
            "small_group": 55,
            "big_group": 85,
        }.get(declared.social_preference or "", 50)

        # Bonus for social vibes
        social_vibes = {"social", "energetic", "fun", "lively"}
        vibe_bonus = sum(
            10 for v in declared.vibe_preferences if v in social_vibes
        )

        return min(100, base_score + vibe_bonus)

    def _get_refined_score(self, declared: DeclaredTaste) -> int:
        """Calculate refined score from price tier and vibes."""
        # Base from price tier
        base_score = {
            "budget": 30,
            "moderate": 50,
            "premium": 75,
            "luxury": 95,
        }.get(declared.price_tier or "", 50)

        # Bonus for refined vibes
        refined_vibes = {"upscale", "elegant", "romantic", "intimate"}
        vibe_bonus = sum(
            10 for v in declared.vibe_preferences if v in refined_vibes
        )

        return min(100, base_score + vibe_bonus)

    def _get_cozy_score(self, declared: DeclaredTaste) -> int:
        """Calculate cozy score from vibes and exploration style."""
        cozy_vibes = {"chill", "cozy", "intimate", "relaxed", "homebody"}
        vibe_score = sum(
            15 for v in declared.vibe_preferences if v in cozy_vibes
        )

        # Routine explorers tend to be cozier
        exploration_bonus = {
            "routine": 30,
            "moderate": 15,
            "adventurous": 0,
            "very_adventurous": 0,
        }.get(declared.exploration_style or "", 10)

        base_score = 30 + vibe_score + exploration_bonus
        return min(100, max(0, base_score))
