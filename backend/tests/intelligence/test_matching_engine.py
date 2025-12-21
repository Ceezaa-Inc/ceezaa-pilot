"""Tests for MatchingEngine - Simplified 3-Component Model.

Tests the venue matching algorithm that scores venues based on user taste profile
using 3 components: Affinity (40%), Match (30%), Compatibility (30%).
"""

import pytest

from app.intelligence.matching_engine import MatchingEngine


class TestDiningVenueScoring:
    """Tests for dining venues (have cuisine_type)."""

    @pytest.fixture
    def engine(self):
        return MatchingEngine()

    @pytest.fixture
    def dining_user(self):
        """User with dining spending and Italian preference."""
        return {
            "categories": {"dining": 50, "coffee": 30, "nightlife": 20},
            "top_cuisines": ["italian", "asian", "mexican"],
            "cuisine_preferences": ["italian", "japanese"],
            "vibes": ["chill", "romantic", "intimate"],
            "price_tier": "moderate",
            "exploration_style": "adventurous",
            "social_preference": "small_group",
            "tx_weight": 0.5,
        }

    @pytest.fixture
    def italian_restaurant(self):
        return {
            "id": "italian-1",
            "name": "La Trattoria",
            "taste_cluster": "dining",
            "cuisine_type": "italian",
            "energy": "chill",
            "price_tier": "$$",
            "best_for": ["date_night", "casual_hangout"],
            "standout": ["hidden_gem"],
        }

    def test_affinity_uses_specific_categories(self, engine, dining_user, italian_restaurant):
        """Affinity should use specific categories, not 'other'."""
        result = engine.score(dining_user, italian_restaurant)
        # 50% dining spending with 30% threshold = high affinity
        assert result.scores["affinity"] >= 0.5

    def test_top_cuisine_scores_full(self, engine, dining_user, italian_restaurant):
        """User's #1 cuisine should score 1.0 or close to it."""
        result = engine.score(dining_user, italian_restaurant)
        # Italian is top cuisine in both tx and quiz, should blend high
        assert result.scores["match"] >= 0.7

    def test_unmatched_cuisine_scores_low(self, engine, dining_user, italian_restaurant):
        """Cuisine not in preferences should score zero."""
        italian_restaurant["cuisine_type"] = "french"
        result = engine.score(dining_user, italian_restaurant)
        # French not in user's preferences
        assert result.scores["match"] == 0.0

    def test_compatibility_combines_price_and_energy(self, engine, dining_user, italian_restaurant):
        """Compatibility should average price and energy scores."""
        result = engine.score(dining_user, italian_restaurant)
        # Price match + energy match averaged
        # Price: moderate vs $$ = 1.0
        # Energy: chill vibes + chill venue = partial match
        assert 0.3 <= result.scores["compatibility"] <= 1.0

    def test_perfect_dining_match_scores_reasonably(self, engine, dining_user, italian_restaurant):
        """Perfect dining match should score high (80-100%).

        User has 50% dining spending, matching cuisine, aligned price/energy.
        This IS a near-perfect match and should score accordingly.
        """
        result = engine.score(dining_user, italian_restaurant)
        # Perfect matches should score high - that's the point of differentiation
        assert 80 <= result.match_score <= 100


class TestNonDiningVenueScoring:
    """Tests for non-dining venues (coffee, nightlife, bakery)."""

    @pytest.fixture
    def engine(self):
        return MatchingEngine()

    @pytest.fixture
    def coffee_user(self):
        """User who prefers chill solo coffee spots."""
        return {
            "categories": {"coffee": 60, "dining": 30, "nightlife": 10},
            "top_cuisines": [],
            "cuisine_preferences": [],
            "vibes": ["chill", "relaxed", "intimate"],
            "price_tier": "moderate",
            "exploration_style": "moderate",
            "social_preference": "solo",
            "coffee_preference": "third_wave",
            "tx_weight": 0.7,
        }

    @pytest.fixture
    def chill_coffee_shop(self):
        return {
            "id": "coffee-1",
            "name": "Ministry of Coffee",
            "taste_cluster": "coffee",
            "cuisine_type": None,  # Non-dining
            "energy": "chill",
            "price_tier": "$$",
            "best_for": ["solo_work", "casual_hangout"],
            "standout": ["local_favorite", "cozy_vibes"],
        }

    def test_non_dining_uses_venue_fit_for_match(self, engine, coffee_user, chill_coffee_shop):
        """Non-dining venues should use venue_fit for match component."""
        result = engine.score(coffee_user, chill_coffee_shop)
        # Match component exists
        assert "match" in result.scores
        assert result.scores["match"] >= 0.5

    def test_coffee_fit_for_solo_chill_user(self, engine, coffee_user, chill_coffee_shop):
        """Coffee shop should score high for solo user with chill vibes."""
        result = engine.score(coffee_user, chill_coffee_shop)
        # Chill vibes + solo + solo_work best_for + third_wave preference
        assert result.scores["match"] >= 0.6

    def test_coffee_affinity_uses_specific_spending(self, engine, coffee_user, chill_coffee_shop):
        """Coffee venue should match coffee spending (not 'other')."""
        result = engine.score(coffee_user, chill_coffee_shop)
        # 60% coffee spending with 30% threshold = full affinity
        assert result.scores["affinity"] >= 0.8

    def test_coffee_shop_for_chill_user_scores_well(self, engine, coffee_user, chill_coffee_shop):
        """Chill coffee shop should score well for matching user."""
        result = engine.score(coffee_user, chill_coffee_shop)
        # Should score reasonably high with specific spending
        assert result.match_score >= 55


