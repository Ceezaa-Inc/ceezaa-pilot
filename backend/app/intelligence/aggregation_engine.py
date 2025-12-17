"""AggregationEngine for O(1) incremental transaction processing.

Processes transactions one at a time, updating aggregates in-place.
Never loops over all transactions - each ingest is constant time.
"""

from dataclasses import dataclass, field
from datetime import datetime, date
from decimal import Decimal
from typing import Optional

from app.models.plaid import ProcessedTransaction


@dataclass
class CategoryStats:
    """Statistics for a single taste category."""

    count: int = 0
    total_spend: Decimal = Decimal("0")
    merchants: set = field(default_factory=set)

    def to_dict(self) -> dict:
        """Convert to JSON-serializable dict."""
        return {
            "count": self.count,
            "total_spend": float(self.total_spend),
            "merchants": list(self.merchants),
        }


@dataclass
class StreakData:
    """Streak tracking for a category."""

    current: int = 0
    longest: int = 0
    last_date: Optional[date] = None

    def to_dict(self) -> dict:
        """Convert to JSON-serializable dict."""
        return {
            "current": self.current,
            "longest": self.longest,
            "last_date": self.last_date.isoformat() if self.last_date else None,
        }


@dataclass
class ExplorationData:
    """Exploration tracking for a category (unique vs total merchants)."""

    unique: int = 0
    total: int = 0
    seen_merchants: set = field(default_factory=set)

    def to_dict(self) -> dict:
        """Convert to JSON-serializable dict."""
        return {
            "unique": self.unique,
            "total": self.total,
        }


@dataclass
class UserAnalysis:
    """User's aggregated transaction analysis.

    This mirrors the user_analysis table schema.
    """

    user_id: str

    # Category aggregates
    categories: dict[str, CategoryStats] = field(default_factory=dict)

    # Time patterns
    time_buckets: dict[str, int] = field(default_factory=dict)
    day_types: dict[str, int] = field(default_factory=dict)

    # Merchant data
    merchant_visits: dict[str, int] = field(default_factory=dict)
    top_merchants: list[dict] = field(default_factory=list)

    # Behavioral patterns
    streaks: dict[str, StreakData] = field(default_factory=dict)
    exploration: dict[str, ExplorationData] = field(default_factory=dict)

    # Meta
    total_transactions: int = 0
    first_transaction_at: Optional[datetime] = None
    last_transaction_at: Optional[datetime] = None
    version: int = 0

    def to_dict(self) -> dict:
        """Convert to JSON-serializable dict for database storage."""
        return {
            "user_id": self.user_id,
            "categories": {k: v.to_dict() for k, v in self.categories.items()},
            "time_buckets": self.time_buckets,
            "day_types": self.day_types,
            "merchant_visits": self.merchant_visits,
            "top_merchants": self.top_merchants,
            "streaks": {k: v.to_dict() for k, v in self.streaks.items()},
            "exploration": {k: v.to_dict() for k, v in self.exploration.items()},
            "total_transactions": self.total_transactions,
            "first_transaction_at": (
                self.first_transaction_at.isoformat()
                if self.first_transaction_at
                else None
            ),
            "last_transaction_at": (
                self.last_transaction_at.isoformat()
                if self.last_transaction_at
                else None
            ),
            "version": self.version,
        }

    @classmethod
    def from_dict(cls, data: dict) -> "UserAnalysis":
        """Create UserAnalysis from database dict."""
        analysis = cls(user_id=data["user_id"])

        # Parse categories
        for cat_name, cat_data in data.get("categories", {}).items():
            analysis.categories[cat_name] = CategoryStats(
                count=cat_data["count"],
                total_spend=Decimal(str(cat_data["total_spend"])),
                merchants=set(cat_data.get("merchants", [])),
            )

        # Parse time patterns
        analysis.time_buckets = data.get("time_buckets", {})
        analysis.day_types = data.get("day_types", {})

        # Parse merchant data
        analysis.merchant_visits = data.get("merchant_visits", {})
        analysis.top_merchants = data.get("top_merchants", [])

        # Parse streaks
        for cat_name, streak_data in data.get("streaks", {}).items():
            last_date = None
            if streak_data.get("last_date"):
                last_date = date.fromisoformat(streak_data["last_date"])
            analysis.streaks[cat_name] = StreakData(
                current=streak_data["current"],
                longest=streak_data["longest"],
                last_date=last_date,
            )

        # Parse exploration
        for cat_name, exp_data in data.get("exploration", {}).items():
            analysis.exploration[cat_name] = ExplorationData(
                unique=exp_data["unique"],
                total=exp_data["total"],
                seen_merchants=set(),  # Not stored in DB, rebuilt from categories
            )

        # Parse meta
        analysis.total_transactions = data.get("total_transactions", 0)
        if data.get("first_transaction_at"):
            analysis.first_transaction_at = datetime.fromisoformat(
                data["first_transaction_at"]
            )
        if data.get("last_transaction_at"):
            analysis.last_transaction_at = datetime.fromisoformat(
                data["last_transaction_at"]
            )
        analysis.version = data.get("version", 0)

        return analysis


