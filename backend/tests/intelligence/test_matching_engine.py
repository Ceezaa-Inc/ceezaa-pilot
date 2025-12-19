"""Tests for MatchingEngine - TDD approach.

Tests the venue matching algorithm that scores venues based on user taste profile.
"""

import pytest

from app.intelligence.matching_engine import MatchingEngine


class TestMatchingEngineScoring:
    """Tests for the core scoring algorithm."""

    @pytest.fixture
    def engine(self):
        """Create a MatchingEngine instance."""
        return MatchingEngine()

    @pytest.fixture
    def base_user_taste(self):
        """Base user taste profile for testing."""
        return {
            "categories": {"dining": 40, "coffee": 35, "nightlife": 25},
            "top_cuisines": ["italian", "asian", "mexican"],
            "vibes": ["chill", "intimate", "social"],
            "price_tier": "moderate",
            "exploration_style": "adventurous",
        }

    @pytest.fixture
    def base_venue(self):
        """Base venue profile for testing."""
        return {
            "id": "venue-123",
            "name": "Test Venue",
            "taste_cluster": "dining",
            "cuisine_type": "italian",
            "energy": "moderate",
            "price_tier": "$$",
            "best_for": ["date_night", "casual_hangout"],
            "standout": ["hidden_gem"],
        }

    # Category Affinity Tests (25% weight)
    def test_high_category_affinity_scores_well(self, engine, base_user_taste, base_venue):
        """User who spends 40% on dining should score high for dining venue."""
        result = engine.score(base_user_taste, base_venue)
        # 40% category = 0.4 * 0.25 = 0.10 contribution
        assert result.scores["category"] == pytest.approx(0.4, rel=0.01)

    def test_zero_category_affinity_scores_zero(self, engine, base_user_taste, base_venue):
        """User with no transactions in category should score 0."""
        base_venue["taste_cluster"] = "bakery"  # Not in user's categories
        result = engine.score(base_user_taste, base_venue)
        assert result.scores["category"] == 0.0

    # Cuisine Match Tests (25% weight)
    def test_top_cuisine_match_scores_full(self, engine, base_user_taste, base_venue):
        """User's #1 cuisine should score 1.0."""
        result = engine.score(base_user_taste, base_venue)
        assert result.scores["cuisine"] == 1.0

    def test_second_cuisine_match_scores_partial(self, engine, base_user_taste, base_venue):
        """User's #2 cuisine should score 0.85."""
        base_venue["cuisine_type"] = "asian"
        result = engine.score(base_user_taste, base_venue)
        assert result.scores["cuisine"] == pytest.approx(0.85, rel=0.01)

    def test_third_cuisine_match_scores_lower(self, engine, base_user_taste, base_venue):
        """User's #3 cuisine should score 0.70."""
        base_venue["cuisine_type"] = "mexican"
        result = engine.score(base_user_taste, base_venue)
        assert result.scores["cuisine"] == pytest.approx(0.70, rel=0.01)

    def test_no_cuisine_match_scores_zero(self, engine, base_user_taste, base_venue):
        """Cuisine not in user's preferences should score 0."""
        base_venue["cuisine_type"] = "french"
        result = engine.score(base_user_taste, base_venue)
        assert result.scores["cuisine"] == 0.0

    def test_null_cuisine_scores_zero(self, engine, base_user_taste, base_venue):
        """Venue with no cuisine_type should score 0."""
        base_venue["cuisine_type"] = None
        result = engine.score(base_user_taste, base_venue)
        assert result.scores["cuisine"] == 0.0

    # Price Match Tests (20% weight)
    def test_exact_price_match_scores_full(self, engine, base_user_taste, base_venue):
        """Exact price tier match should score 1.0."""
        # User: moderate, Venue: $$ (maps to moderate)
        result = engine.score(base_user_taste, base_venue)
        assert result.scores["price"] == 1.0

    def test_one_tier_difference_scores_half(self, engine, base_user_taste, base_venue):
        """One tier difference should score 0.5."""
        base_venue["price_tier"] = "$$$"  # premium vs moderate
        result = engine.score(base_user_taste, base_venue)
        assert result.scores["price"] == 0.5

    def test_two_tier_difference_scores_zero(self, engine, base_user_taste, base_venue):
        """Two tier difference should score 0."""
        base_venue["price_tier"] = "$$$$"  # luxury vs moderate
        result = engine.score(base_user_taste, base_venue)
        assert result.scores["price"] == 0.0

    def test_budget_user_vs_luxury_venue_scores_zero(self, engine, base_user_taste, base_venue):
        """Budget user at luxury venue should score 0."""
        base_user_taste["price_tier"] = "budget"
        base_venue["price_tier"] = "$$$$"
        result = engine.score(base_user_taste, base_venue)
        assert result.scores["price"] == 0.0

    # Energy/Vibe Match Tests (15% weight)
    def test_matching_vibes_score_well(self, engine, base_user_taste, base_venue):
        """User with chill/intimate vibes should match chill energy."""
        base_venue["energy"] = "chill"
        result = engine.score(base_user_taste, base_venue)
        assert result.scores["energy"] >= 0.5

    def test_social_user_matches_lively_venue(self, engine, base_user_taste, base_venue):
        """User with social vibe should match lively energy."""
        base_venue["energy"] = "lively"
        result = engine.score(base_user_taste, base_venue)
        # "social" is in lively's compatible vibes
        assert result.scores["energy"] >= 0.5

    def test_no_vibe_overlap_scores_zero(self, engine, base_user_taste, base_venue):
        """User with no matching vibes should score 0."""
        base_user_taste["vibes"] = ["upscale", "elegant"]  # Not in chill/moderate/lively
        base_venue["energy"] = "lively"
        result = engine.score(base_user_taste, base_venue)
        assert result.scores["energy"] == 0.0

    # Exploration Bonus Tests (15% weight)
    def test_adventurous_user_gets_hidden_gem_bonus(self, engine, base_user_taste, base_venue):
        """Adventurous user should get bonus for hidden_gem."""
        result = engine.score(base_user_taste, base_venue)
        assert result.scores["exploration"] == 1.0

    def test_adventurous_user_gets_cult_following_bonus(self, engine, base_user_taste, base_venue):
        """Adventurous user should get partial bonus for cult_following."""
        base_venue["standout"] = ["cult_following"]
        result = engine.score(base_user_taste, base_venue)
        assert result.scores["exploration"] == pytest.approx(0.7, rel=0.01)

    def test_routine_user_gets_no_exploration_bonus(self, engine, base_user_taste, base_venue):
        """Routine user should not get exploration bonus."""
        base_user_taste["exploration_style"] = "routine"
        result = engine.score(base_user_taste, base_venue)
        assert result.scores["exploration"] == 0.0

    def test_no_standout_gives_no_bonus(self, engine, base_user_taste, base_venue):
        """Venue without hidden_gem/cult_following gives no bonus."""
        base_venue["standout"] = ["cozy_vibes"]
        result = engine.score(base_user_taste, base_venue)
        assert result.scores["exploration"] == 0.0

    # Overall Score Tests
    def test_perfect_match_scores_high(self, engine, base_user_taste, base_venue):
        """Perfect match should score above 80%."""
        # Setup: User loves dining (40%), italian (#1), moderate price, chill vibes, adventurous
        # Venue: dining, italian, $$, chill, hidden_gem
        base_venue["energy"] = "chill"
        result = engine.score(base_user_taste, base_venue)
        assert result.match_score >= 80

    def test_poor_match_scores_low(self, engine, base_user_taste, base_venue):
        """Poor match should score below 30%."""
        # Mismatch everything
        base_venue["taste_cluster"] = "bakery"  # 0% category
        base_venue["cuisine_type"] = "french"  # No match
        base_venue["price_tier"] = "$$$$"  # 2 tiers off
        base_venue["energy"] = "lively"
        base_user_taste["vibes"] = ["upscale"]  # No overlap
        base_user_taste["exploration_style"] = "routine"  # No bonus
        result = engine.score(base_user_taste, base_venue)
        assert result.match_score < 30

    def test_score_is_between_0_and_100(self, engine, base_user_taste, base_venue):
        """Match score should always be 0-100."""
        result = engine.score(base_user_taste, base_venue)
        assert 0 <= result.match_score <= 100


