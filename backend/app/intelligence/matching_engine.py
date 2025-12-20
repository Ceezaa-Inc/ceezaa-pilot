"""MatchingEngine - Weighted Sum Model for venue-user matching.

Uses a simple, interpretable scoring algorithm to rank venues based on
user taste profiles. No ML, no AI - just multiplication and addition.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from app.mappings.price_mappings import calculate_price_match
from app.mappings.vibe_mappings import calculate_energy_match, calculate_exploration_bonus
from app.mappings.mood_mappings import calculate_mood_boost


@dataclass
class MatchResult:
    """Result of scoring a venue against a user taste profile."""

    match_score: int  # 0-100 percentage
    scores: dict[str, float] = field(default_factory=dict)
    reasons: list[str] = field(default_factory=list)


class MatchingEngine:
    """Scores venues using Weighted Sum Model.

    Weights for established users (sum to 1.0):
    - Category affinity: 25%
    - Cuisine match: 25%
    - Price match: 20%
    - Energy/vibe match: 15%
    - Exploration bonus: 15%

    For new users (no transaction data), weights are rebalanced:
    - Cuisine match: 35%
    - Price match: 25%
    - Energy/vibe match: 20%
    - Exploration bonus: 20%
    """

    WEIGHTS = {
        "category": 0.25,
        "cuisine": 0.25,
        "price": 0.20,
        "energy": 0.15,
        "exploration": 0.15,
    }

    NEW_USER_WEIGHTS = {
        "cuisine": 0.35,
        "price": 0.25,
        "energy": 0.20,
        "exploration": 0.20,
    }

    def score(self, user_taste: dict[str, Any], venue: dict[str, Any]) -> MatchResult:
        """Score a venue for an established user with transaction history.

        Args:
            user_taste: User taste profile with categories, top_cuisines, vibes, etc.
            venue: Venue profile with taste_cluster, cuisine_type, energy, etc.

        Returns:
            MatchResult with overall score and component scores.
        """
        scores = {}

        # 1. Category Affinity (25%)
        scores["category"] = self._category_score(user_taste, venue)

        # 2. Cuisine Match (25%)
        scores["cuisine"] = self._cuisine_score(user_taste, venue)

        # 3. Price Match (20%)
        scores["price"] = calculate_price_match(
            user_taste.get("price_tier"),
            venue.get("price_tier"),
        )

        # 4. Energy/Vibe Match (15%)
        scores["energy"] = calculate_energy_match(
            user_taste.get("vibes", []),
            venue.get("energy"),
        )

        # 5. Exploration Bonus (15%)
        scores["exploration"] = calculate_exploration_bonus(
            user_taste.get("exploration_style"),
            venue.get("standout", []),
        )

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

        Uses cuisine_preferences from quiz instead of top_cuisines from transactions.
        Skips category scoring since no transaction data exists.

        Args:
            user_taste: User taste profile with cuisine_preferences from quiz.
            venue: Venue profile.

        Returns:
            MatchResult with overall score and component scores.
        """
        scores = {}

        # 1. Cuisine Match (35%) - Use quiz cuisine preferences
        quiz_cuisines = user_taste.get("cuisine_preferences", [])
        scores["cuisine"] = self._cuisine_score_from_list(quiz_cuisines, venue)

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

        # 4. Exploration Bonus (20%)
        scores["exploration"] = calculate_exploration_bonus(
            user_taste.get("exploration_style"),
            venue.get("standout", []),
        )

        # Weighted sum with new user weights
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
        if scores.get("category", 0) > 0.3:
            cluster = venue.get("taste_cluster")
            if cluster:
                reasons.append(f"You love {cluster} spots")

        # Price match reason
        if scores.get("price", 0) == 1.0:
            reasons.append("Right in your price range")

        # Exploration/hidden gem reason
        standout = venue.get("standout", [])
        if scores.get("exploration", 0) > 0 and "hidden_gem" in standout:
            reasons.append("Hidden gem for adventurous eaters")

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

            # Calculate mood boost
            mood_boost = calculate_mood_boost(
                mood,
                venue.get("energy"),
                venue.get("best_for", []),
                venue.get("standout", []),
            )

            # Final score capped at 99
            final_score = min(base_score + mood_boost, 99)

            results.append({
                "venue": venue,
                "match_score": final_score,
                "scores": base_result.scores,
            })

        # Sort by score descending
        results.sort(key=lambda x: x["match_score"], reverse=True)

        return results

    def _category_score(
        self, user_taste: dict[str, Any], venue: dict[str, Any]
    ) -> float:
        """Calculate category affinity score.

        Uses user's spending percentage in the venue's taste cluster.

        Returns:
            Score 0.0-1.0 (normalized from percentage).
        """
        categories = user_taste.get("categories", {})
        taste_cluster = venue.get("taste_cluster")

        if not taste_cluster or not categories:
            return 0.0

        # Get user's percentage in this category (0-100)
        category_pct = categories.get(taste_cluster, 0)

        # Normalize to 0-1
        return category_pct / 100

    def _cuisine_score(
        self, user_taste: dict[str, Any], venue: dict[str, Any]
    ) -> float:
        """Calculate cuisine match score from transaction-based top cuisines.

        Top cuisine = 1.0, #2 = 0.85, #3 = 0.70, etc.

        Returns:
            Score 0.0-1.0.
        """
        top_cuisines = user_taste.get("top_cuisines", [])
        return self._cuisine_score_from_list(top_cuisines, venue)

    def _cuisine_score_from_list(
        self, cuisines: list[str], venue: dict[str, Any]
    ) -> float:
        """Calculate cuisine match score from a list of cuisines.

        Args:
            cuisines: List of cuisines (ranked by preference).
            venue: Venue profile.

        Returns:
            Score 0.0-1.0. Top cuisine = 1.0, each rank down = -0.15.
            Non-dining venues (coffee, bakery, nightlife) get neutral score (0.5).
        """
        venue_cuisine = venue.get("cuisine_type")
        taste_cluster = venue.get("taste_cluster")

        # Non-dining venues shouldn't be penalized for cuisine
        # Give them a neutral score so other factors determine ranking
        non_dining_clusters = {"coffee", "bakery", "nightlife", "bar"}
        if taste_cluster and taste_cluster.lower() in non_dining_clusters:
            return 0.5  # Neutral score - doesn't help or hurt

        if not venue_cuisine or not cuisines:
            return 0.3  # Slight positive for venues without cuisine data

        if venue_cuisine not in cuisines:
            return 0.0

        rank = cuisines.index(venue_cuisine)
        # Top = 1.0, 2nd = 0.85, 3rd = 0.70, etc.
        return max(1.0 - (rank * 0.15), 0.0)
