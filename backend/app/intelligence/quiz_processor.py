"""Quiz Processor - Converts quiz answers into declared taste profile.

This is a rule-based processor (no AI). Uses deterministic mappings
from quiz_mappings.py to extract taste attributes.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import NamedTuple

from app.mappings.quiz_mappings import (
    get_answer_attributes,
    get_question_key,
)


class QuizAnswer(NamedTuple):
    """A single quiz answer from the frontend."""

    question_id: int
    answer_id: str  # 'a', 'b', 'c', or 'd'


@dataclass
class DeclaredTaste:
    """Declared taste profile derived from quiz answers.

    Matches the declared_taste table schema in Supabase.
    """

    vibe_preferences: list[str] = field(default_factory=list)
    cuisine_preferences: list[str] = field(default_factory=list)
    dietary_restrictions: list[str] = field(default_factory=list)
    exploration_style: str | None = None
    social_preference: str | None = None
    coffee_preference: str | None = None
    price_tier: str | None = None


class QuizProcessor:
    """Processes quiz answers into a declared taste profile.

    Uses rule-based mappings to convert quiz responses into
    structured taste attributes. No AI involved.

    Example:
        processor = QuizProcessor()
        answers = [
            QuizAnswer(question_id=1, answer_id="a"),
            QuizAnswer(question_id=2, answer_id="c"),
            ...
        ]
        declared_taste = processor.process(answers)
    """

    def process(self, answers: list[QuizAnswer]) -> DeclaredTaste:
        """Process quiz answers into a declared taste profile.

        Args:
            answers: List of quiz answers from the frontend

        Returns:
            DeclaredTaste object with extracted preferences
        """
        taste = DeclaredTaste()

        # Collect all vibes (from multiple questions)
        all_vibes: list[str] = []

        for answer in answers:
            # Get the question key
            question_key = get_question_key(answer.question_id)
            if not question_key:
                continue  # Skip invalid question IDs

            # Get the taste attributes for this answer
            attributes = get_answer_attributes(question_key, answer.answer_id)
            if not attributes:
                continue  # Skip invalid answer IDs

            # Extract attributes based on what's present
            if "vibes" in attributes:
                all_vibes.extend(attributes["vibes"])

            if "social" in attributes:
                taste.social_preference = attributes["social"]

            if "exploration" in attributes:
                taste.exploration_style = attributes["exploration"]

            if "cuisine" in attributes:
                taste.cuisine_preferences.append(attributes["cuisine"])

            if "price_tier" in attributes:
                taste.price_tier = attributes["price_tier"]

        # Deduplicate vibes while preserving order
        taste.vibe_preferences = list(dict.fromkeys(all_vibes))

        return taste