class TestMatchReasonsGeneration:
    """Tests for match reason generation."""

    @pytest.fixture
    def engine(self):
        return MatchingEngine()

    @pytest.fixture
    def high_scoring_result(self):
        """A high-scoring result with multiple reasons."""
        return {
            "scores": {
                "category": 0.4,
                "cuisine": 1.0,
                "price": 1.0,
                "energy": 0.5,
                "exploration": 1.0,
            },
            "venue": {
                "cuisine_type": "italian",
                "taste_cluster": "dining",
                "standout": ["hidden_gem"],
            },
        }

    def test_generates_cuisine_reason_when_high_score(self, engine, high_scoring_result):
        """Should include cuisine reason when score > 0.5."""
        reasons = engine.get_match_reasons(
            high_scoring_result["scores"],
            high_scoring_result["venue"],
        )
        assert any("italian" in r.lower() for r in reasons)

    def test_generates_price_reason_when_exact_match(self, engine, high_scoring_result):
        """Should include price reason when exact match."""
        reasons = engine.get_match_reasons(
            high_scoring_result["scores"],
            high_scoring_result["venue"],
        )
        assert any("price" in r.lower() for r in reasons)

    def test_generates_hidden_gem_reason(self, engine, high_scoring_result):
        """Should mention hidden gem for adventurous users."""
        reasons = engine.get_match_reasons(
            high_scoring_result["scores"],
            high_scoring_result["venue"],
        )
        assert any("hidden gem" in r.lower() for r in reasons)

    def test_returns_max_two_reasons(self, engine, high_scoring_result):
        """Should return at most 2 reasons."""
        reasons = engine.get_match_reasons(
            high_scoring_result["scores"],
            high_scoring_result["venue"],
        )
        assert len(reasons) <= 2

    def test_returns_empty_for_low_scores(self, engine):
        """Should return empty list for very low scores."""
        low_scores = {
            "category": 0.0,
            "cuisine": 0.0,
            "price": 0.0,
            "energy": 0.0,
            "exploration": 0.0,
        }
        venue = {"cuisine_type": None, "taste_cluster": "bakery", "standout": []}
        reasons = engine.get_match_reasons(low_scores, venue)
        assert len(reasons) == 0