class TestNightlifeVenueScoring:
    """Tests for nightlife venues."""

    @pytest.fixture
    def engine(self):
        return MatchingEngine()

    @pytest.fixture
    def social_user(self):
        """User who prefers group nightlife."""
        return {
            "categories": {"nightlife": 50, "dining": 30, "coffee": 20},
            "top_cuisines": [],
            "cuisine_preferences": [],
            "vibes": ["social", "energetic", "fun"],
            "price_tier": "moderate",
            "exploration_style": "adventurous",
            "social_preference": "big_group",
            "tx_weight": 0.7,
        }

    @pytest.fixture
    def nightclub(self):
        return {
            "id": "nightlife-1",
            "name": "Club XYZ",
            "taste_cluster": "nightlife",
            "cuisine_type": None,
            "energy": "lively",
            "price_tier": "$$",
            "best_for": ["group_celebration", "late_night"],
            "standout": ["cult_following"],
        }

    def test_nightlife_fit_for_social_user(self, engine, social_user, nightclub):
        """Nightclub should score high for social, energetic user."""
        result = engine.score(social_user, nightclub)
        # big_group + social/energetic vibes + group_celebration
        assert result.scores["match"] >= 0.6

    def test_nightlife_affinity_uses_specific_spending(self, engine, social_user, nightclub):
        """Nightlife affinity should use nightlife + entertainment spending."""
        result = engine.score(social_user, nightclub)
        # 50% nightlife spending with 30% threshold = high affinity
        assert result.scores["affinity"] >= 0.8

    def test_solo_user_low_nightlife_fit(self, engine, social_user, nightclub):
        """Solo user should score lower for nightlife."""
        social_user["social_preference"] = "solo"
        social_user["vibes"] = ["chill", "relaxed"]
        result = engine.score(social_user, nightclub)
        assert result.scores["match"] <= 0.3


class TestNewUserScoring:
    """Tests for new users with only quiz data."""

    @pytest.fixture
    def engine(self):
        return MatchingEngine()

    @pytest.fixture
    def quiz_only_user(self):
        """New user with only quiz data."""
        return {
            "categories": {},  # No transaction data
            "top_cuisines": [],  # No observed cuisines
            "cuisine_preferences": ["italian", "asian"],  # From quiz
            "vibes": ["chill", "romantic"],
            "price_tier": "moderate",
            "exploration_style": "adventurous",
            "social_preference": "small_group",
            "tx_weight": 0.0,  # No transactions
        }

    @pytest.fixture
    def italian_venue(self):
        return {
            "id": "italian-1",
            "name": "Pasta Place",
            "taste_cluster": "dining",
            "cuisine_type": "italian",
            "energy": "chill",
            "price_tier": "$$",
            "best_for": ["date_night"],
            "standout": ["hidden_gem"],
        }

    @pytest.fixture
    def coffee_venue(self):
        return {
            "id": "coffee-1",
            "name": "Cozy Coffee",
            "taste_cluster": "coffee",
            "cuisine_type": None,
            "energy": "chill",
            "price_tier": "$$",
            "best_for": ["casual_hangout"],
            "standout": ["local_favorite"],
        }

    def test_new_user_uses_quiz_cuisine(self, engine, quiz_only_user, italian_venue):
        """New user should match based on quiz cuisine preferences."""
        result = engine.score_new_user(quiz_only_user, italian_venue)
        # Italian is #1 in quiz preferences
        assert result.scores["match"] == 1.0

    def test_new_user_has_zero_affinity(self, engine, quiz_only_user, italian_venue):
        """New user should have zero affinity (no transaction data)."""
        result = engine.score_new_user(quiz_only_user, italian_venue)
        assert result.scores["affinity"] == 0.0

    def test_new_user_uses_venue_fit_for_non_dining(
        self, engine, quiz_only_user, coffee_venue
    ):
        """New user should use venue_fit for non-dining venues."""
        result = engine.score_new_user(quiz_only_user, coffee_venue)
        # match component should have venue_fit score
        assert result.scores["match"] >= 0.2

    def test_new_user_reasonable_match_for_aligned_venue(
        self, engine, quiz_only_user, italian_venue
    ):
        """New user match for aligned venue should be reasonable."""
        result = engine.score_new_user(quiz_only_user, italian_venue)
        # No affinity (40% = 0), good match (30% = 1.0), some compatibility
        # Max possible: 0.30 + 0.15 = 45% plus some compatibility
        assert 30 <= result.match_score <= 60


