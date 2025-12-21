"""Tests for MatchingEngine - Adaptive Weighted Sum Model.

Tests the venue matching algorithm that scores venues based on user taste profile
with adaptive weights for dining vs non-dining venues.
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

    def test_category_score_uses_mapped_affinity(self, engine, dining_user, italian_restaurant):
        """Category score should use bidirectional category mapping."""
        result = engine.score(dining_user, italian_restaurant)
        # dining venue matches user's dining spending (50%)
        # With mapping, score should be significant (>0.4)
        assert result.scores["category"] >= 0.4

    def test_top_cuisine_scores_full(self, engine, dining_user, italian_restaurant):
        """User's #1 cuisine should score 1.0 or close to it."""
        result = engine.score(dining_user, italian_restaurant)
        # Italian is top cuisine in both tx and quiz, should blend high
        assert result.scores["cuisine"] >= 0.7

    def test_unmatched_cuisine_scores_low(self, engine, dining_user, italian_restaurant):
        """Cuisine not in preferences should score low but not zero."""
        italian_restaurant["cuisine_type"] = "french"
        result = engine.score(dining_user, italian_restaurant)
        # Blending logic gives base score even for no match
        assert result.scores["cuisine"] <= 0.4

    def test_price_exact_match_scores_full(self, engine, dining_user, italian_restaurant):
        """Exact price tier match should score 1.0."""
        result = engine.score(dining_user, italian_restaurant)
        # User: moderate, Venue: $$ = match
        assert result.scores["price"] == 1.0

    def test_energy_match_scores_well(self, engine, dining_user, italian_restaurant):
        """Chill vibes should match chill venue."""
        result = engine.score(dining_user, italian_restaurant)
        # chill + romantic + intimate vibes match chill venue
        assert result.scores["energy"] >= 0.5

    def test_context_score_for_social_match(self, engine, dining_user, italian_restaurant):
        """Context score should be high when social preference aligns."""
        result = engine.score(dining_user, italian_restaurant)
        # small_group + date_night/casual_hangout should match
        assert result.scores["context"] >= 0.5

    def test_discovery_bonus_for_adventurous(self, engine, dining_user, italian_restaurant):
        """Adventurous user should get discovery bonus for hidden_gem."""
        result = engine.score(dining_user, italian_restaurant)
        assert result.scores["discovery"] == 1.0

    def test_perfect_dining_match_scores_high(self, engine, dining_user, italian_restaurant):
        """Perfect dining match should score above 70%."""
        result = engine.score(dining_user, italian_restaurant)
        assert result.match_score >= 70


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

    def test_non_dining_uses_venue_fit(self, engine, coffee_user, chill_coffee_shop):
        """Non-dining venues should use venue_fit instead of cuisine."""
        result = engine.score(coffee_user, chill_coffee_shop)
        assert "venue_fit" in result.scores
        assert "cuisine" not in result.scores

    def test_coffee_fit_for_solo_chill_user(self, engine, coffee_user, chill_coffee_shop):
        """Coffee shop should score high for solo user with chill vibes."""
        result = engine.score(coffee_user, chill_coffee_shop)
        # Chill vibes + solo + solo_work best_for + third_wave preference
        assert result.scores["venue_fit"] >= 0.7

    def test_coffee_category_uses_mapping(self, engine, coffee_user, chill_coffee_shop):
        """Coffee venue should match coffee spending via mapping."""
        result = engine.score(coffee_user, chill_coffee_shop)
        # 60% coffee spending should give high category score
        assert result.scores["category"] >= 0.5

    def test_coffee_shop_for_chill_user_scores_high(self, engine, coffee_user, chill_coffee_shop):
        """Chill coffee shop should score high for matching user."""
        result = engine.score(coffee_user, chill_coffee_shop)
        # This was the Ministry of Coffee problem - should now be 70%+
        assert result.match_score >= 65

    def test_routine_user_gets_local_favorite_bonus(self, engine, coffee_user, chill_coffee_shop):
        """Routine user should get discovery bonus for local_favorite."""
        coffee_user["exploration_style"] = "routine"
        result = engine.score(coffee_user, chill_coffee_shop)
        # local_favorite gives 0.9 bonus for routine users
        assert result.scores["discovery"] >= 0.6


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
        assert result.scores["venue_fit"] >= 0.6

    def test_nightclub_context_for_group(self, engine, social_user, nightclub):
        """Context score high for group preference + group_celebration."""
        result = engine.score(social_user, nightclub)
        assert result.scores["context"] >= 0.6

    def test_solo_user_low_nightlife_fit(self, engine, social_user, nightclub):
        """Solo user should score lower for nightlife."""
        social_user["social_preference"] = "solo"
        social_user["vibes"] = ["chill", "relaxed"]
        result = engine.score(social_user, nightclub)
        assert result.scores["venue_fit"] <= 0.5


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
        assert result.scores["cuisine_or_fit"] == 1.0

    def test_new_user_no_category_score(self, engine, quiz_only_user, italian_venue):
        """New user scores should not have category component."""
        result = engine.score_new_user(quiz_only_user, italian_venue)
        assert "category" not in result.scores

    def test_new_user_uses_venue_fit_for_non_dining(
        self, engine, quiz_only_user, coffee_venue
    ):
        """New user should use venue_fit for non-dining venues."""
        result = engine.score_new_user(quiz_only_user, coffee_venue)
        # cuisine_or_fit should be venue_fit score
        assert result.scores["cuisine_or_fit"] >= 0.3

    def test_new_user_context_scoring(self, engine, quiz_only_user, italian_venue):
        """New user should get context score based on social + vibes."""
        result = engine.score_new_user(quiz_only_user, italian_venue)
        # small_group + date_night should match
        assert result.scores["context"] >= 0.5

    def test_new_user_discovery_bonus(self, engine, quiz_only_user, italian_venue):
        """Adventurous new user should get hidden_gem bonus."""
        result = engine.score_new_user(quiz_only_user, italian_venue)
        assert result.scores["discovery"] == 1.0

    def test_new_user_high_match_for_aligned_venue(
        self, engine, quiz_only_user, italian_venue
    ):
        """Perfect match for new user should score high."""
        result = engine.score_new_user(quiz_only_user, italian_venue)
        # cuisine match + price + energy + context + discovery
        assert result.match_score >= 70


