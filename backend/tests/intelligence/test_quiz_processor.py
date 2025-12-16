"""Tests for QuizProcessor - processes quiz answers into declared taste.

TDD: Write tests first, then implement.
"""

from __future__ import annotations

import pytest

from app.intelligence.quiz_processor import QuizProcessor, QuizAnswer, DeclaredTaste


class TestQuizProcessor:
    """Test suite for QuizProcessor."""

    @pytest.fixture
    def processor(self) -> QuizProcessor:
        """Create a QuizProcessor instance."""
        return QuizProcessor()

    def test_process_extracts_vibes_from_ideal_friday(
        self, processor: QuizProcessor
    ) -> None:
        """Cozy dinner answer should extract chill and intimate vibes."""
        answers = [
            QuizAnswer(question_id=1, answer_id="a"),  # Cozy dinner at quiet spot
        ]
        result = processor.process(answers)

        assert "chill" in result.vibe_preferences
        assert "intimate" in result.vibe_preferences

    def test_process_extracts_social_preference(
        self, processor: QuizProcessor
    ) -> None:
        """Lively bar answer should extract big_group social preference."""
        answers = [
            QuizAnswer(question_id=1, answer_id="b"),  # Lively bar with friends
        ]
        result = processor.process(answers)

        assert result.social_preference == "big_group"

    def test_process_extracts_exploration_style(
        self, processor: QuizProcessor
    ) -> None:
        """Food adventure question should set exploration style."""
        answers = [
            QuizAnswer(question_id=2, answer_id="c"),  # Love trying new things
        ]
        result = processor.process(answers)

        assert result.exploration_style == "adventurous"

    def test_process_extracts_very_adventurous(
        self, processor: QuizProcessor
    ) -> None:
        """'The weirder the better' should set very_adventurous style."""
        answers = [
            QuizAnswer(question_id=2, answer_id="d"),  # The weirder, the better
        ]
        result = processor.process(answers)

        assert result.exploration_style == "very_adventurous"

    def test_process_extracts_vibe_preference(
        self, processor: QuizProcessor
    ) -> None:
        """Vibe question should add to vibe preferences."""
        answers = [
            QuizAnswer(question_id=3, answer_id="a"),  # Upscale & elegant
        ]
        result = processor.process(answers)

        assert "upscale" in result.vibe_preferences
        assert "elegant" in result.vibe_preferences

    def test_process_extracts_cuisine_preference(
        self, processor: QuizProcessor
    ) -> None:
        """Cuisine question should set cuisine preferences."""
        answers = [
            QuizAnswer(question_id=4, answer_id="b"),  # Asian fusion
        ]
        result = processor.process(answers)

        assert "asian" in result.cuisine_preferences

    def test_process_extracts_price_tier(
        self, processor: QuizProcessor
    ) -> None:
        """Budget question should set price tier."""
        answers = [
            QuizAnswer(question_id=5, answer_id="c"),  # $60-100
        ]
        result = processor.process(answers)

        assert result.price_tier == "premium"

    def test_process_full_quiz(self, processor: QuizProcessor) -> None:
        """Process a complete quiz with all 5 questions."""
        answers = [
            QuizAnswer(question_id=1, answer_id="c"),  # Trendy restaurant
            QuizAnswer(question_id=2, answer_id="c"),  # Love trying new things
            QuizAnswer(question_id=3, answer_id="c"),  # Energetic & fun
            QuizAnswer(question_id=4, answer_id="a"),  # Italian
            QuizAnswer(question_id=5, answer_id="b"),  # $30-60
        ]
        result = processor.process(answers)

        # Check vibes from Q1 and Q3
        assert "trendy" in result.vibe_preferences
        assert "adventurous" in result.vibe_preferences
        assert "energetic" in result.vibe_preferences
        assert "fun" in result.vibe_preferences

        # Check exploration from Q2
        assert result.exploration_style == "adventurous"

        # Check cuisine from Q4
        assert "italian" in result.cuisine_preferences

        # Check price tier from Q5
        assert result.price_tier == "moderate"

    def test_process_combines_vibes_from_multiple_questions(
        self, processor: QuizProcessor
    ) -> None:
        """Vibes from Q1 and Q3 should be combined."""
        answers = [
            QuizAnswer(question_id=1, answer_id="a"),  # chill, intimate
            QuizAnswer(question_id=3, answer_id="d"),  # intimate, romantic
        ]
        result = processor.process(answers)

        # Should have vibes from both questions (deduplicated)
        assert "chill" in result.vibe_preferences
        assert "intimate" in result.vibe_preferences
        assert "romantic" in result.vibe_preferences

    def test_process_empty_answers_returns_defaults(
        self, processor: QuizProcessor
    ) -> None:
        """Empty answers should return default/empty taste profile."""
        result = processor.process([])

        assert result.vibe_preferences == []
        assert result.cuisine_preferences == []
        assert result.exploration_style is None
        assert result.social_preference is None
        assert result.price_tier is None

    def test_process_ignores_invalid_question_ids(
        self, processor: QuizProcessor
    ) -> None:
        """Invalid question IDs should be ignored."""
        answers = [
            QuizAnswer(question_id=99, answer_id="a"),  # Invalid
            QuizAnswer(question_id=1, answer_id="a"),  # Valid
        ]
        result = processor.process(answers)

        # Should still process valid answer
        assert "chill" in result.vibe_preferences

    def test_process_ignores_invalid_answer_ids(
        self, processor: QuizProcessor
    ) -> None:
        """Invalid answer IDs should be ignored."""
        answers = [
            QuizAnswer(question_id=1, answer_id="z"),  # Invalid
        ]
        result = processor.process(answers)

        # Should return empty vibes for invalid answer
        assert result.vibe_preferences == []


class TestDeclaredTaste:
    """Test suite for DeclaredTaste data model."""

    def test_declared_taste_default_values(self) -> None:
        """DeclaredTaste should have sensible defaults."""
        taste = DeclaredTaste()

        assert taste.vibe_preferences == []
        assert taste.cuisine_preferences == []
        assert taste.dietary_restrictions == []
        assert taste.exploration_style is None
        assert taste.social_preference is None
        assert taste.coffee_preference is None
        assert taste.price_tier is None

    def test_declared_taste_with_values(self) -> None:
        """DeclaredTaste should accept all fields."""
        taste = DeclaredTaste(
            vibe_preferences=["trendy", "social"],
            cuisine_preferences=["italian", "asian"],
            dietary_restrictions=["vegetarian"],
            exploration_style="adventurous",
            social_preference="big_group",
            coffee_preference="third_wave",
            price_tier="premium",
        )

        assert taste.vibe_preferences == ["trendy", "social"]
        assert taste.cuisine_preferences == ["italian", "asian"]
        assert taste.dietary_restrictions == ["vegetarian"]
        assert taste.exploration_style == "adventurous"
        assert taste.social_preference == "big_group"
        assert taste.coffee_preference == "third_wave"
        assert taste.price_tier == "premium"
