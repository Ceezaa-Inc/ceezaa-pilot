"""Taste Intelligence Layer components.

This module provides rule-based taste processing:
- QuizProcessor: Convert quiz answers → declared taste
- ProfileTitleMapper: Map taste attributes → profile title & traits
"""

from app.intelligence.profile_titles import ProfileTitleMapper, TasteTrait
from app.intelligence.quiz_processor import DeclaredTaste, QuizAnswer, QuizProcessor

__all__ = [
    "QuizProcessor",
    "QuizAnswer",
    "DeclaredTaste",
    "ProfileTitleMapper",
    "TasteTrait",
]
