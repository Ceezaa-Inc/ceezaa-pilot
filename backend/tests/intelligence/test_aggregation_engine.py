"""Tests for AggregationEngine - TDD RED phase.

The AggregationEngine processes transactions with O(1) incremental updates.
Each transaction is ingested one at a time, updating aggregates in-place.
"""

import pytest
from datetime import datetime, date
from decimal import Decimal

from app.intelligence.aggregation_engine import (
    AggregationEngine,
    UserAnalysis,
    CategoryStats,
)
from app.models.plaid import ProcessedTransaction


@pytest.fixture
def engine():
    """Create a fresh AggregationEngine instance."""
    return AggregationEngine()


@pytest.fixture
def empty_analysis():
    """Create an empty UserAnalysis to start fresh."""
    return UserAnalysis(user_id="test-user-123")


@pytest.fixture
def sample_coffee_txn():
    """Sample coffee transaction."""
    return ProcessedTransaction(
        id="txn-001",
        amount=5.50,
        timestamp=datetime(2024, 1, 15, 9, 30),  # Monday morning
        merchant_name="Blue Bottle Coffee",
        merchant_id="merchant-bb",
        taste_category="coffee",
        time_bucket="morning",
        day_type="weekday",
        payment_channel="in store",
        pending=False,
    )


@pytest.fixture
def sample_dining_txn():
    """Sample dining transaction."""
    return ProcessedTransaction(
        id="txn-002",
        amount=45.00,
        timestamp=datetime(2024, 1, 15, 19, 30),  # Monday evening
        merchant_name="Osteria Francescana",
        merchant_id="merchant-of",
        taste_category="dining",
        time_bucket="evening",
        day_type="weekday",
        payment_channel="in store",
        pending=False,
    )


class TestCategoryAggregation:
    """Test category count, spend, and merchant tracking."""

    def test_first_transaction_creates_category(
        self, engine, empty_analysis, sample_coffee_txn
    ):
        """First transaction in a category should create the category entry."""
        result = engine.ingest(sample_coffee_txn, empty_analysis)

        assert "coffee" in result.categories
        assert result.categories["coffee"].count == 1
        assert result.categories["coffee"].total_spend == Decimal("5.50")
        assert "merchant-bb" in result.categories["coffee"].merchants

    def test_second_transaction_increments_count(
        self, engine, empty_analysis, sample_coffee_txn
    ):
        """Second transaction should increment count, not reset."""
        # First transaction
        result = engine.ingest(sample_coffee_txn, empty_analysis)

        # Create second coffee transaction
        second_txn = ProcessedTransaction(
            id="txn-003",
            amount=4.75,
            timestamp=datetime(2024, 1, 16, 8, 0),
            merchant_name="Stumptown Coffee",
            merchant_id="merchant-st",
            taste_category="coffee",
            time_bucket="morning",
            day_type="weekday",
            payment_channel="in store",
            pending=False,
        )

        result = engine.ingest(second_txn, result)

        assert result.categories["coffee"].count == 2
        assert result.categories["coffee"].total_spend == Decimal("10.25")
        assert len(result.categories["coffee"].merchants) == 2

    def test_different_categories_tracked_separately(
        self, engine, empty_analysis, sample_coffee_txn, sample_dining_txn
    ):
        """Different categories should be tracked independently."""
        result = engine.ingest(sample_coffee_txn, empty_analysis)
        result = engine.ingest(sample_dining_txn, result)

        assert result.categories["coffee"].count == 1
        assert result.categories["dining"].count == 1
        assert result.categories["coffee"].total_spend == Decimal("5.50")
        assert result.categories["dining"].total_spend == Decimal("45.00")


