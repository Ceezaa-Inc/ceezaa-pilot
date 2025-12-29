"""Profile Title Mapper - Maps taste attributes to profile titles and traits.

Supports both rule-based lookups (fallback) and AI-generated titles
using Claude Haiku with daily caching.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import anthropic
from pydantic import BaseModel

from app.intelligence.quiz_processor import DeclaredTaste
from app.mappings.profile_title_mappings import (
    get_dominant_vibe,
    get_profile_title,
)


class ProfileTitleResponse(BaseModel):
    """Response from Claude containing profile title and tagline."""

    title: str  # 2-3 words max (e.g., "Urban Explorer")
    tagline: str  # 3-6 words (e.g., "Discovering hidden gems everywhere")


# System prompt for AI profile title generation
PROFILE_TITLE_PROMPT = """You generate a personalized profile title and tagline for a user based on their dining habits.

## Rules
- Title: 2-3 words, catchy and memorable (e.g., "Urban Explorer", "Cozy Connoisseur", "Night Owl")
- Tagline: 3-6 words, describes their dining personality
- Tone: celebratory, making them feel understood
- Base it on their actual spending patterns, not generic phrases

## Examples

Input: Coffee 45%, Dining 30%, Fast Food 15%. Adventurous explorer. Trendy vibes, group dining.
Output: title="Caffeine Adventurer", tagline="Exploring cafes with friends"

Input: Dining 60%, Coffee 25%. Routine explorer. Cozy vibes, solo dining, moderate prices.
Output: title="Solo Gourmand", tagline="Quality meals, your own pace"

Input: Fast Food 50%, Coffee 30%. Budget conscious, big groups, energetic vibes.
Output: title="Social Snacker", tagline="Good food, great company"

Input: Nightlife 40%, Dining 35%. Premium prices, trendy vibes, small groups.
Output: title="Night Sophisticate", tagline="Where evenings come alive"

Return a title and tagline that captures this person's unique dining personality."""


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


class AIProfileTitleGenerator:
    """Generates AI-powered profile titles using Claude Haiku with caching."""

    def __init__(self) -> None:
        """Initialize with Anthropic client."""
        self._client = anthropic.Anthropic()
        self._rule_mapper = ProfileTitleMapper()

    def generate(self, user_data: dict[str, Any]) -> tuple[str, str]:
        """Generate profile title and tagline from user data.

        Args:
            user_data: Combined quiz + transaction data including:
                - categories: spending breakdown (from observed taste)
                - exploration_style: from quiz
                - vibe_preferences: from quiz
                - social_preference: from quiz
                - price_tier: from quiz

        Returns:
            Tuple of (title, tagline)
        """
        try:
            user_prompt = self._build_prompt(user_data)

            response = self._client.messages.create(
                model="claude-haiku-4-20250514",
                max_tokens=100,
                system=PROFILE_TITLE_PROMPT,
                messages=[{"role": "user", "content": user_prompt}],
            )

            # Parse structured response
            result = self._client.messages.create(
                model="claude-haiku-4-20250514",
                max_tokens=100,
                system=PROFILE_TITLE_PROMPT,
                messages=[
                    {"role": "user", "content": user_prompt},
                    {"role": "assistant", "content": response.content[0].text},
                    {
                        "role": "user",
                        "content": "Now return this as JSON with 'title' and 'tagline' keys only.",
                    },
                ],
            )

            # Try to parse JSON from response
            import json

            text = result.content[0].text.strip()
            # Handle markdown code blocks
            if "```" in text:
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
                text = text.strip()

            data = json.loads(text)
            return data.get("title", "Taste Explorer"), data.get(
                "tagline", "Discovering your perfect spots"
            )

        except Exception:
            # Fallback to rule-based on any error
            return self._fallback_title(user_data)

    def _build_prompt(self, user_data: dict[str, Any]) -> str:
        """Build user prompt from user data."""
        parts = []

        # Category breakdown
        categories = user_data.get("categories", {})
        if categories:
            total = sum(c.get("count", 0) for c in categories.values())
            if total > 0:
                breakdown = []
                for name, data in sorted(
                    categories.items(),
                    key=lambda x: x[1].get("count", 0),
                    reverse=True,
                )[:4]:
                    pct = round(data.get("count", 0) / total * 100)
                    if pct > 0:
                        breakdown.append(f"{name} {pct}%")
                if breakdown:
                    parts.append(", ".join(breakdown))

        # Quiz data
        exploration = user_data.get("exploration_style")
        if exploration:
            parts.append(f"{exploration.replace('_', ' ')} explorer")

        vibes = user_data.get("vibe_preferences", [])
        if vibes:
            parts.append(f"{', '.join(vibes[:3])} vibes")

        social = user_data.get("social_preference")
        if social:
            parts.append(f"{social.replace('_', ' ')} dining")

        price = user_data.get("price_tier")
        if price:
            parts.append(f"{price} prices")

        return ". ".join(parts) if parts else "General food lover"

    def _fallback_title(self, user_data: dict[str, Any]) -> tuple[str, str]:
        """Fallback to rule-based title generation."""
        # Create a minimal DeclaredTaste for rule-based lookup
        declared = DeclaredTaste(
            exploration_style=user_data.get("exploration_style", "moderate"),
            vibe_preferences=user_data.get("vibe_preferences", []),
            price_tier=user_data.get("price_tier"),
            social_preference=user_data.get("social_preference"),
        )
        return self._rule_mapper.get_title(declared)
