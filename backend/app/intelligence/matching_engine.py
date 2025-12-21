"""MatchingEngine - Simplified 3-component scoring model.

Uses 3 components for all venues:
- Affinity (40%): Category spending (specific categories only, excludes "other")
- Match (30%): Cuisine for dining, venue-fit for non-dining
- Compatibility (30%): Price + Energy combined

No ML, no AI - just deterministic rule-based scoring.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from app.mappings.category_mappings import calculate_category_affinity
from app.mappings.price_mappings import calculate_price_match
from app.mappings.vibe_mappings import calculate_energy_match
from app.mappings.mood_mappings import calculate_mood_boost


@dataclass
class MatchResult:
    """Result of scoring a venue against a user taste profile."""

    match_score: int  # 0-100 percentage
    scores: dict[str, float] = field(default_factory=dict)
    reasons: list[str] = field(default_factory=list)


# Vibes that indicate coffee shop affinity
COFFEE_FRIENDLY_VIBES: set[str] = {"chill", "relaxed", "intimate", "homebody", "casual"}

# Vibes that indicate nightlife affinity
NIGHTLIFE_FRIENDLY_VIBES: set[str] = {"social", "energetic", "fun", "trendy", "adventurous"}


class MatchingEngine:
    """Scores venues using simplified 3-component model.

    All Venues:
    - Affinity: 40% - Category spending (specific only, no "other")
    - Match: 30% - Cuisine (dining) or venue-fit (non-dining)
    - Compatibility: 30% - Price + Energy averaged
    """

    WEIGHTS = {
        "affinity": 0.40,
        "match": 0.30,
        "compatibility": 0.30,
    }

    def score(self, user_taste: dict[str, Any], venue: dict[str, Any]) -> MatchResult:
        """Score a venue for an established user with transaction history.

        Args:
            user_taste: User taste profile with categories, vibes, price_tier, etc.
            venue: Venue profile with taste_cluster, cuisine_type, energy, etc.

        Returns:
            MatchResult with overall score and component scores.
        """
        scores = {}

        # 1. Affinity (40%) - Category spending
        scores["affinity"] = self._category_score(user_taste, venue)

        # 2. Match (30%) - Cuisine for dining, venue-fit for non-dining
        is_dining = venue.get("cuisine_type") is not None
        if is_dining:
            scores["match"] = self._cuisine_score(user_taste, venue)
        else:
            scores["match"] = self._venue_type_fit_score(user_taste, venue)

        # 3. Compatibility (30%) - Price + Energy averaged
        price_score = calculate_price_match(
            user_taste.get("price_tier"),
            venue.get("price_tier"),
        )
        energy_score = calculate_energy_match(
            user_taste.get("vibes", []),
            venue.get("energy"),
        )
        scores["compatibility"] = (price_score + energy_score) / 2

        # Weighted sum
        total = sum(self.WEIGHTS[k] * scores[k] for k in self.WEIGHTS)
        match_score = round(total * 100)

        return MatchResult(
            match_score=min(max(match_score, 0), 100),
            scores=scores,
        )

    def score_new_user(
        self, user_taste: dict[str, Any], venue: dict[str, Any]
    ) -> MatchResult:
        """Score a venue for a new user with only quiz data (no transactions).

        Uses same 3 components but affinity comes from quiz preferences.

        Args:
            user_taste: User taste profile with cuisine_preferences from quiz.
            venue: Venue profile.

        Returns:
            MatchResult with overall score and component scores.
        """
        scores = {}

        # 1. Affinity (40%) - For new users, no transaction data = 0
        # This is intentional - we don't know their spending patterns yet
        scores["affinity"] = 0.0

        # 2. Match (30%) - Cuisine from quiz or venue-fit
        is_dining = venue.get("cuisine_type") is not None
        if is_dining:
            quiz_cuisines = user_taste.get("cuisine_preferences", [])
            scores["match"] = self._cuisine_score_from_list(quiz_cuisines, venue)
        else:
            scores["match"] = self._venue_type_fit_score(user_taste, venue)

        # 3. Compatibility (30%) - Price + Energy averaged
        price_score = calculate_price_match(
            user_taste.get("price_tier"),
            venue.get("price_tier"),
        )
        energy_score = calculate_energy_match(
            user_taste.get("vibes", []),
            venue.get("energy"),
        )
        scores["compatibility"] = (price_score + energy_score) / 2

        # Weighted sum
        total = sum(self.WEIGHTS[k] * scores[k] for k in self.WEIGHTS)
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

        # High affinity reason
        if scores.get("affinity", 0) > 0.5:
            cluster = venue.get("taste_cluster")
            if cluster:
                reasons.append(f"You love {cluster} spots")

        # Match reason (cuisine or venue-fit)
        if scores.get("match", 0) > 0.6:
            cuisine = venue.get("cuisine_type")
            cluster = venue.get("taste_cluster")
            if cuisine:
                reasons.append(f"Matches your {cuisine} preference")
            elif cluster == "coffee":
                reasons.append("Perfect for your vibe")
            elif cluster == "nightlife":
                reasons.append("Great for your social style")

        # Compatibility reason
        if scores.get("compatibility", 0) > 0.8:
            reasons.append("Right in your price range and vibe")

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
        Mood affects ranking only, not displayed score.

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
        "Other" category is excluded - only specific spending counts.

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
            return quiz_score

        # If no quiz data, use tx only
        if not quiz_cuisines:
            return tx_score

        # Weighted blend
        return (tx_score * tx_weight) + (quiz_score * quiz_weight)

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

        return 0.0

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

        # Bonus for coffee preference from quiz
        coffee_pref = user_taste.get("coffee_preference")
        if coffee_pref == "third_wave":
            score += 0.2
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
            score += 0.05

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
        score = 0.0

        # Vibe alignment (similar to coffee but less work-focused)
        user_vibes = set(user_taste.get("vibes", []))
        cozy_vibes = {"chill", "relaxed", "cozy", "casual"}
        vibe_overlap = len(user_vibes & cozy_vibes)
        score += min(vibe_overlap * 0.2, 0.4)

        # Best-for alignment
        best_for = venue.get("best_for", [])
        if "quick_bite" in best_for:
            score += 0.3
        if "casual_hangout" in best_for:
            score += 0.2

        return min(score, 1.0)