class TestTimeBucketTracking:
    """Test time bucket distribution tracking."""

    def test_morning_transaction_increments_morning(
        self, engine, empty_analysis, sample_coffee_txn
    ):
        """Morning transaction should increment morning bucket."""
        result = engine.ingest(sample_coffee_txn, empty_analysis)

        assert result.time_buckets.get("morning", 0) == 1
        assert result.time_buckets.get("evening", 0) == 0

    def test_multiple_time_buckets(
        self, engine, empty_analysis, sample_coffee_txn, sample_dining_txn
    ):
        """Multiple transactions should populate multiple buckets."""
        result = engine.ingest(sample_coffee_txn, empty_analysis)  # morning
        result = engine.ingest(sample_dining_txn, result)  # evening

        assert result.time_buckets["morning"] == 1
        assert result.time_buckets["evening"] == 1


class TestDayTypeTracking:
    """Test weekday/weekend distribution tracking."""

    def test_weekday_transaction_increments_weekday(
        self, engine, empty_analysis, sample_coffee_txn
    ):
        """Weekday transaction should increment weekday count."""
        result = engine.ingest(sample_coffee_txn, empty_analysis)

        assert result.day_types.get("weekday", 0) == 1
        assert result.day_types.get("weekend", 0) == 0

    def test_weekend_transaction_increments_weekend(self, engine, empty_analysis):
        """Weekend transaction should increment weekend count."""
        weekend_txn = ProcessedTransaction(
            id="txn-weekend",
            amount=75.00,
            timestamp=datetime(2024, 1, 13, 12, 0),  # Saturday
            merchant_name="Brunch Place",
            merchant_id="merchant-brunch",
            taste_category="dining",
            time_bucket="afternoon",
            day_type="weekend",
            payment_channel="in store",
            pending=False,
        )

        result = engine.ingest(weekend_txn, empty_analysis)

        assert result.day_types.get("weekend", 0) == 1
        assert result.day_types.get("weekday", 0) == 0


class TestMerchantTracking:
    """Test merchant visit counting and top merchants."""

    def test_first_visit_to_merchant_creates_entry(
        self, engine, empty_analysis, sample_coffee_txn
    ):
        """First visit to a merchant should create entry with count 1."""
        result = engine.ingest(sample_coffee_txn, empty_analysis)

        assert result.merchant_visits.get("merchant-bb", 0) == 1

    def test_repeat_visits_increment_count(self, engine, empty_analysis):
        """Repeat visits to same merchant should increment count."""
        txn1 = ProcessedTransaction(
            id="txn-001",
            amount=5.50,
            timestamp=datetime(2024, 1, 15, 9, 0),
            merchant_name="Blue Bottle",
            merchant_id="merchant-bb",
            taste_category="coffee",
            time_bucket="morning",
            day_type="weekday",
            payment_channel="in store",
            pending=False,
        )
        txn2 = ProcessedTransaction(
            id="txn-002",
            amount=5.50,
            timestamp=datetime(2024, 1, 16, 9, 0),
            merchant_name="Blue Bottle",
            merchant_id="merchant-bb",
            taste_category="coffee",
            time_bucket="morning",
            day_type="weekday",
            payment_channel="in store",
            pending=False,
        )

        result = engine.ingest(txn1, empty_analysis)
        result = engine.ingest(txn2, result)

        assert result.merchant_visits["merchant-bb"] == 2

    def test_top_merchants_updated_correctly(self, engine, empty_analysis):
        """Top merchants should be sorted by visit count."""
        # Create transactions for multiple merchants
        for i in range(5):
            txn = ProcessedTransaction(
                id=f"txn-bb-{i}",
                amount=5.00,
                timestamp=datetime(2024, 1, 15 + i, 9, 0),
                merchant_name="Blue Bottle",
                merchant_id="merchant-bb",
                taste_category="coffee",
                time_bucket="morning",
                day_type="weekday",
                payment_channel="in store",
                pending=False,
            )
            empty_analysis = engine.ingest(txn, empty_analysis)

        for i in range(3):
            txn = ProcessedTransaction(
                id=f"txn-st-{i}",
                amount=4.50,
                timestamp=datetime(2024, 1, 20 + i, 9, 0),
                merchant_name="Stumptown",
                merchant_id="merchant-st",
                taste_category="coffee",
                time_bucket="morning",
                day_type="weekday",
                payment_channel="in store",
                pending=False,
            )
            empty_analysis = engine.ingest(txn, empty_analysis)

        result = empty_analysis
        assert len(result.top_merchants) >= 2
        # Blue Bottle should be first (5 visits vs 3)
        assert result.top_merchants[0]["merchant_id"] == "merchant-bb"
        assert result.top_merchants[0]["count"] == 5


