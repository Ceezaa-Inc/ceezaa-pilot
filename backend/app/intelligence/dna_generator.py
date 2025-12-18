"""DNAGenerator - AI-powered personalized taste DNA generation.

Uses Claude Haiku with structured outputs to generate 4 personalized
DNA traits based on user quiz answers and transaction data.
"""

from __future__ import annotations

from typing import Any

import anthropic
from pydantic import BaseModel


class DNATrait(BaseModel):
    """A single DNA trait describing the user's taste personality."""

    name: str  # 1-2 words (e.g., "Night Owl")
    emoji: str  # Single emoji
    description: str  # 1 short sentence with data
    color: str  # Hex color code


class DNAResponse(BaseModel):
    """Response from Claude containing DNA traits."""

    traits: list[DNATrait]


# Color palette for DNA traits (diverse, vibrant)
DNA_COLORS = [
    "#14B8A6",  # Teal
    "#0EA5E9",  # Sky blue
    "#8B5CF6",  # Purple
    "#F59E0B",  # Amber
    "#EC4899",  # Pink
    "#10B981",  # Emerald
    "#F97316",  # Orange
    "#6366F1",  # Indigo
]

# System prompt for DNA generation (cached for efficiency)
SYSTEM_PROMPT = """You generate exactly 4 personalized "Taste DNA" traits that describe a user's dining personality based on their quiz answers and transaction data.

## Rules
- Generate EXACTLY 4 traits, no more, no less
- Name: 1-2 words, catchy and memorable (e.g., "Night Owl", "Trend Seeker")
- Description: 1 short sentence using specific data from the input
- Emoji: Single emoji that represents the trait
- Color: Pick from this palette: #14B8A6, #0EA5E9, #8B5CF6, #F59E0B, #EC4899, #10B981, #F97316, #6366F1
- Each trait should highlight a DIFFERENT aspect of their taste
- Be specific: use actual percentages, counts, or merchant names
- Tone: celebratory, making them feel understood

## Trait Categories to Consider
- Time patterns (morning person, night owl, weekend warrior)
- Spending patterns (coffee addict, dining devotee, nightlife lover)
- Exploration style (trend seeker, loyal regular, adventurer)
- Social style (solo diner, group organizer, date night pro)
- Vibe preferences (cozy homebody, energy seeker, sophisticate)

## Examples

Input: Coffee 45%, Dining 30%, Nightlife 15%. Adventurous explorer. Quiz: trendy vibes, group dining, premium prices.
Output:
- name: "Caffeine Devotee", emoji: "☕", description: "45% of your visits are coffee runs", color: "#F59E0B"
- name: "Night Explorer", emoji: "🌙", description: "15% of spending happens after dark", color: "#8B5CF6"
- name: "Trend Hunter", emoji: "✨", description: "Always first to discover new spots", color: "#EC4899"
- name: "Squad Leader", emoji: "👥", description: "Group dining is your love language", color: "#0EA5E9"

Input: Dining 60%, Coffee 25%. Routine explorer. Quiz: cozy vibes, solo dining, moderate prices. Top spot: Blue Bottle (12 visits).
Output:
- name: "Foodie First", emoji: "🍽️", description: "60% of your world revolves around dining", color: "#F97316"
- name: "Loyal Regular", emoji: "🏠", description: "12 visits to Blue Bottle - they know your order", color: "#14B8A6"
- name: "Solo Connoisseur", emoji: "🎯", description: "You savor meals on your own terms", color: "#6366F1"
- name: "Comfort Seeker", emoji: "🛋️", description: "Cozy vibes are your happy place", color: "#10B981"

Return exactly 4 traits that paint a unique picture of this person's taste identity."""

MAX_TRAITS = 4


class DNAGenerator:
    """Generates personalized DNA traits using Claude API."""

    def __init__(self) -> None:
        """Initialize with Anthropic client."""
        self._client = anthropic.Anthropic()

    def generate(self, user_data: dict[str, Any]) -> list[DNATrait]:
        """Generate DNA traits from user data.

        Args:
            user_data: Combined quiz + transaction data including:
                - categories: spending breakdown
                - exploration_style: from quiz
                - vibe_preferences: from quiz
                - social_preference: from quiz
                - price_tier: from quiz
                - top_merchants: frequent spots
                - time_buckets: when they go out

        Returns:
            List of exactly 4 DNATrait objects.
        """
        user_message = self._build_user_message(user_data)

        response = self._client.beta.messages.parse(
            model="claude-haiku-4-5",
            max_tokens=600,
            betas=["structured-outputs-2025-11-13"],
            system=[
                {
                    "type": "text",
                    "text": SYSTEM_PROMPT,
                    "cache_control": {"type": "ephemeral"},
                }
            ],
            messages=[
                {
                    "role": "user",
                    "content": user_message,
                }
            ],
            output_format=DNAResponse,
        )

        traits = response.parsed_output.traits
        return traits[:MAX_TRAITS]

    def _build_user_message(self, user_data: dict[str, Any]) -> str:
        """Build the user message containing data to analyze.

        Args:
            user_data: Combined user data.

        Returns:
            Formatted message for Claude.
        """
        parts = ["## User Data"]

        # Transaction data
        categories = user_data.get("categories", {})
        if categories:
            parts.append("\n### Spending Breakdown")
            total = sum(
                cat.get("count", 0) if isinstance(cat, dict) else 0
                for cat in categories.values()
            )
            for cat_name, cat_data in categories.items():
                if isinstance(cat_data, dict):
                    count = cat_data.get("count", 0)
                    pct = (count / total * 100) if total > 0 else 0
                    merchants = cat_data.get("merchants", [])[:2]
                    merchant_str = f" (at: {', '.join(merchants)})" if merchants else ""
                    parts.append(f"- {cat_name}: {pct:.0f}%{merchant_str}")

        # Top merchants
        top_merchants = user_data.get("top_merchants", [])
        if top_merchants:
            parts.append("\n### Top Spots")
            for m in top_merchants[:3]:
                name = m.get("merchant_name", "Unknown")
                count = m.get("count", 0)
                parts.append(f"- {name}: {count} visits")

        # Time patterns
        time_buckets = user_data.get("time_buckets", {})
        if time_buckets:
            total_time = sum(time_buckets.values())
            if total_time > 0:
                parts.append("\n### Time Patterns")
                for bucket, count in time_buckets.items():
                    pct = (count / total_time) * 100
                    parts.append(f"- {bucket}: {pct:.0f}%")

        # Quiz data (declared taste)
        parts.append("\n### From Quiz")

        exploration = user_data.get("exploration_style")
        if exploration:
            parts.append(f"- Exploration: {exploration}")

        vibes = user_data.get("vibe_preferences", [])
        if vibes:
            parts.append(f"- Vibes: {', '.join(vibes)}")

        social = user_data.get("social_preference")
        if social:
            parts.append(f"- Social: {social}")

        price = user_data.get("price_tier")
        if price:
            parts.append(f"- Price: {price}")

        return "\n".join(parts)
