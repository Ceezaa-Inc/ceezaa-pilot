"""InsightGenerator - AI-powered personalized insight generation.

Uses Claude Haiku with structured outputs to generate 2-3 personalized
insights based on user transaction data.
"""

from __future__ import annotations

from typing import Literal, Any

import anthropic
from pydantic import BaseModel


class Insight(BaseModel):
    """A single insight about the user's habits."""

    type: Literal["streak", "discovery", "pattern", "milestone"]
    title: str  # e.g., "Coffee Streak!"
    body: str  # 1-2 sentences
    emoji: str  # e.g., "☕"


class InsightsResponse(BaseModel):
    """Response from Claude containing insights."""

    insights: list[Insight]


# System prompt for insight generation (cached for efficiency)
SYSTEM_PROMPT = """You generate 2-3 personalized dining and lifestyle insights based on user transaction data.

## Rules
- Title: 2-4 words, punchy (e.g., "Coffee Streak!", "Explorer Mode")
- Body: 1 short sentence with specific numbers/names from data
- Tone: friendly, playful, celebrating their habits
- Focus on: streaks, discoveries, patterns, milestones
- Only use data that exists - never fabricate

## Insight Types
- streak: Consecutive day patterns
- discovery: New places explored
- pattern: Time/day preferences
- milestone: Transaction count achievements

## Examples

Input: Coffee category has 12 visits, 5-day streak at Starbucks
Output:
- type: "streak", title: "Coffee Streak!", body: "5 days straight at Starbucks ☕", emoji: "🔥"

Input: 8 unique restaurants out of 15 total dining visits
Output:
- type: "discovery", title: "Explorer Mode", body: "53% of your dining is new spots!", emoji: "🧭"

Input: 72% of transactions before noon
Output:
- type: "pattern", title: "Early Bird", body: "72% of visits happen before noon", emoji: "🌅"

Input: Total transactions = 50
Output:
- type: "milestone", title: "Fifty & Thriving", body: "You hit 50 transactions!", emoji: "🎯"

Return exactly 2-3 insights based on what's most interesting in the data."""

MAX_INSIGHTS = 3


class InsightGenerator:
    """Generates personalized insights using Claude API."""

    def __init__(self) -> None:
        """Initialize with Anthropic client."""
        self._client = anthropic.Anthropic()

    def generate(self, user_data: dict[str, Any]) -> list[Insight]:
        """Generate insights from user data.

        Args:
            user_data: User analysis data including categories, streaks,
                      exploration, time_buckets, top_merchants, etc.

        Returns:
            List of 2-3 Insight objects.
        """
        # Build the user message with data
        user_message = self._build_user_message(user_data)

        # Call Claude with structured outputs
        response = self._client.beta.messages.parse(
            model="claude-haiku-4-5",
            max_tokens=500,
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
            output_format=InsightsResponse,
        )

        # Extract and limit insights
        insights = response.parsed_output.insights
        return insights[:MAX_INSIGHTS]

    def _build_user_message(self, user_data: dict[str, Any]) -> str:
        """Build the user message containing the data to analyze.

        Args:
            user_data: User analysis data.

        Returns:
            Formatted message for Claude.
        """
        # Extract key stats for a cleaner prompt
        total_tx = user_data.get("total_transactions", 0)
        categories = user_data.get("categories", {})
        streaks = user_data.get("streaks", {})
        exploration = user_data.get("exploration", {})
        time_buckets = user_data.get("time_buckets", {})
        top_merchants = user_data.get("top_merchants", [])

        # Build a concise summary
        parts = [
            f"## User Data Summary",
            f"Total transactions: {total_tx}",
        ]

        # Categories
        if categories:
            parts.append("\n### Categories")
            for cat, data in categories.items():
                if isinstance(data, dict):
                    count = data.get("count", 0)
                    spend = data.get("total_spend", 0)
                    merchants = data.get("merchants", [])
                    merchant_str = ", ".join(merchants[:3]) if merchants else "none"
                    parts.append(f"- {cat}: {count} visits, ${spend:.0f} spent (at: {merchant_str})")

        # Streaks
        if streaks:
            parts.append("\n### Current Streaks")
            for cat, data in streaks.items():
                if isinstance(data, dict) and data.get("current", 0) > 0:
                    current = data.get("current", 0)
                    longest = data.get("longest", 0)
                    parts.append(f"- {cat}: {current} day streak (longest: {longest})")

        # Exploration
        if exploration:
            parts.append("\n### Exploration (unique vs total)")
            for cat, data in exploration.items():
                if isinstance(data, dict):
                    unique = data.get("unique", 0)
                    total = data.get("total", 0)
                    if total > 0:
                        ratio = unique / total
                        parts.append(f"- {cat}: {unique} unique out of {total} visits ({ratio:.0%} exploration)")

        # Time patterns
        if time_buckets:
            total_time = sum(time_buckets.values())
            if total_time > 0:
                parts.append("\n### Time Patterns")
                for bucket, count in time_buckets.items():
                    pct = (count / total_time) * 100
                    parts.append(f"- {bucket}: {count} ({pct:.0f}%)")

        # Top merchants
        if top_merchants:
            parts.append("\n### Top Spots")
            for merchant in top_merchants[:5]:
                name = merchant.get("merchant_name", "Unknown")
                count = merchant.get("count", 0)
                parts.append(f"- {name}: {count} visits")

        return "\n".join(parts)