class TestMetadata:
    """Test metadata tracking (total count, timestamps)."""

    def test_total_transactions_incremented(
        self, engine, empty_analysis, sample_coffee_txn
    ):
        """Total transaction count should increment."""
        assert empty_analysis.total_transactions == 0

        result = engine.ingest(sample_coffee_txn, empty_analysis)
        assert result.total_transactions == 1

        result = engine.ingest(sample_coffee_txn, result)
        assert result.total_transactions == 2

    def test_first_transaction_timestamp_set(
        self, engine, empty_analysis, sample_coffee_txn
    ):
        """First transaction should set first_transaction_at."""
        result = engine.ingest(sample_coffee_txn, empty_analysis)

        assert result.first_transaction_at == sample_coffee_txn.timestamp

    def test_last_transaction_timestamp_updated(
        self, engine, empty_analysis, sample_coffee_txn, sample_dining_txn
    ):
        """Last transaction timestamp should always update."""
        result = engine.ingest(sample_coffee_txn, empty_analysis)
        result = engine.ingest(sample_dining_txn, result)

        assert result.last_transaction_at == sample_dining_txn.timestamp


class TestExplorationTracking:
    """Test unique merchant tracking per category (exploration ratio)."""

    def test_unique_merchants_tracked_per_category(self, engine, empty_analysis):
        """Each new merchant in a category should increment unique count."""
        txn1 = ProcessedTransaction(
            id="txn-001",
            amount=50.00,
            timestamp=datetime(2024, 1, 15, 19, 0),
            merchant_name="Restaurant A",
            merchant_id="merchant-a",
            taste_category="dining",
            time_bucket="evening",
            day_type="weekday",
            payment_channel="in store",
            pending=False,
        )
        txn2 = ProcessedTransaction(
            id="txn-002",
            amount=60.00,
            timestamp=datetime(2024, 1, 16, 19, 0),
            merchant_name="Restaurant B",
            merchant_id="merchant-b",
            taste_category="dining",
            time_bucket="evening",
            day_type="weekday",
            payment_channel="in store",
            pending=False,
        )

        result = engine.ingest(txn1, empty_analysis)
        result = engine.ingest(txn2, result)

        assert result.exploration["dining"].unique == 2
        assert result.exploration["dining"].total == 2

    def test_repeat_merchant_increments_total_not_unique(self, engine, empty_analysis):
        """Revisiting same merchant should increment total but not unique."""
        txn1 = ProcessedTransaction(
            id="txn-001",
            amount=50.00,
            timestamp=datetime(2024, 1, 15, 19, 0),
            merchant_name="Favorite Restaurant",
            merchant_id="merchant-fav",
            taste_category="dining",
            time_bucket="evening",
            day_type="weekday",
            payment_channel="in store",
            pending=False,
        )
        txn2 = ProcessedTransaction(
            id="txn-002",
            amount=55.00,
            timestamp=datetime(2024, 1, 22, 19, 0),
            merchant_name="Favorite Restaurant",
            merchant_id="merchant-fav",
            taste_category="dining",
            time_bucket="evening",
            day_type="weekday",
            payment_channel="in store",
            pending=False,
        )

        result = engine.ingest(txn1, empty_analysis)
        result = engine.ingest(txn2, result)

        assert result.exploration["dining"].unique == 1
        assert result.exploration["dining"].total == 2


