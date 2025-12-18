"""TasteFusion - Merges declared taste (quiz) with observed taste (transactions).

This is a rule-based fusion algorithm (no AI). Uses weighted averaging
based on transaction volume to combine quiz preferences with observed behavior.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional

from app.intelligence.quiz_processor import DeclaredTaste
from app.intelligence.aggregation_engine import UserAnalysis


# Category colors for ring display
CATEGORY_COLORS = {
    "coffee": "#8B4513",      # Saddle Brown
    "dining": "#D4AF37",      # Gold
    "nightlife": "#4B0082",   # Indigo
    "entertainment": "#FF6347",  # Tomato
    "fitness": "#32CD32",     # Lime Green
    "shopping": "#FF69B4",    # Hot Pink
    "groceries": "#228B22",   # Forest Green
    "fast_food": "#FF8C00",   # Dark Orange
    "travel": "#4169E1",      # Royal Blue
    "other": "#808080",       # Gray
}


def format_category_name(name: str) -> str:
    """Format category name for display (title case, replace underscores)."""
    return name.replace("_", " ").title()


@dataclass
class CategoryScore:
    """A single category with its fused score for ring display."""

    name: str
    percentage: int  # 0-100
    color: str
    count: int = 0
    total_spend: float = 0.0


@dataclass
class FusedTaste:
    """Fused taste profile combining declared + observed data."""

    categories: list[CategoryScore] = field(default_factory=list)
    vibes: list[str] = field(default_factory=list)
    top_cuisines: list[str] = field(default_factory=list)  # From observed transactions
    exploration_ratio: float = 0.0
    confidence: float = 0.0
    quiz_weight: float = 1.0
    tx_weight: float = 0.0
    mismatches: list[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        """Convert to JSON-serializable dict for DB storage."""
        return {
            "categories": [
                {
                    "name": c.name,
                    "percentage": c.percentage,
                    "color": c.color,
                    "count": c.count,
                    "total_spend": c.total_spend,
                }
                for c in self.categories
            ],
            "vibes": self.vibes,
            "top_cuisines": self.top_cuisines,
            "exploration_ratio": self.exploration_ratio,
            "confidence": self.confidence,
            "quiz_weight": self.quiz_weight,
            "tx_weight": self.tx_weight,
            "mismatches": self.mismatches,
        }


class TasteFusion:
    """Fuses declared taste with observed taste using weighted algorithm.

    The weighting is based on transaction volume:
    - 0 transactions: 100% quiz, 0% transactions
    - 25 transactions: 50% quiz, 50% transactions
    - 50+ transactions: 30% quiz, 70% transactions (capped)

    Example:
        fusion = TasteFusion()
        fused = fusion.fuse(declared_taste, user_analysis)
    """

    def __init__(self, max_tx_weight: float = 0.7):
        """Initialize with configurable max transaction weight.

        Args:
            max_tx_weight: Maximum weight for transaction data (default 0.7)
        """
        self.max_tx_weight = max_tx_weight

    def fuse(
        self, declared: DeclaredTaste, observed: UserAnalysis
    ) -> FusedTaste:
        """Fuse declared and observed taste into unified profile.

        Args:
            declared: Taste profile from quiz answers
            observed: Analysis from transaction data

        Returns:
            FusedTaste with weighted combination
        """
        # Calculate weights based on transaction count
        tx_weight, quiz_weight = self._calculate_weights(
            observed.total_transactions
        )

        # Calculate confidence
        confidence = self._calculate_confidence(observed.total_transactions)

        # Calculate exploration ratio
        exploration_ratio = self._calculate_exploration_ratio(observed)

        # Build category scores from observed data
        categories = self._build_category_scores(observed)

        return FusedTaste(
            categories=categories,
            vibes=list(declared.vibe_preferences),
            top_cuisines=observed.top_cuisines,
            exploration_ratio=exploration_ratio,
            confidence=confidence,
            quiz_weight=quiz_weight,
            tx_weight=tx_weight,
            mismatches=[],
        )

    def _calculate_weights(
        self, transaction_count: int
    ) -> tuple[float, float]:
        """Calculate tx/quiz weights based on transaction volume.

        Args:
            transaction_count: Number of transactions

        Returns:
            Tuple of (tx_weight, quiz_weight)
        """
        if transaction_count == 0:
            return 0.0, 1.0

        # Linear scale up to 50 transactions, then cap at max_tx_weight
        tx_weight = min(transaction_count / 50, self.max_tx_weight)
        quiz_weight = 1.0 - tx_weight

        return tx_weight, quiz_weight

    def _calculate_confidence(self, transaction_count: int) -> float:
        """Calculate confidence score based on data volume.

        Args:
            transaction_count: Number of transactions

        Returns:
            Confidence score 0-1
        """
        if transaction_count == 0:
            return 0.0
        if transaction_count >= 100:
            return 1.0

        # Linear scale from 0.1 at 1 tx to 1.0 at 100 tx
        return 0.1 + (transaction_count / 100) * 0.9

    def _calculate_exploration_ratio(self, observed: UserAnalysis) -> float:
        """Calculate exploration ratio (unique merchants / total visits).

        Args:
            observed: User analysis data

        Returns:
            Exploration ratio 0-1
        """
        if observed.total_transactions == 0:
            return 0.0

        unique_merchants = len(observed.merchant_visits)
        return unique_merchants / observed.total_transactions

    def _build_category_scores(
        self, observed: UserAnalysis
    ) -> list[CategoryScore]:
        """Build category scores from observed transaction data.

        Args:
            observed: User analysis data

        Returns:
            List of CategoryScore objects with percentages
        """
        if observed.total_transactions == 0 or not observed.categories:
            return []

        scores = []
        total_count = observed.total_transactions

        for cat_name, cat_stats in observed.categories.items():
            percentage = round((cat_stats.count / total_count) * 100)
            color = CATEGORY_COLORS.get(cat_name, CATEGORY_COLORS["other"])
            display_name = format_category_name(cat_name)

            scores.append(
                CategoryScore(
                    name=display_name,
                    percentage=percentage,
                    color=color,
                    count=cat_stats.count,
                    total_spend=float(cat_stats.total_spend),
                )
            )

        # Sort by percentage descending
        scores.sort(key=lambda x: x.percentage, reverse=True)

        # Ensure percentages sum to 100 (adjust largest if rounding errors)
        total_pct = sum(s.percentage for s in scores)
        if scores and total_pct != 100:
            diff = 100 - total_pct
            scores[0].percentage += diff

        return scores