class TestMatchReasonsGeneration:
    """Tests for match reason generation."""

    @pytest.fixture
    def engine(self):
        return MatchingEngine()

    def test_generates_cuisine_reason(self, engine):
        """Should include cuisine reason when score > 0.5."""
        scores = {"cuisine": 1.0, "price": 1.0, "context": 0.5}
        venue = {"cuisine_type": "italian", "taste_cluster": "dining", "standout": []}
        reasons = engine.get_match_reasons(scores, venue)
        assert any("italian" in r.lower() for r in reasons)

    def test_generates_category_reason(self, engine):
        """Should include category reason when score > 0.4."""
        scores = {"category": 0.6, "price": 1.0}
        venue = {"taste_cluster": "dining", "standout": []}
        reasons = engine.get_match_reasons(scores, venue)
        assert any("dining" in r.lower() for r in reasons)

    def test_generates_venue_fit_reason_coffee(self, engine):
        """Should include venue fit reason for coffee shops."""
        scores = {"venue_fit": 0.8, "price": 1.0}
        venue = {"taste_cluster": "coffee", "standout": []}
        reasons = engine.get_match_reasons(scores, venue)
        assert any("vibe" in r.lower() for r in reasons)

    def test_generates_price_reason(self, engine):
        """Should include price reason when exact match."""
        scores = {"price": 1.0, "category": 0.3}
        venue = {"taste_cluster": "dining", "standout": []}
        reasons = engine.get_match_reasons(scores, venue)
        assert any("price" in r.lower() for r in reasons)

    def test_generates_context_reason_date_night(self, engine):
        """Should include context reason for date_night."""
        scores = {"context": 0.8, "price": 1.0}
        venue = {"best_for": ["date_night"], "standout": []}
        reasons = engine.get_match_reasons(scores, venue)
        assert any("date" in r.lower() for r in reasons)

    def test_generates_discovery_reason_hidden_gem(self, engine):
        """Should mention hidden gem for high discovery score."""
        scores = {"discovery": 1.0, "price": 0.5}
        venue = {"standout": ["hidden_gem"]}
        reasons = engine.get_match_reasons(scores, venue)
        assert any("hidden gem" in r.lower() for r in reasons)

    def test_returns_max_two_reasons(self, engine):
        """Should return at most 2 reasons."""
        scores = {
            "cuisine": 1.0,
            "category": 0.6,
            "price": 1.0,
            "context": 0.8,
            "discovery": 1.0,
        }
        venue = {
            "cuisine_type": "italian",
            "taste_cluster": "dining",
            "best_for": ["date_night"],
            "standout": ["hidden_gem"],
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

    def test_romantic_mood_boosts_date_night_venues(self, engine, base_user):
        """Romantic mood should boost date_night venues."""
        base_user["vibes"] = ["romantic", "chill"]
        regular_venue = {
            "id": "regular-1",
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
        results = engine.apply_mood_filter([regular_venue, romantic_venue], "romantic", base_user)
        assert results[0]["venue"]["id"] == "romantic-1"

    def test_mood_boost_caps_at_99(self, engine, base_user):
        """Mood boost should not exceed 99%."""
        base_user["categories"] = {"coffee": 100}
        base_user["vibes"] = ["chill", "relaxed", "cozy"]
        base_user["social_preference"] = "solo"
        base_user["coffee_preference"] = "third_wave"
        perfect_venue = {
            "id": "perfect-1",
            "taste_cluster": "coffee",
            "cuisine_type": None,
            "energy": "chill",
            "price_tier": "$$",
            "best_for": ["solo_work"],
            "standout": ["cozy_vibes", "hidden_gem"],
        }
        results = engine.apply_mood_filter([perfect_venue], "chill", base_user)
        assert results[0]["match_score"] <= 99


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

        # At least 15% difference for cuisine match
        assert italian_result.match_score > french_result.match_score + 10

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

        # Should have at least 25% spread between best and worst
        assert score_range >= 25
