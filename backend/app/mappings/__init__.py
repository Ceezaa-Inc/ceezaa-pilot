"""Mapping configuration modules.

Contains rule-based mappings for:
- Plaid categories → taste categories
- Quiz answers → taste attributes
- Taste attributes → profile titles
"""

from app.mappings.plaid_categories import (
    PLAID_TO_TASTE_CATEGORY,
    TASTE_CATEGORIES,
    get_taste_category,
    is_food_related,
)
from app.mappings.profile_title_mappings import (
    DEFAULT_TITLE,
    PROFILE_TITLES,
    get_dominant_vibe,
    get_profile_title,
)
from app.mappings.quiz_mappings import (
    ALL_CUISINES,
    ALL_VIBES,
    EXPLORATION_STYLES,
    PRICE_TIERS,
    QUESTION_KEYS,
    QUIZ_MAPPINGS,
    SOCIAL_PREFERENCES,
    get_answer_attributes,
    get_question_key,
)

__all__ = [
    # Plaid mappings
    "PLAID_TO_TASTE_CATEGORY",
    "TASTE_CATEGORIES",
    "get_taste_category",
    "is_food_related",
    # Quiz mappings
    "QUESTION_KEYS",
    "QUIZ_MAPPINGS",
    "get_question_key",
    "get_answer_attributes",
    "EXPLORATION_STYLES",
    "SOCIAL_PREFERENCES",
    "PRICE_TIERS",
    "ALL_VIBES",
    "ALL_CUISINES",
    # Profile title mappings
    "PROFILE_TITLES",
    "DEFAULT_TITLE",
    "get_profile_title",
    "get_dominant_vibe",
]