class TestMoodFiltering:
    """Tests for mood-based filtering and boosting."""

    @pytest.fixture
    def engine(self):
        return MatchingEngine()

    def test_chill_mood_boosts_chill_venues(self, engine):
        """Chill mood should boost chill energy venues."""
        user_taste = {
            "categories": {"coffee": 30, "nightlife": 30},
            "top_cuisines": [],
            "vibes": ["chill", "relaxed"],
            "price_tier": "moderate",
            "exploration_style": "moderate",
        }
        chill_venue = {
            "id": "chill-1",
            "taste_cluster": "coffee",
            "cuisine_type": None,
            "energy": "chill",
            "price_tier": "$$",
            "best_for": ["solo_work", "casual_hangout"],
            "standout": ["cozy_vibes"],
        }
        lively_venue = {
            "id": "lively-1",
            "taste_cluster": "nightlife",
            "cuisine_type": None,
            "energy": "lively",
            "price_tier": "$$",
            "best_for": ["group_celebration"],
            "standout": [],
        }
        results = engine.apply_mood_filter(
            [chill_venue, lively_venue], "chill", user_taste
        )
        # Chill venue should be first with chill mood boost
        assert results[0]["venue"]["id"] == "chill-1"

    def test_energetic_mood_boosts_lively_venues(self, engine):
        """Energetic mood should boost lively energy venues."""
        # Use equal category affinities for fair comparison
        user_taste = {
            "categories": {"dining": 30, "nightlife": 30},
            "top_cuisines": [],
            "vibes": ["social"],
            "price_tier": "moderate",
            "exploration_style": "moderate",
        }
        chill_venue = {
            "id": "chill-1",
            "taste_cluster": "dining",
            "cuisine_type": None,
            "energy": "chill",
            "price_tier": "$$",
            "best_for": ["solo_work"],
            "standout": [],
        }
        lively_venue = {
            "id": "lively-1",
            "taste_cluster": "nightlife",
            "cuisine_type": None,
            "energy": "lively",
            "price_tier": "$$",
            "best_for": ["group_celebration", "late_night"],
            "standout": [],
        }
        results = engine.apply_mood_filter(
            [chill_venue, lively_venue], "energetic", user_taste
        )
        # Lively venue should be first with energetic mood
        assert results[0]["venue"]["id"] == "lively-1"

    def test_romantic_mood_boosts_date_night_venues(self, engine):
        """Romantic mood should boost date_night venues."""
        # Use balanced category affinities
        user_taste = {
            "categories": {"coffee": 30, "dining": 30},
            "top_cuisines": ["italian"],
            "vibes": ["chill", "romantic"],
            "price_tier": "moderate",
            "exploration_style": "moderate",
        }
        chill_venue = {
            "id": "chill-1",
            "taste_cluster": "coffee",
            "cuisine_type": None,
            "energy": "chill",
            "price_tier": "$$",
            "best_for": ["solo_work"],
            "standout": [],
        }
        romantic_venue = {
            "id": "romantic-1",
            "taste_cluster": "dining",
            "cuisine_type": "italian",
            "energy": "chill",
            "price_tier": "$$$",
            "best_for": ["date_night"],
            "standout": ["upscale_feel"],
        }
        results = engine.apply_mood_filter(
            [chill_venue, romantic_venue], "romantic", user_taste
        )
        # Romantic venue should be first (has date_night + upscale_feel standout)
        assert results[0]["venue"]["id"] == "romantic-1"

    def test_mood_boost_caps_at_99(self, engine):
        """Mood boost should not exceed 99%."""
        # Setup user with high affinity for coffee
        user_taste = {
            "categories": {"coffee": 100},
            "top_cuisines": [],
            "vibes": ["chill", "intimate", "cozy", "relaxed"],
            "price_tier": "moderate",
            "exploration_style": "adventurous",
        }
        # Perfect chill venue that matches everything
        chill_venue = {
            "id": "chill-1",
            "taste_cluster": "coffee",
            "cuisine_type": None,
            "energy": "chill",
            "price_tier": "$$",
            "best_for": ["solo_work", "casual_hangout"],
            "standout": ["cozy_vibes", "hidden_gem"],
        }
        results = engine.apply_mood_filter([chill_venue], "chill", user_taste)
        assert results[0]["match_score"] <= 99

    def test_adventurous_mood_boosts_hidden_gems(self, engine):
        """Adventurous mood should boost hidden_gem standout."""
        user_taste = {
            "categories": {"coffee": 40},
            "top_cuisines": [],
            "vibes": ["chill"],
            "price_tier": "moderate",
            "exploration_style": "adventurous",
        }
        cozy_venue = {
            "id": "cozy-1",
            "taste_cluster": "coffee",
            "cuisine_type": None,
            "energy": "chill",
            "price_tier": "$$",
            "best_for": ["solo_work"],
            "standout": ["cozy_vibes"],
        }
        hidden_gem_venue = {
            "id": "hidden-1",
            "taste_cluster": "coffee",
            "cuisine_type": None,
            "energy": "chill",
            "price_tier": "$$",
            "best_for": ["solo_work"],
            "standout": ["hidden_gem"],
        }
        results = engine.apply_mood_filter(
            [cozy_venue, hidden_gem_venue], "adventurous", user_taste
        )
        # Find scores for each venue
        hidden_gem_score = next(
            r["match_score"] for r in results if r["venue"]["id"] == "hidden-1"
        )
        cozy_score = next(
            r["match_score"] for r in results if r["venue"]["id"] == "cozy-1"
        )
        assert hidden_gem_score > cozy_score