class TestStreakTracking:
    """Test consecutive day streak tracking per category."""

    def test_first_day_starts_streak_at_one(
        self, engine, empty_analysis, sample_coffee_txn
    ):
        """First transaction should start streak at 1."""
        result = engine.ingest(sample_coffee_txn, empty_analysis)

        assert result.streaks["coffee"].current == 1
        assert result.streaks["coffee"].longest == 1

    def test_consecutive_days_increment_streak(self, engine, empty_analysis):
        """Transactions on consecutive days should increment streak."""
        txn_day1 = ProcessedTransaction(
            id="txn-001",
            amount=5.50,
            timestamp=datetime(2024, 1, 15, 9, 0),  # Monday
            merchant_name="Coffee Shop",
            merchant_id="merchant-cs",
            taste_category="coffee",
            time_bucket="morning",
            day_type="weekday",
            payment_channel="in store",
            pending=False,
        )
        txn_day2 = ProcessedTransaction(
            id="txn-002",
            amount=5.50,
            timestamp=datetime(2024, 1, 16, 9, 0),  # Tuesday
            merchant_name="Coffee Shop",
            merchant_id="merchant-cs",
            taste_category="coffee",
            time_bucket="morning",
            day_type="weekday",
            payment_channel="in store",
            pending=False,
        )
        txn_day3 = ProcessedTransaction(
            id="txn-003",
            amount=5.50,
            timestamp=datetime(2024, 1, 17, 9, 0),  # Wednesday
            merchant_name="Coffee Shop",
            merchant_id="merchant-cs",
            taste_category="coffee",
            time_bucket="morning",
            day_type="weekday",
            payment_channel="in store",
            pending=False,
        )

        result = engine.ingest(txn_day1, empty_analysis)
        result = engine.ingest(txn_day2, result)
        result = engine.ingest(txn_day3, result)

        assert result.streaks["coffee"].current == 3
        assert result.streaks["coffee"].longest == 3

    def test_gap_in_days_resets_current_streak(self, engine, empty_analysis):
        """Gap of more than 1 day should reset current streak but preserve longest."""
        txn_day1 = ProcessedTransaction(
            id="txn-001",
            amount=5.50,
            timestamp=datetime(2024, 1, 15, 9, 0),  # Monday
            merchant_name="Coffee Shop",
            merchant_id="merchant-cs",
            taste_category="coffee",
            time_bucket="morning",
            day_type="weekday",
            payment_channel="in store",
            pending=False,
        )
        txn_day2 = ProcessedTransaction(
            id="txn-002",
            amount=5.50,
            timestamp=datetime(2024, 1, 16, 9, 0),  # Tuesday
            merchant_name="Coffee Shop",
            merchant_id="merchant-cs",
            taste_category="coffee",
            time_bucket="morning",
            day_type="weekday",
            payment_channel="in store",
            pending=False,
        )
        # Skip Wednesday, Thursday
        txn_day5 = ProcessedTransaction(
            id="txn-003",
            amount=5.50,
            timestamp=datetime(2024, 1, 19, 9, 0),  # Friday (3 days later)
            merchant_name="Coffee Shop",
            merchant_id="merchant-cs",
            taste_category="coffee",
            time_bucket="morning",
            day_type="weekday",
            payment_channel="in store",
            pending=False,
        )

        result = engine.ingest(txn_day1, empty_analysis)
        result = engine.ingest(txn_day2, result)
        result = engine.ingest(txn_day5, result)

        assert result.streaks["coffee"].current == 1  # Reset
        assert result.streaks["coffee"].longest == 2  # Preserved