class TestMatchReasonsGeneration:
    """Tests for match reason generation."""

    @pytest.fixture
    def engine(self):
        return MatchingEngine()

    def test_generates_affinity_reason(self, engine):
        """Should include affinity reason when score > 0.5."""
        scores = {"affinity": 0.7, "match": 0.3, "compatibility": 0.5}
        venue = {"taste_cluster": "coffee", "standout": []}
        reasons = engine.get_match_reasons(scores, venue)
        assert any("coffee" in r.lower() for r in reasons)

    def test_generates_match_reason_cuisine(self, engine):
        """Should include match reason for cuisine."""
        scores = {"affinity": 0.3, "match": 0.8, "compatibility": 0.5}
        venue = {"cuisine_type": "italian", "taste_cluster": "dining", "standout": []}
        reasons = engine.get_match_reasons(scores, venue)
        assert any("italian" in r.lower() for r in reasons)

    def test_generates_match_reason_coffee(self, engine):
        """Should include match reason for coffee shops."""
        scores = {"affinity": 0.3, "match": 0.7, "compatibility": 0.5}
        venue = {"taste_cluster": "coffee", "cuisine_type": None, "standout": []}
        reasons = engine.get_match_reasons(scores, venue)
        assert any("vibe" in r.lower() for r in reasons)

    def test_generates_compatibility_reason(self, engine):
        """Should include compatibility reason when high."""
        scores = {"affinity": 0.3, "match": 0.3, "compatibility": 0.9}
        venue = {"taste_cluster": "dining", "standout": []}
        reasons = engine.get_match_reasons(scores, venue)
        assert any("price" in r.lower() or "vibe" in r.lower() for r in reasons)

    def test_returns_max_two_reasons(self, engine):
        """Should return at most 2 reasons."""
        scores = {"affinity": 0.8, "match": 0.9, "compatibility": 0.9}
        venue = {
            "cuisine_type": "italian",
            "taste_cluster": "dining",
            "standout": [],
        }
        reasons = engine.get_match_reasons(scores, venue)
        assert len(reasons) <= 2


