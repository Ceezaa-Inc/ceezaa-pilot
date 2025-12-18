"""Taste Intelligence Layer components.

This module provides rule-based taste processing:
- QuizProcessor: Convert quiz answers → declared taste
- ProfileTitleMapper: Map taste attributes → profile title & traits
- DNAGenerator: AI-powered taste DNA generation
"""

from app.intelligence.profile_titles import ProfileTitleMapper, TasteTrait
from app.intelligence.quiz_processor import DeclaredTaste, QuizAnswer, QuizProcessor
from app.intelligence.dna_generator import DNAGenerator, DNATrait

__all__ = [
    "QuizProcessor",
    "QuizAnswer",
    "DeclaredTaste",
    "ProfileTitleMapper",
    "TasteTrait",
    "DNAGenerator",
    "DNATrait",
]
