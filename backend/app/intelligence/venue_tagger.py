"""VenueTagger - AI-powered venue profile extraction.

Uses Claude Haiku with structured outputs to extract taste-based
venue profiles from Google Places data and reviews.
"""

from __future__ import annotations

from typing import Any

import anthropic
from pydantic import BaseModel


class VenueProfile(BaseModel):
    """AI-extracted venue profile for taste matching."""

    # Core categorization
    taste_cluster: str  # coffee, dining, nightlife, bakery
    cuisine_type: str | None  # indian, mexican, italian, etc. (null if not dining)

    # The verdict - 1 line combining vibe + energy
    tagline: str  # "Cozy Indian spot with generous portions"

    # Atmosphere
    energy: str  # chill, moderate, lively

    # Occasion matching (what's this place BEST for?) - max 3
    best_for: list[str]

    # Standout qualities - max 2
    standout: list[str]


SYSTEM_PROMPT = """You extract venue profiles for a taste-based restaurant discovery app.

## Output Schema
- taste_cluster: "coffee" | "dining" | "nightlife" | "bakery"
- cuisine_type: lowercase cuisine if dining (e.g., "indian"), null otherwise
- tagline: 1 punchy line (8-12 words) combining vibe + what it's known for
- energy: "chill" | "moderate" | "lively"
- best_for: max 3 from [date_night, group_celebration, solo_work, business_lunch, casual_hangout, late_night, family_outing, quick_bite]
- standout: max 2 from [hidden_gem, local_favorite, instagram_worthy, cult_following, cozy_vibes, upscale_feel]

## Tagline Examples
- "Cozy Indian spot with generous portions and friendly staff"
- "Buzzy gastropub for game day crowds and cold beers"
- "Chill neighborhood cafe perfect for laptop work"
- "Trendy Asian fusion with hidden gem vibes and killer ramen"
- "Lively sports bar with solid late-night bites"
- "Upscale Japanese for special occasions and date nights"

## Rules
- tagline should capture the ESSENCE - what would you tell a friend?
- best_for: pick occasions that ACTUALLY fit based on reviews
- standout: only include if there's clear evidence
- Be specific and opinionated, not generic
"""


class VenueTagger:
    """Tags venues using Claude Haiku with structured outputs."""

    def __init__(self) -> None:
        """Initialize with Anthropic client."""
        self._client = anthropic.Anthropic()

    def tag(self, venue_data: dict[str, Any]) -> VenueProfile:
        """Extract VenueProfile from venue data.

        Args:
            venue_data: Venue info including:
                - name: Venue name
                - category: Primary Google category
                - categories: List of categories
                - rating: Google rating
                - price: Price level string
                - reviews: List of review dicts with text and stars

        Returns:
            VenueProfile with extracted tags.
        """
        user_message = self._build_user_message(venue_data)

        response = self._client.beta.messages.parse(
            model="claude-haiku-4-5",
            max_tokens=300,
            betas=["structured-outputs-2025-11-13"],
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_message}],
            output_format=VenueProfile,
        )

        return response.parsed_output

    def tag_with_usage(
        self, venue_data: dict[str, Any]
    ) -> tuple[VenueProfile, dict[str, Any]]:
        """Tag venue and return usage stats for cost tracking.

        Args:
            venue_data: Same as tag().

        Returns:
            Tuple of (VenueProfile, usage_stats dict).
        """
        user_message = self._build_user_message(venue_data)

        response = self._client.beta.messages.parse(
            model="claude-haiku-4-5",
            max_tokens=300,
            betas=["structured-outputs-2025-11-13"],
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_message}],
            output_format=VenueProfile,
        )

        # Calculate costs (Haiku pricing: $1/M input, $5/M output)
        input_tokens = response.usage.input_tokens
        output_tokens = response.usage.output_tokens
        input_cost = input_tokens * 1 / 1_000_000
        output_cost = output_tokens * 5 / 1_000_000

        usage = {
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "input_cost": input_cost,
            "output_cost": output_cost,
            "total_cost": input_cost + output_cost,
        }

        return response.parsed_output, usage

    def _build_user_message(self, venue_data: dict[str, Any]) -> str:
        """Build user message from venue data.

        Args:
            venue_data: Venue data dict.

        Returns:
            Formatted message for Claude.
        """
        parts = ["## Venue Data"]
        parts.append(f"Name: {venue_data.get('name', 'Unknown')}")
        parts.append(f"Category: {venue_data.get('category', 'Unknown')}")

        categories = venue_data.get("categories", [])
        if categories:
            parts.append(f"Categories: {', '.join(categories[:5])}")

        rating = venue_data.get("rating")
        if rating:
            parts.append(f"Rating: {rating}")

        price = venue_data.get("price")
        if price:
            parts.append(f"Price: {price}")

        # Add reviews
        reviews = venue_data.get("reviews", [])
        if reviews:
            parts.append(f"\n## Reviews ({len(reviews)} samples)")
            for i, review in enumerate(reviews[:10], 1):
                text = review.get("text", "")[:300]
                stars = review.get("stars", "?")
                parts.append(f"\n{i}. [{stars}*] {text}")

        return "\n".join(parts)
