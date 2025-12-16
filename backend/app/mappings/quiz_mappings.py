"""Quiz answer to taste attribute mappings.

Maps frontend quiz question/answer combinations to declared taste attributes.
This is a deterministic, rule-based mapping (no AI).

Frontend Quiz Questions:
1. "What's your ideal Friday night?" - social/vibe preferences
2. "How adventurous are you with food?" - exploration style
3. "Pick your vibe:" - vibe preferences
4. "Your go-to cuisine?" - cuisine preferences
5. "Budget for a nice dinner?" - price tier
"""

from __future__ import annotations

from typing import TypedDict


class TasteAttributes(TypedDict, total=False):
    """Taste attributes extracted from a quiz answer."""

    vibes: list[str]
    social: str
    exploration: str
    cuisine: str
    price_tier: str


# Question ID to key mapping (matches frontend QUIZ_QUESTIONS)
QUESTION_KEYS: dict[int, str] = {
    1: "ideal_friday",
    2: "food_adventure",
    3: "vibe_preference",
    4: "cuisine_preference",
    5: "budget_preference",
}


# Answer ID to taste attributes mapping
# Each question maps answer IDs (a, b, c, d) to taste attributes
QUIZ_MAPPINGS: dict[str, dict[str, TasteAttributes]] = {
    # Question 1: "What's your ideal Friday night?"
    # Maps to: vibe preferences + social preference
    "ideal_friday": {
        "a": {  # Cozy dinner at a quiet spot
            "vibes": ["chill", "intimate"],
            "social": "small_group",
        },
        "b": {  # Lively bar with friends
            "vibes": ["social", "energetic"],
            "social": "big_group",
        },
        "c": {  # Trying a new trendy restaurant
            "vibes": ["trendy", "adventurous"],
            "exploration": "adventurous",
        },
        "d": {  # Cooking at home
            "vibes": ["chill", "homebody"],
            "social": "solo",
        },
    },
    # Question 2: "How adventurous are you with food?"
    # Maps to: exploration style
    "food_adventure": {
        "a": {"exploration": "routine"},  # I stick to what I know
        "b": {"exploration": "moderate"},  # Open to suggestions
        "c": {"exploration": "adventurous"},  # Love trying new things
        "d": {"exploration": "very_adventurous"},  # The weirder, the better
    },
    # Question 3: "Pick your vibe:"
    # Maps to: vibe preferences
    "vibe_preference": {
        "a": {"vibes": ["upscale", "elegant"]},  # Upscale & elegant
        "b": {"vibes": ["casual", "relaxed"]},  # Casual & relaxed
        "c": {"vibes": ["energetic", "fun"]},  # Energetic & fun
        "d": {"vibes": ["intimate", "romantic"]},  # Intimate & romantic
    },
    # Question 4: "Your go-to cuisine?"
    # Maps to: cuisine preference
    "cuisine_preference": {
        "a": {"cuisine": "italian"},  # Italian
        "b": {"cuisine": "asian"},  # Asian fusion
        "c": {"cuisine": "american"},  # American comfort
        "d": {"cuisine": "mediterranean"},  # Mediterranean
    },
    # Question 5: "Budget for a nice dinner?"
    # Maps to: price tier
    "budget_preference": {
        "a": {"price_tier": "budget"},  # Under $30
        "b": {"price_tier": "moderate"},  # $30-60
        "c": {"price_tier": "premium"},  # $60-100
        "d": {"price_tier": "luxury"},  # Sky's the limit
    },
}


def get_question_key(question_id: int) -> str | None:
    """Get the question key for a given question ID.

    Args:
        question_id: The numeric ID of the question (1-5)

    Returns:
        The question key string, or None if not found
    """
    return QUESTION_KEYS.get(question_id)


def get_answer_attributes(question_key: str, answer_id: str) -> TasteAttributes:
    """Get taste attributes for a specific answer.

    Args:
        question_key: The key identifying the question
        answer_id: The answer ID (a, b, c, or d)

    Returns:
        Dictionary of taste attributes for this answer
    """
    question_mapping = QUIZ_MAPPINGS.get(question_key, {})
    return question_mapping.get(answer_id, {})


# Valid exploration styles (for validation)
EXPLORATION_STYLES = ["routine", "moderate", "adventurous", "very_adventurous"]

# Valid social preferences (for validation)
SOCIAL_PREFERENCES = ["solo", "small_group", "big_group"]

# Valid price tiers (for validation)
PRICE_TIERS = ["budget", "moderate", "premium", "luxury"]

# All possible vibes (for validation and UI)
ALL_VIBES = [
    "chill",
    "intimate",
    "social",
    "energetic",
    "trendy",
    "adventurous",
    "homebody",
    "upscale",
    "elegant",
    "casual",
    "relaxed",
    "fun",
    "romantic",
]

# All supported cuisines
ALL_CUISINES = ["italian", "asian", "american", "mediterranean"]