class AggregationEngine:
    """Engine for O(1) incremental transaction aggregation.

    Each call to ingest() processes a single transaction and updates
    all aggregates in constant time. Never loops over all transactions.
    """

    def __init__(self, top_merchants_limit: int = 10):
        """Initialize engine with configuration."""
        self.top_merchants_limit = top_merchants_limit

    def ingest(
        self, txn: ProcessedTransaction, analysis: UserAnalysis
    ) -> UserAnalysis:
        """Ingest a single transaction and update all aggregates.

        All operations are O(1) - no loops over previous transactions.

        Args:
            txn: The transaction to process
            analysis: Current analysis state to update

        Returns:
            Updated analysis (same object, mutated in place)
        """
        # 1. Update category aggregates
        self._update_category(txn, analysis)

        # 2. Update time bucket distribution
        self._update_time_bucket(txn, analysis)

        # 3. Update day type distribution
        self._update_day_type(txn, analysis)

        # 4. Update merchant visits
        self._update_merchant_visits(txn, analysis)

        # 5. Update exploration tracking
        self._update_exploration(txn, analysis)

        # 6. Update streaks
        self._update_streaks(txn, analysis)

        # 7. Update metadata
        self._update_metadata(txn, analysis)

        return analysis

    def _update_category(
        self, txn: ProcessedTransaction, analysis: UserAnalysis
    ) -> None:
        """Update category count, spend, and merchants."""
        category = txn.taste_category

        if category not in analysis.categories:
            analysis.categories[category] = CategoryStats()

        stats = analysis.categories[category]
        stats.count += 1
        stats.total_spend += Decimal(str(txn.amount))

        # Track merchant in this category
        merchant_key = txn.merchant_id or txn.merchant_name
        if merchant_key:
            stats.merchants.add(merchant_key)

    def _update_time_bucket(
        self, txn: ProcessedTransaction, analysis: UserAnalysis
    ) -> None:
        """Update time bucket distribution."""
        bucket = txn.time_bucket
        analysis.time_buckets[bucket] = analysis.time_buckets.get(bucket, 0) + 1

    def _update_day_type(
        self, txn: ProcessedTransaction, analysis: UserAnalysis
    ) -> None:
        """Update weekday/weekend distribution."""
        day_type = txn.day_type
        analysis.day_types[day_type] = analysis.day_types.get(day_type, 0) + 1

    def _update_merchant_visits(
        self, txn: ProcessedTransaction, analysis: UserAnalysis
    ) -> None:
        """Update merchant visit counts and top merchants list."""
        merchant_key = txn.merchant_id or txn.merchant_name
        if not merchant_key:
            return

        # Increment visit count
        analysis.merchant_visits[merchant_key] = (
            analysis.merchant_visits.get(merchant_key, 0) + 1
        )

        # Update top merchants list
        self._rebuild_top_merchants(analysis, merchant_key, txn.merchant_name)

    def _rebuild_top_merchants(
        self, analysis: UserAnalysis, merchant_key: str, merchant_name: str
    ) -> None:
        """Rebuild top merchants list efficiently.

        Only updates if the merchant could be in the top N.
        """
        current_count = analysis.merchant_visits[merchant_key]

        # Check if merchant already in top list
        existing_idx = None
        for idx, m in enumerate(analysis.top_merchants):
            if m["merchant_id"] == merchant_key:
                existing_idx = idx
                break

        if existing_idx is not None:
            # Update existing entry
            analysis.top_merchants[existing_idx]["count"] = current_count
        else:
            # Check if should be added
            if len(analysis.top_merchants) < self.top_merchants_limit:
                analysis.top_merchants.append(
                    {
                        "merchant_id": merchant_key,
                        "merchant_name": merchant_name,
                        "count": current_count,
                    }
                )
            else:
                # Check if beats the lowest
                min_count = min(m["count"] for m in analysis.top_merchants)
                if current_count > min_count:
                    # Remove lowest and add new
                    analysis.top_merchants = [
                        m
                        for m in analysis.top_merchants
                        if m["count"] > min_count
                        or m == analysis.top_merchants[-1]
                    ]
                    if len(analysis.top_merchants) >= self.top_merchants_limit:
                        # Find and remove actual minimum
                        min_idx = min(
                            range(len(analysis.top_merchants)),
                            key=lambda i: analysis.top_merchants[i]["count"],
                        )
                        analysis.top_merchants.pop(min_idx)
                    analysis.top_merchants.append(
                        {
                            "merchant_id": merchant_key,
                            "merchant_name": merchant_name,
                            "count": current_count,
                        }
                    )

        # Sort by count descending
        analysis.top_merchants.sort(key=lambda m: m["count"], reverse=True)

    def _update_exploration(
        self, txn: ProcessedTransaction, analysis: UserAnalysis
    ) -> None:
        """Update exploration tracking (unique merchants per category)."""
        category = txn.taste_category
        merchant_key = txn.merchant_id or txn.merchant_name
        if not merchant_key:
            return

        if category not in analysis.exploration:
            analysis.exploration[category] = ExplorationData()

        exp = analysis.exploration[category]
        exp.total += 1

        # Check if new unique merchant
        if merchant_key not in exp.seen_merchants:
            exp.seen_merchants.add(merchant_key)
            exp.unique += 1

    def _update_streaks(
        self, txn: ProcessedTransaction, analysis: UserAnalysis
    ) -> None:
        """Update consecutive day streaks per category."""
        category = txn.taste_category
        txn_date = txn.timestamp.date()

        if category not in analysis.streaks:
            analysis.streaks[category] = StreakData()

        streak = analysis.streaks[category]

        if streak.last_date is None:
            # First transaction in this category
            streak.current = 1
            streak.longest = 1
            streak.last_date = txn_date
        else:
            days_diff = (txn_date - streak.last_date).days

            if days_diff == 0:
                # Same day, no streak change
                pass
            elif days_diff == 1:
                # Consecutive day, increment streak
                streak.current += 1
                streak.longest = max(streak.longest, streak.current)
                streak.last_date = txn_date
            else:
                # Gap in days, reset current streak
                streak.current = 1
                streak.last_date = txn_date

    def _update_metadata(
        self, txn: ProcessedTransaction, analysis: UserAnalysis
    ) -> None:
        """Update transaction count and timestamps."""
        analysis.total_transactions += 1

        if analysis.first_transaction_at is None:
            analysis.first_transaction_at = txn.timestamp

        analysis.last_transaction_at = txn.timestamp
