"""MatchingEngine - Adaptive Weighted Sum Model for venue-user matching.

Uses adaptive weights based on venue type (dining vs non-dining) for fair scoring.
No ML, no AI - just deterministic rule-based scoring.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from app.mappings.category_mappings import calculate_category_affinity
from app.mappings.price_mappings import calculate_price_match
from app.mappings.vibe_mappings import calculate_energy_match, calculate_exploration_bonus
from app.mappings.mood_mappings import calculate_mood_boost


@dataclass
class MatchResult:
    """Result of scoring a venue against a user taste profile."""

    match_score: int  # 0-100 percentage
    scores: dict[str, float] = field(default_factory=dict)
    reasons: list[str] = field(default_factory=list)


# Social preference to best_for occasion mapping
SOCIAL_OCCASION_MAP: dict[str, list[str]] = {
    "solo": ["solo_work", "quick_bite"],
    "small_group": ["date_night", "casual_hangout", "business_lunch"],
    "big_group": ["group_celebration", "late_night", "casual_hangout"],
}

# Vibe to occasion mapping for context scoring
VIBE_OCCASION_MAP: dict[str, list[str]] = {
    "romantic": ["date_night"],
    "intimate": ["date_night", "casual_hangout"],
    "social": ["group_celebration", "casual_hangout", "late_night"],
    "energetic": ["group_celebration", "late_night"],
    "chill": ["solo_work", "casual_hangout"],
    "relaxed": ["solo_work", "casual_hangout"],
    "upscale": ["date_night", "business_lunch"],
    "elegant": ["date_night", "business_lunch"],
    "casual": ["casual_hangout", "quick_bite"],
    "fun": ["group_celebration", "late_night"],
}

# Vibes that indicate coffee shop affinity
COFFEE_FRIENDLY_VIBES: set[str] = {"chill", "relaxed", "intimate", "homebody", "casual"}

# Vibes that indicate nightlife affinity
NIGHTLIFE_FRIENDLY_VIBES: set[str] = {"social", "energetic", "fun", "trendy", "adventurous"}


class MatchingEngine:
    """Scores venues using Adaptive Weighted Sum Model.

    Uses different weights for dining vs non-dining venues to ensure
    fair scoring across venue types.

    Dining Venues (have cuisine_type):
    - Category: 20% | Cuisine: 25% | Price: 20% | Energy: 15% | Context: 15% | Discovery: 5%

    Non-Dining Venues (coffee, nightlife, bakery):
    - Category: 25% | Venue-Fit: 20% | Price: 20% | Energy: 15% | Context: 15% | Discovery: 5%

    New Users (no transaction data):
    - Cuisine/Fit: 30% | Price: 25% | Energy: 20% | Context: 15% | Discovery: 10%
    """

    DINING_WEIGHTS = {
        "category": 0.20,
        "cuisine": 0.25,
        "price": 0.20,
        "energy": 0.15,
        "context": 0.15,
        "discovery": 0.05,
    }

    NON_DINING_WEIGHTS = {
        "category": 0.25,
        "venue_fit": 0.20,
        "price": 0.20,
        "energy": 0.15,
        "context": 0.15,
        "discovery": 0.05,
    }

    NEW_USER_WEIGHTS = {
        "cuisine_or_fit": 0.30,
        "price": 0.25,
        "energy": 0.20,
        "context": 0.15,
        "discovery": 0.10,
    }

    def score(self, user_taste: dict[str, Any], venue: dict[str, Any]) -> MatchResult:
        """Score a venue for an established user with transaction history.

        Uses adaptive weights based on venue type (dining vs non-dining).

        Args:
            user_taste: User taste profile with categories, vibes, price_tier, etc.
            venue: Venue profile with taste_cluster, cuisine_type, energy, etc.

        Returns:
            MatchResult with overall score and component scores.
        """
        is_dining = venue.get("cuisine_type") is not None
        scores = {}

        # 1. Category Affinity (uses new category mapping)
        scores["category"] = self._category_score(user_taste, venue)

        # 2. Cuisine OR Venue-Type Fit
        if is_dining:
            scores["cuisine"] = self._cuisine_score(user_taste, venue)
            weights = self.DINING_WEIGHTS
        else:
            scores["venue_fit"] = self._venue_type_fit_score(user_taste, venue)
            weights = self.NON_DINING_WEIGHTS

        # 3. Price Match
        scores["price"] = calculate_price_match(
            user_taste.get("price_tier"),
            venue.get("price_tier"),
        )

        # 4. Energy/Vibe Match
        scores["energy"] = calculate_energy_match(
            user_taste.get("vibes", []),
            venue.get("energy"),
        )

        # 5. Context Match (best_for + social preference)
        scores["context"] = self._context_match_score(user_taste, venue)

        # 6. Discovery Bonus (exploration style + standout)
        scores["discovery"] = calculate_exploration_bonus(
            user_taste.get("exploration_style"),
            venue.get("standout", []),
        )

        # Weighted sum
        total = sum(weights.get(k, 0) * v for k, v in scores.items())
        match_score = round(total * 100)

        return MatchResult(
            match_score=min(max(match_score, 0), 100),
            scores=scores,
        )

    def score_new_user(
        self, user_taste: dict[str, Any], venue: dict[str, Any]
    ) -> MatchResult:
        """Score a venue for a new user with only quiz data (no transactions).

        Uses cuisine_preferences from quiz, venue-type fit for non-dining.

        Args:
            user_taste: User taste profile with cuisine_preferences from quiz.
            venue: Venue profile.

        Returns:
            MatchResult with overall score and component scores.
        """
        is_dining = venue.get("cuisine_type") is not None
        scores = {}

        # 1. Cuisine OR Venue-Type Fit (30%)
        if is_dining:
            quiz_cuisines = user_taste.get("cuisine_preferences", [])
            scores["cuisine_or_fit"] = self._cuisine_score_from_list(quiz_cuisines, venue)
        else:
            scores["cuisine_or_fit"] = self._venue_type_fit_score(user_taste, venue)

        # 2. Price Match (25%)
        scores["price"] = calculate_price_match(
            user_taste.get("price_tier"),
            venue.get("price_tier"),
        )

        # 3. Energy/Vibe Match (20%)
        scores["energy"] = calculate_energy_match(
            user_taste.get("vibes", []),
            venue.get("energy"),
        )

        # 4. Context Match (15%)
        scores["context"] = self._context_match_score(user_taste, venue)

        # 5. Discovery Bonus (10%)
        scores["discovery"] = calculate_exploration_bonus(
            user_taste.get("exploration_style"),
            venue.get("standout", []),
        )

        # Weighted sum
        total = sum(self.NEW_USER_WEIGHTS[k] * scores[k] for k in self.NEW_USER_WEIGHTS)
        match_score = round(total * 100)

        return MatchResult(
            match_score=min(max(match_score, 0), 100),
            scores=scores,
        )

    def get_match_reasons(
        self, scores: dict[str, float], venue: dict[str, Any]
    ) -> list[str]:
        """Generate human-readable match reasons.

        Args:
            scores: Component scores from scoring.
            venue: Venue profile.

        Returns:
            List of 0-2 reasons explaining the match.
        """
        reasons = []

        # Cuisine match reason
        if scores.get("cuisine", 0) > 0.5:
            cuisine = venue.get("cuisine_type")
            if cuisine:
                reasons.append(f"Matches your {cuisine} preference")

        # Category match reason
        if scores.get("category", 0) > 0.4:
            cluster = venue.get("taste_cluster")
            if cluster:
                reasons.append(f"You love {cluster} spots")

        # Venue fit reason (for non-dining)
        if scores.get("venue_fit", 0) > 0.6:
            cluster = venue.get("taste_cluster")
            if cluster == "coffee":
                reasons.append("Perfect for your vibe")
            elif cluster == "nightlife":
                reasons.append("Great for your social style")

        # Price match reason
        if scores.get("price", 0) == 1.0:
            reasons.append("Right in your price range")

        # Context match reason
        if scores.get("context", 0) > 0.7:
            best_for = venue.get("best_for", [])
            if "date_night" in best_for:
                reasons.append("Perfect for date night")
            elif "solo_work" in best_for:
                reasons.append("Great solo spot")
            elif "group_celebration" in best_for:
                reasons.append("Perfect for groups")

        # Discovery/exploration reason
        standout = venue.get("standout", [])
        if scores.get("discovery", 0) > 0.5:
            if "hidden_gem" in standout:
                reasons.append("Hidden gem to discover")
            elif "local_favorite" in standout:
                reasons.append("Local favorite")

        # Return max 2 reasons
        return reasons[:2]

    def apply_mood_filter(
        self,
        venues: list[dict[str, Any]],
        mood: str,
        user_taste: dict[str, Any],
    ) -> list[dict[str, Any]]:
        """Apply mood-based filtering and boosting to venues.

        Calculates base score for each venue, then applies mood boost.

        Args:
            venues: List of venue profiles.
            mood: Selected mood (chill, energetic, romantic, etc.).
            user_taste: User taste profile.

        Returns:
            List of dicts with venue and match_score, sorted by score descending.
        """
        results = []

        for venue in venues:
            # Calculate base score
            has_categories = bool(user_taste.get("categories"))
            if has_categories:
                base_result = self.score(user_taste, venue)
            else:
                base_result = self.score_new_user(user_taste, venue)

            base_score = base_result.match_score

            # Calculate mood boost (for ranking only, not display)
            mood_boost = calculate_mood_boost(
                mood,
                venue.get("energy"),
                venue.get("best_for", []),
                venue.get("standout", []),
            )

            # Display pure match score, use mood boost for ranking only
            results.append({
                "venue": venue,
                "match_score": base_score,
                "scores": base_result.scores,
                "_sort_score": base_score + mood_boost,
            })

        # Sort by mood-adjusted score, display pure match score
        results.sort(key=lambda x: x["_sort_score"], reverse=True)

        return results

    def _category_score(
        self, user_taste: dict[str, Any], venue: dict[str, Any]
    ) -> float:
        """Calculate category affinity score using mapped categories.

        Uses bidirectional category mapping to find relevant user spending.

        Returns:
            Score 0.0-1.0 based on spending in relevant categories.
        """
        categories = user_taste.get("categories", {})
        taste_cluster = venue.get("taste_cluster")

        return calculate_category_affinity(categories, taste_cluster)

    def _cuisine_score(
        self, user_taste: dict[str, Any], venue: dict[str, Any]
    ) -> float:
        """Calculate cuisine match score blending quiz and transaction data.

        Blends declared cuisine preferences with observed top_cuisines,
        weighted by transaction volume.

        Returns:
            Score 0.0-1.0.
        """
        venue_cuisine = venue.get("cuisine_type")

        if not venue_cuisine:
            # Non-cuisine venue - no cuisine credit
            return 0.0

        # Get both sources
        tx_cuisines = user_taste.get("top_cuisines", [])
        quiz_cuisines = user_taste.get("cuisine_preferences", [])

        # Get blend weight (default to quiz-heavy if not specified)
        tx_weight = user_taste.get("tx_weight", 0.0)
        quiz_weight = 1.0 - tx_weight

        # Calculate score from each source
        tx_score = self._cuisine_score_from_list(tx_cuisines, venue)
        quiz_score = self._cuisine_score_from_list(quiz_cuisines, venue)

        # If no tx data, use quiz only
        if not tx_cuisines:
            return quiz_score  # No artificial floor

        # If no quiz data, use tx only
        if not quiz_cuisines:
            return tx_score  # No artificial floor

        # Weighted blend
        blended = (tx_score * tx_weight) + (quiz_score * quiz_weight)

        return blended

    def _cuisine_score_from_list(
        self, cuisines: list[str], venue: dict[str, Any]
    ) -> float:
        """Calculate cuisine match score from a list of cuisines.

        Args:
            cuisines: List of cuisines (ranked by preference).
            venue: Venue profile.

        Returns:
            Score 0.0-1.0. Top cuisine = 1.0, each rank down = -0.15.
        """
        venue_cuisine = venue.get("cuisine_type")

        if not venue_cuisine or not cuisines:
            return 0.0

        # Case-insensitive matching
        venue_cuisine_lower = venue_cuisine.lower()
        cuisines_lower = [c.lower() for c in cuisines]

        if venue_cuisine_lower not in cuisines_lower:
            return 0.0

        rank = cuisines_lower.index(venue_cuisine_lower)
        # Top = 1.0, 2nd = 0.85, 3rd = 0.70, etc.
        return max(1.0 - (rank * 0.15), 0.0)

    def _venue_type_fit_score(
        self, user_taste: dict[str, Any], venue: dict[str, Any]
    ) -> float:
        """Score venue-type fit for non-dining venues.

        Uses social preference, vibes, and best_for alignment.

        Returns:
            Score 0.0-1.0.
        """
        venue_cluster = venue.get("taste_cluster", "").lower()

        if venue_cluster == "coffee":
            return self._coffee_fit_score(user_taste, venue)
        elif venue_cluster == "nightlife":
            return self._nightlife_fit_score(user_taste, venue)
        elif venue_cluster == "bakery":
            return self._bakery_fit_score(user_taste, venue)

        return 0.0  # Unknown = no match

    def _coffee_fit_score(
        self, user_taste: dict[str, Any], venue: dict[str, Any]
    ) -> float:
        """Score coffee venue fit based on vibes and social preference."""
        score = 0.0

        # Vibe alignment for coffee shops (chill, relaxed, intimate)
        user_vibes = set(user_taste.get("vibes", []))
        vibe_overlap = len(user_vibes & COFFEE_FRIENDLY_VIBES)
        score += min(vibe_overlap * 0.2, 0.4)

        # Social preference alignment
        social_pref = user_taste.get("social_preference")
        best_for = venue.get("best_for", [])

        if social_pref == "solo" and "solo_work" in best_for:
            score += 0.4
        elif social_pref in ["small_group", "big_group"] and "casual_hangout" in best_for:
            score += 0.3
        else:
            score += 0.1  # Low base score

        # Bonus for coffee preference from quiz
        coffee_pref = user_taste.get("coffee_preference")
        if coffee_pref == "third_wave":
            score += 0.2  # Coffee enthusiasts get bonus
        elif coffee_pref == "any":
            score += 0.1

        return min(score, 1.0)

    def _nightlife_fit_score(
        self, user_taste: dict[str, Any], venue: dict[str, Any]
    ) -> float:
        """Score nightlife venue fit based on social preference and vibes."""
        score = 0.0

        # Social preference is key for nightlife
        social_pref = user_taste.get("social_preference")
        if social_pref == "big_group":
            score += 0.4
        elif social_pref == "small_group":
            score += 0.3
        elif social_pref == "solo":
            score += 0.05  # Nightlife less suitable for solo
        else:
            score += 0.15  # Low default

        # Vibe alignment
        user_vibes = set(user_taste.get("vibes", []))
        vibe_overlap = len(user_vibes & NIGHTLIFE_FRIENDLY_VIBES)
        score += min(vibe_overlap * 0.15, 0.45)

        # Best-for tag alignment
        best_for = venue.get("best_for", [])
        if social_pref == "big_group" and "group_celebration" in best_for:
            score += 0.15
        if "late_night" in best_for and "energetic" in user_vibes:
            score += 0.1

        return min(score, 1.0)

    def _bakery_fit_score(
        self, user_taste: dict[str, Any], venue: dict[str, Any]
    ) -> float:
        """Score bakery venue fit based on vibes and occasion."""
        score = 0.15  # Low base score for bakeries

        # Vibe alignment (similar to coffee but less work-focused)
        user_vibes = set(user_taste.get("vibes", []))
        cozy_vibes = {"chill", "relaxed", "cozy", "casual"}
        vibe_overlap = len(user_vibes & cozy_vibes)
        score += min(vibe_overlap * 0.15, 0.3)

        # Best-for alignment
        best_for = venue.get("best_for", [])
        if "quick_bite" in best_for:
            score += 0.2
        if "casual_hangout" in best_for:
            score += 0.15

        return min(score, 1.0)

    def _context_match_score(
        self, user_taste: dict[str, Any], venue: dict[str, Any]
    ) -> float:
        """Score context alignment using best_for tags and social preference.

        This is a NEW component that uses underutilized venue attributes.

        Returns:
            Score 0.0-1.0.
        """
        best_for = venue.get("best_for", [])

        if not best_for:
            return 0.0  # No best_for = no context match

        score = 0.0

        # Social preference alignment (50% of context score)
        social_pref = user_taste.get("social_preference")
        social_match = self._social_to_best_for_match(social_pref, best_for)
        score += social_match * 0.5

        # Vibe to occasion alignment (50% of context score)
        user_vibes = user_taste.get("vibes", [])
        occasion_match = self._vibes_to_occasion_match(user_vibes, best_for)
        score += occasion_match * 0.5

        return min(score, 1.0)

    def _social_to_best_for_match(
        self, social_pref: str | None, best_for: list[str]
    ) -> float:
        """Match social preference to venue occasions."""
        if not social_pref:
            return 0.0  # No preference = no match

        matching_occasions = SOCIAL_OCCASION_MAP.get(social_pref, [])
        overlap = len(set(best_for) & set(matching_occasions))

        if overlap >= 2:
            return 1.0
        elif overlap == 1:
            return 0.5
        return 0.0  # No overlap = no match

    def _vibes_to_occasion_match(
        self, vibes: list[str], best_for: list[str]
    ) -> float:
        """Match user vibes to venue occasions."""
        if not vibes:
            return 0.0  # No vibes = no match

        relevant_occasions: set[str] = set()
        for vibe in vibes:
            relevant_occasions.update(VIBE_OCCASION_MAP.get(vibe.lower(), []))

        overlap = len(set(best_for) & relevant_occasions)

        if overlap >= 2:
            return 1.0
        elif overlap == 1:
            return 0.5
        return 0.0  # No overlap = no match