class TestNewUserScoring:
    """Tests for scoring when user has no transaction data (quiz only)."""

    @pytest.fixture
    def engine(self):
        return MatchingEngine()

    @pytest.fixture
    def quiz_only_user(self):
        """User with only quiz data, no transactions."""
        return {
            "categories": {},  # No transaction data
            "top_cuisines": [],  # No observed cuisines
            "vibes": ["chill", "romantic"],
            "price_tier": "moderate",
            "exploration_style": "adventurous",
            "cuisine_preferences": ["italian", "asian"],  # From quiz Q4
        }

    @pytest.fixture
    def base_venue(self):
        return {
            "id": "venue-1",
            "name": "Italian Spot",
            "taste_cluster": "dining",
            "cuisine_type": "italian",
            "energy": "chill",
            "price_tier": "$$",
            "best_for": ["date_night"],
            "standout": ["hidden_gem"],
        }

    def test_new_user_uses_quiz_cuisine(self, engine, quiz_only_user, base_venue):
        """New user should match based on quiz cuisine preferences."""
        result = engine.score_new_user(quiz_only_user, base_venue)
        # Italian is in quiz preferences
        assert result.scores["cuisine"] == 1.0

    def test_new_user_skips_category_scoring(self, engine, quiz_only_user, base_venue):
        """New user should skip category scoring (no transaction data)."""
        result = engine.score_new_user(quiz_only_user, base_venue)
        # Category should not be in scores for new users
        assert "category" not in result.scores

    def test_new_user_uses_quiz_price(self, engine, quiz_only_user, base_venue):
        """New user should match based on quiz price tier."""
        result = engine.score_new_user(quiz_only_user, base_venue)
        # moderate user, $$ venue = exact match
        assert result.scores["price"] == 1.0

    def test_new_user_uses_quiz_vibes(self, engine, quiz_only_user, base_venue):
        """New user should match based on quiz vibe preferences."""
        result = engine.score_new_user(quiz_only_user, base_venue)
        # chill venue matches chill/romantic vibes
        assert result.scores["energy"] > 0

    def test_new_user_gets_exploration_bonus(self, engine, quiz_only_user, base_venue):
        """Adventurous new user should get hidden_gem bonus."""
        result = engine.score_new_user(quiz_only_user, base_venue)
        assert result.scores["exploration"] == 1.0

    def test_new_user_weights_are_rebalanced(self, engine, quiz_only_user, base_venue):
        """New user weights should sum to 1.0 without category."""
        result = engine.score_new_user(quiz_only_user, base_venue)
        # Weights should be: cuisine 35%, price 25%, energy 20%, exploration 20%
        # Perfect match: 0.35 + 0.25 + 0.20 + 0.20 = 1.0 = 100%
        # With good scores, should be high
        assert result.match_score >= 70