class TestCuisineTracking:
    """Test cuisine distribution tracking from Plaid detailed categories."""

    def test_first_cuisine_creates_entry(self, engine, empty_analysis):
        """First transaction with cuisine should create cuisine entry."""
        txn = ProcessedTransaction(
            id="txn-asian-001",
            amount=35.00,
            timestamp=datetime(2024, 1, 15, 19, 0),
            merchant_name="Sushi Place",
            merchant_id="merchant-sushi",
            taste_category="dining",
            cuisine="asian",  # NEW field
            time_bucket="evening",
            day_type="weekday",
            payment_channel="in store",
            pending=False,
        )

        result = engine.ingest(txn, empty_analysis)

        assert result.cuisines.get("asian", 0) == 1
        assert "asian" in result.top_cuisines

    def test_multiple_cuisines_tracked_independently(self, engine, empty_analysis):
        """Different cuisines should be tracked separately."""
        txn_asian = ProcessedTransaction(
            id="txn-asian-001",
            amount=35.00,
            timestamp=datetime(2024, 1, 15, 19, 0),
            merchant_name="Asian Fusion",
            merchant_id="merchant-af",
            taste_category="dining",
            cuisine="asian",
            time_bucket="evening",
            day_type="weekday",
            payment_channel="in store",
            pending=False,
        )
        txn_italian = ProcessedTransaction(
            id="txn-italian-001",
            amount=50.00,
            timestamp=datetime(2024, 1, 16, 19, 0),
            merchant_name="Italian Trattoria",
            merchant_id="merchant-it",
            taste_category="dining",
            cuisine="european",
            time_bucket="evening",
            day_type="weekday",
            payment_channel="in store",
            pending=False,
        )

        result = engine.ingest(txn_asian, empty_analysis)
        result = engine.ingest(txn_italian, result)

        assert result.cuisines["asian"] == 1
        assert result.cuisines["european"] == 1

    def test_repeated_cuisine_increments_count(self, engine, empty_analysis):
        """Multiple transactions of same cuisine should increment count."""
        for i in range(5):
            txn = ProcessedTransaction(
                id=f"txn-sushi-{i}",
                amount=30.00 + i,
                timestamp=datetime(2024, 1, 15 + i, 19, 0),
                merchant_name=f"Sushi Restaurant {i}",
                merchant_id=f"merchant-sushi-{i}",
                taste_category="dining",
                cuisine="sushi",
                time_bucket="evening",
                day_type="weekday",
                payment_channel="in store",
                pending=False,
            )
            empty_analysis = engine.ingest(txn, empty_analysis)

        result = empty_analysis
        assert result.cuisines["sushi"] == 5

    def test_top_cuisines_limited_to_5(self, engine, empty_analysis):
        """top_cuisines list should only contain top 5 cuisines."""
        cuisines = ["asian", "sushi", "thai", "indian", "italian", "mexican", "american", "pizza"]

        # Create transactions for 8 different cuisines with varying counts
        for idx, cuisine in enumerate(cuisines):
            count = 10 - idx  # First cuisine has most transactions
            for i in range(count):
                txn = ProcessedTransaction(
                    id=f"txn-{cuisine}-{i}",
                    amount=30.00,
                    timestamp=datetime(2024, 1, 15, 19, 0),
                    merchant_name=f"{cuisine} Restaurant",
                    merchant_id=f"merchant-{cuisine}-{i}",
                    taste_category="dining",
                    cuisine=cuisine,
                    time_bucket="evening",
                    day_type="weekday",
                    payment_channel="in store",
                    pending=False,
                )
                empty_analysis = engine.ingest(txn, empty_analysis)

        result = empty_analysis
        assert len(result.top_cuisines) == 5
        # Top 5 should be asian, sushi, thai, indian, italian (highest counts)
        assert result.top_cuisines[0] == "asian"  # 10 transactions
        assert "mexican" not in result.top_cuisines  # Only 4 transactions
        assert "american" not in result.top_cuisines  # Only 3 transactions
        assert "pizza" not in result.top_cuisines  # Only 2 transactions

    def test_top_cuisines_sorted_by_count(self, engine, empty_analysis):
        """top_cuisines should be sorted by transaction count descending."""
        # Create 3 sushi, 5 thai, 2 indian transactions
        for i in range(3):
            txn = ProcessedTransaction(
                id=f"txn-sushi-{i}",
                amount=30.00,
                timestamp=datetime(2024, 1, 15, 19, 0),
                merchant_name="Sushi Place",
                merchant_id="merchant-sushi",
                taste_category="dining",
                cuisine="sushi",
                time_bucket="evening",
                day_type="weekday",
                payment_channel="in store",
                pending=False,
            )
            empty_analysis = engine.ingest(txn, empty_analysis)

        for i in range(5):
            txn = ProcessedTransaction(
                id=f"txn-thai-{i}",
                amount=25.00,
                timestamp=datetime(2024, 1, 16, 19, 0),
                merchant_name="Thai Kitchen",
                merchant_id="merchant-thai",
                taste_category="dining",
                cuisine="thai",
                time_bucket="evening",
                day_type="weekday",
                payment_channel="in store",
                pending=False,
            )
            empty_analysis = engine.ingest(txn, empty_analysis)

        for i in range(2):
            txn = ProcessedTransaction(
                id=f"txn-indian-{i}",
                amount=28.00,
                timestamp=datetime(2024, 1, 17, 19, 0),
                merchant_name="Indian Curry House",
                merchant_id="merchant-indian",
                taste_category="dining",
                cuisine="indian",
                time_bucket="evening",
                day_type="weekday",
                payment_channel="in store",
                pending=False,
            )
            empty_analysis = engine.ingest(txn, empty_analysis)

        result = empty_analysis
        # Order should be: thai (5), sushi (3), indian (2)
        assert result.top_cuisines[0] == "thai"
        assert result.top_cuisines[1] == "sushi"
        assert result.top_cuisines[2] == "indian"

    def test_null_cuisine_not_tracked(self, engine, empty_analysis):
        """Transactions without cuisine should not create cuisine entry."""
        txn = ProcessedTransaction(
            id="txn-no-cuisine",
            amount=5.50,
            timestamp=datetime(2024, 1, 15, 9, 0),
            merchant_name="Coffee Shop",
            merchant_id="merchant-coffee",
            taste_category="coffee",
            cuisine=None,  # No cuisine for coffee
            time_bucket="morning",
            day_type="weekday",
            payment_channel="in store",
            pending=False,
        )

        result = engine.ingest(txn, empty_analysis)

        assert len(result.cuisines) == 0
        assert len(result.top_cuisines) == 0