class TestMoodFiltering:
    """Tests for mood-based filtering and boosting."""

    @pytest.fixture
    def engine(self):
        return MatchingEngine()

    @pytest.fixture
    def base_user(self):
        return {
            "categories": {"coffee": 40, "dining": 40, "nightlife": 20},
            "top_cuisines": [],
            "cuisine_preferences": [],
            "vibes": ["chill", "social"],
            "price_tier": "moderate",
            "exploration_style": "moderate",
            "social_preference": "small_group",
            "tx_weight": 0.5,
        }

    def test_chill_mood_boosts_chill_venues(self, engine, base_user):
        """Chill mood should boost chill energy venues."""
        chill_venue = {
            "id": "chill-1",
            "taste_cluster": "coffee",
            "cuisine_type": None,
            "energy": "chill",
            "price_tier": "$$",
            "best_for": ["solo_work"],
            "standout": ["cozy_vibes"],
        }
        lively_venue = {
            "id": "lively-1",
            "taste_cluster": "dining",
            "cuisine_type": None,
            "energy": "lively",
            "price_tier": "$$",
            "best_for": ["group_celebration"],
            "standout": [],
        }
        results = engine.apply_mood_filter([chill_venue, lively_venue], "chill", base_user)
        # Chill venue should rank higher due to mood boost
        assert results[0]["venue"]["id"] == "chill-1"

    def test_energetic_mood_boosts_lively_venues(self, engine, base_user):
        """Energetic mood should boost lively energy venues."""
        base_user["vibes"] = ["social", "energetic"]
        chill_venue = {
            "id": "chill-1",
            "taste_cluster": "coffee",
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
        results = engine.apply_mood_filter([chill_venue, lively_venue], "energetic", base_user)
        assert results[0]["venue"]["id"] == "lively-1"

    def test_mood_boost_affects_sort_not_display(self, engine, base_user):
        """Mood boost should affect sort order but not displayed score."""
        venue = {
            "id": "test-1",
            "taste_cluster": "coffee",
            "cuisine_type": None,
            "energy": "chill",
            "price_tier": "$$",
            "best_for": ["solo_work"],
            "standout": ["cozy_vibes"],
        }
        results = engine.apply_mood_filter([venue], "chill", base_user)
        # _sort_score should be higher than match_score due to mood boost
        assert results[0]["_sort_score"] >= results[0]["match_score"]


class TestScoreDifferentiation:
    """Tests verifying meaningful score differences between venues."""

    @pytest.fixture
    def engine(self):
        return MatchingEngine()

    @pytest.fixture
    def italian_lover(self):
        """User who loves Italian food at moderate prices."""
        return {
            "categories": {"dining": 80, "coffee": 20},
            "top_cuisines": ["italian"],
            "cuisine_preferences": ["italian"],
            "vibes": ["romantic", "intimate", "chill"],
            "price_tier": "moderate",
            "exploration_style": "moderate",
            "social_preference": "small_group",
            "tx_weight": 0.7,
        }

    def test_matching_cuisine_scores_higher_than_non_matching(self, engine, italian_lover):
        """Italian venue should score higher than French for Italian lover."""
        italian_venue = {
            "id": "italian-1",
            "taste_cluster": "dining",
            "cuisine_type": "italian",
            "energy": "chill",
            "price_tier": "$$",
            "best_for": ["date_night"],
            "standout": [],
        }
        french_venue = {
            "id": "french-1",
            "taste_cluster": "dining",
            "cuisine_type": "french",
            "energy": "chill",
            "price_tier": "$$",
            "best_for": ["date_night"],
            "standout": [],
        }
        italian_result = engine.score(italian_lover, italian_venue)
        french_result = engine.score(italian_lover, french_venue)

        # Italian venue should score higher due to cuisine match
        assert italian_result.match_score > french_result.match_score + 15

    def test_coffee_user_prefers_coffee_over_nightlife(self, engine):
        """User with chill/solo preferences should prefer coffee over nightlife."""
        solo_chill_user = {
            "categories": {"coffee": 70, "nightlife": 10, "dining": 20},
            "top_cuisines": [],
            "cuisine_preferences": [],
            "vibes": ["chill", "relaxed", "intimate"],
            "price_tier": "budget",
            "exploration_style": "routine",
            "social_preference": "solo",
            "coffee_preference": "third_wave",
            "tx_weight": 0.7,
        }
        coffee_shop = {
            "id": "coffee-1",
            "taste_cluster": "coffee",
            "cuisine_type": None,
            "energy": "chill",
            "price_tier": "$",
            "best_for": ["solo_work"],
            "standout": ["local_favorite", "cozy_vibes"],
        }
        nightclub = {
            "id": "nightclub-1",
            "taste_cluster": "nightlife",
            "cuisine_type": None,
            "energy": "lively",
            "price_tier": "$$",
            "best_for": ["late_night", "group_celebration"],
            "standout": [],
        }
        coffee_result = engine.score(solo_chill_user, coffee_shop)
        nightclub_result = engine.score(solo_chill_user, nightclub)

        # Coffee should significantly outperform nightclub for this user
        assert coffee_result.match_score > nightclub_result.match_score + 20

    def test_venues_have_meaningful_spread(self, engine):
        """Different venues should produce a meaningful score spread."""
        user = {
            "categories": {"dining": 50, "coffee": 30, "nightlife": 20},
            "top_cuisines": ["italian"],
            "cuisine_preferences": ["italian", "asian"],
            "vibes": ["chill", "romantic"],
            "price_tier": "moderate",
            "exploration_style": "moderate",
            "social_preference": "small_group",
            "tx_weight": 0.5,
        }
        venues = [
            {
                "id": "perfect",
                "taste_cluster": "dining",
                "cuisine_type": "italian",
                "energy": "chill",
                "price_tier": "$$",
                "best_for": ["date_night"],
                "standout": ["hidden_gem"],
            },
            {
                "id": "medium",
                "taste_cluster": "coffee",
                "cuisine_type": None,
                "energy": "chill",
                "price_tier": "$$",
                "best_for": ["casual_hangout"],
                "standout": [],
            },
            {
                "id": "poor",
                "taste_cluster": "nightlife",
                "cuisine_type": None,
                "energy": "lively",
                "price_tier": "$$$$",
                "best_for": ["late_night"],
                "standout": [],
            },
        ]
        scores = [engine.score(user, v).match_score for v in venues]
        score_range = max(scores) - min(scores)

        # Should have at least 20% spread between best and worst
        assert score_range >= 20


class TestBroadSpenderScoring:
    """Tests for users with broad/unclear spending patterns (high 'other')."""

    @pytest.fixture
    def engine(self):
        return MatchingEngine()

    @pytest.fixture
    def broad_spender(self):
        """User with mostly 'other' category (typical of many users)."""
        return {
            "categories": {"other": 63, "entertainment": 19, "dining": 12, "coffee": 6},
            "top_cuisines": ["italian"],
            "cuisine_preferences": ["italian"],
            "vibes": ["social", "casual", "chill", "trendy"],
            "price_tier": "moderate",
            "exploration_style": "moderate",
            "social_preference": "small_group",
            "tx_weight": 0.5,
        }

    def test_other_category_not_counted_for_coffee(self, engine, broad_spender):
        """'Other' category should not boost coffee venue affinity."""
        coffee_venue = {
            "id": "coffee-1",
            "taste_cluster": "coffee",
            "cuisine_type": None,
            "energy": "chill",
            "price_tier": "$$",
            "best_for": ["solo_work"],
            "standout": [],
        }
        result = engine.score(broad_spender, coffee_venue)
        # Only 6% coffee spending, not 69% (6 + 63)
        # 6% / 30% threshold = 0.2
        assert result.scores["affinity"] <= 0.3

    def test_other_category_not_counted_for_nightlife(self, engine, broad_spender):
        """'Other' category should not boost nightlife venue affinity."""
        nightclub = {
            "id": "nightclub-1",
            "taste_cluster": "nightlife",
            "cuisine_type": None,
            "energy": "lively",
            "price_tier": "$$",
            "best_for": ["group_celebration"],
            "standout": [],
        }
        result = engine.score(broad_spender, nightclub)
        # Only 19% entertainment (maps to nightlife), not 82% (19 + 63)
        # 19% / 30% threshold = 0.63
        assert result.scores["affinity"] <= 0.7

    def test_broad_spender_scores_differentiated(self, engine, broad_spender):
        """Broad spender should still see differentiated scores across venues."""
        italian_venue = {
            "id": "italian-1",
            "taste_cluster": "dining",
            "cuisine_type": "italian",
            "energy": "chill",
            "price_tier": "$$",
            "best_for": ["date_night"],
            "standout": [],
        }
        coffee_venue = {
            "id": "coffee-1",
            "taste_cluster": "coffee",
            "cuisine_type": None,
            "energy": "chill",
            "price_tier": "$$",
            "best_for": ["solo_work"],
            "standout": [],
        }
        italian_result = engine.score(broad_spender, italian_venue)
        coffee_result = engine.score(broad_spender, coffee_venue)

        # Should see meaningful difference, not both at 95%+
        assert abs(italian_result.match_score - coffee_result.match_score) >= 10

    def test_broad_spender_not_all_high_scores(self, engine, broad_spender):
        """Broad spender should NOT get 85%+ on all venue types."""
        venues = [
            {"id": "v1", "taste_cluster": "coffee", "cuisine_type": None, "energy": "chill", "price_tier": "$$", "best_for": [], "standout": []},
            {"id": "v2", "taste_cluster": "dining", "cuisine_type": "italian", "energy": "chill", "price_tier": "$$", "best_for": [], "standout": []},
            {"id": "v3", "taste_cluster": "nightlife", "cuisine_type": None, "energy": "lively", "price_tier": "$$", "best_for": [], "standout": []},
            {"id": "v4", "taste_cluster": "bakery", "cuisine_type": None, "energy": "chill", "price_tier": "$", "best_for": [], "standout": []},
        ]
        scores = [engine.score(broad_spender, v).match_score for v in venues]

        # At least some venues should score below 60%
        assert min(scores) < 60
        # Not all should be above 80%
        assert sum(1 for s in scores if s > 80) < len(scores)