class TestEdgeCases:
    """Test edge cases and error handling."""

    def test_transaction_without_merchant_id(self, engine, empty_analysis):
        """Transactions without merchant_id should use merchant_name as key."""
        txn = ProcessedTransaction(
            id="txn-no-id",
            amount=10.00,
            timestamp=datetime(2024, 1, 15, 12, 0),
            merchant_name="Local Cafe",
            merchant_id=None,  # No merchant ID
            taste_category="coffee",
            time_bucket="afternoon",
            day_type="weekday",
            payment_channel="in store",
            pending=False,
        )

        result = engine.ingest(txn, empty_analysis)

        # Should use merchant_name as fallback key
        assert result.merchant_visits.get("Local Cafe", 0) == 1

    def test_unknown_category_still_tracked(self, engine, empty_analysis):
        """Unknown/unmapped categories should still be tracked."""
        txn = ProcessedTransaction(
            id="txn-unknown",
            amount=100.00,
            timestamp=datetime(2024, 1, 15, 12, 0),
            merchant_name="Random Store",
            merchant_id="merchant-rand",
            taste_category="other",  # Catch-all category
            time_bucket="afternoon",
            day_type="weekday",
            payment_channel="in store",
            pending=False,
        )

        result = engine.ingest(txn, empty_analysis)

        assert "other" in result.categories
        assert result.categories["other"].count == 1
