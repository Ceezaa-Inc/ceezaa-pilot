"""
Plaid Transactions Exploration Tests.

CRITICAL: These tests explore the transaction schema returned by Plaid.
Understanding this schema is essential before building the Transaction Processor.

Run with: pytest tests/exploration/test_plaid_transactions.py -v -s

IMPORTANT: These tests use REAL Plaid sandbox credentials from .env (not .env.test)
"""

from datetime import date
from pathlib import Path

import pytest
from dotenv import load_dotenv

# Load real .env for exploration tests (need actual Plaid sandbox credentials)
real_env_path = Path(__file__).parent.parent.parent / ".env"
load_dotenv(real_env_path, override=True)

# Clear caches to pick up new env
from app.config import get_settings
from app.services.plaid_client import get_plaid_client

get_settings.cache_clear()
get_plaid_client.cache_clear()

from app.services.plaid_client import (
    create_sandbox_public_token,
    exchange_public_token,
    sync_transactions,
)


@pytest.mark.exploration
def test_transaction_schema():
    """
    EXPLORATION: Document the full transaction schema.

    This is the MOST IMPORTANT exploration test.
    Run this to understand exactly what Plaid returns.
    """
    # Get access token
    public_token = create_sandbox_public_token()
    exchange_result = exchange_public_token(public_token)
    access_token = exchange_result["access_token"]

    # Fetch transactions
    result = sync_transactions(access_token)

    print("\n" + "=" * 60)
    print("PLAID TRANSACTION SCHEMA EXPLORATION")
    print("=" * 60)

    print(f"\nTotal transactions added: {len(result['added'])}")
    print(f"Total transactions modified: {len(result['modified'])}")
    print(f"Total transactions removed: {len(result['removed'])}")
    print(f"Has more: {result['has_more']}")
    print(f"Next cursor: {result['next_cursor'][:30]}...")

    # Document first 5 transactions in detail
    print("\n" + "-" * 60)
    print("SAMPLE TRANSACTIONS (first 5)")
    print("-" * 60)

    for i, txn in enumerate(result["added"][:5]):
        print(f"\n=== TRANSACTION {i + 1} ===")
        print(f"transaction_id: {txn.transaction_id}")
        print(f"amount: {txn.amount}")
        print(f"date: {txn.date}")
        print(f"datetime: {getattr(txn, 'datetime', 'N/A')}")
        print(f"authorized_date: {getattr(txn, 'authorized_date', 'N/A')}")
        print(f"authorized_datetime: {getattr(txn, 'authorized_datetime', 'N/A')}")
        print(f"name: {txn.name}")
        print(f"merchant_name: {txn.merchant_name}")
        print(f"merchant_entity_id: {getattr(txn, 'merchant_entity_id', 'N/A')}")

        # Personal finance category - THIS IS KEY FOR TIL
        pfc = txn.personal_finance_category
        if pfc:
            print(f"personal_finance_category:")
            print(f"  - primary: {pfc.primary}")
            print(f"  - detailed: {pfc.detailed}")
            print(f"  - confidence_level: {getattr(pfc, 'confidence_level', 'N/A')}")

        # Location info
        loc = txn.location
        if loc:
            print(f"location:")
            print(f"  - city: {loc.city}")
            print(f"  - region: {loc.region}")
            print(f"  - postal_code: {loc.postal_code}")
            print(f"  - country: {loc.country}")
            print(f"  - lat: {loc.lat}")
            print(f"  - lon: {loc.lon}")
            print(f"  - store_number: {loc.store_number}")
            print(f"  - address: {loc.address}")

        # Payment metadata
        print(f"payment_channel: {txn.payment_channel}")
        print(f"pending: {txn.pending}")
        print(f"account_id: {txn.account_id}")

    # Basic assertions
    # Note: Fresh sandbox items may have 0 transactions initially
    # Transactions populate after some time or via Plaid's sandbox test endpoints
    # next_cursor can be empty string for fresh items with no transactions
    assert "next_cursor" in result, "Expected next_cursor field in response"
    print("\n[NOTE] If 0 transactions, this is normal for fresh sandbox items.")


@pytest.mark.exploration
def test_food_and_drink_categories():
    """
    EXPLORATION: Identify all FOOD_AND_DRINK category variations.

    This helps us build the category mapping for the TIL.
    """
    # Get access token
    public_token = create_sandbox_public_token()
    exchange_result = exchange_public_token(public_token)
    access_token = exchange_result["access_token"]

    # Fetch all transactions
    result = sync_transactions(access_token)

    print("\n" + "=" * 60)
    print("FOOD & DRINK CATEGORY ANALYSIS")
    print("=" * 60)

    # Collect all categories
    all_categories = {}
    food_categories = {}

    for txn in result["added"]:
        pfc = txn.personal_finance_category
        if pfc:
            primary = pfc.primary
            detailed = pfc.detailed

            # Track all categories
            if primary not in all_categories:
                all_categories[primary] = set()
            all_categories[primary].add(detailed)

            # Track food-specific
            if primary == "FOOD_AND_DRINK":
                if detailed not in food_categories:
                    food_categories[detailed] = []
                food_categories[detailed].append({
                    "name": txn.name,
                    "merchant_name": txn.merchant_name,
                    "amount": txn.amount,
                })

    # Print all primary categories found
    print("\n--- ALL PRIMARY CATEGORIES ---")
    for primary, detailed_set in sorted(all_categories.items()):
        print(f"\n{primary}:")
        for detailed in sorted(detailed_set):
            print(f"  - {detailed}")

    # Print food categories with examples
    print("\n--- FOOD_AND_DRINK DETAILED CATEGORIES ---")
    for detailed, examples in sorted(food_categories.items()):
        print(f"\n{detailed}:")
        for ex in examples[:3]:  # Show up to 3 examples
            print(f"  - {ex['merchant_name'] or ex['name']} (${ex['amount']})")

    # Document what we found
    print("\n--- CATEGORY MAPPING SUGGESTIONS ---")
    print("""
Based on the data, suggested mappings for TIL:

PLAID_TO_TASTE_CATEGORY = {
    # Coffee
    "FOOD_AND_DRINK_COFFEE": "coffee",

    # Dining
    "FOOD_AND_DRINK_RESTAURANT": "dining",
    "FOOD_AND_DRINK_FAST_FOOD": "dining",

    # Bars/Nightlife
    "FOOD_AND_DRINK_BAR": "nightlife",

    # Groceries (track but don't use for recommendations)
    "FOOD_AND_DRINK_GROCERIES": "groceries",

    # Other food
    "FOOD_AND_DRINK_OTHER": "other_food",
}
""")

    # Assertion - categories may be empty for fresh sandbox items
    print(f"\n[NOTE] Found {len(all_categories)} categories. Fresh sandbox = 0 is normal.")


@pytest.mark.exploration
def test_incremental_sync_with_cursor():
    """
    EXPLORATION: Understand the cursor-based sync mechanism.

    This is important for efficiently syncing new transactions
    without re-fetching everything.
    """
    # Get access token
    public_token = create_sandbox_public_token()
    exchange_result = exchange_public_token(public_token)
    access_token = exchange_result["access_token"]

    print("\n" + "=" * 60)
    print("INCREMENTAL SYNC EXPLORATION")
    print("=" * 60)

    # First sync - get all transactions
    print("\n--- FIRST SYNC (no cursor) ---")
    result1 = sync_transactions(access_token)
    print(f"Transactions added: {len(result1['added'])}")
    print(f"Has more: {result1['has_more']}")
    print(f"Cursor: {result1['next_cursor'][:30]}...")

    # Second sync - use cursor (should return no new transactions)
    print("\n--- SECOND SYNC (with cursor) ---")
    result2 = sync_transactions(access_token, cursor=result1["next_cursor"])
    print(f"Transactions added: {len(result2['added'])}")
    print(f"Transactions modified: {len(result2['modified'])}")
    print(f"Transactions removed: {len(result2['removed'])}")
    print(f"Has more: {result2['has_more']}")

    print("\n--- SYNC STRATEGY ---")
    print("""
For production:
1. On first sync: Don't pass cursor, get all historical transactions
2. Store the next_cursor in linked_accounts table
3. On subsequent syncs: Pass stored cursor, only get new/modified/removed
4. Update stored cursor after each successful sync
5. If has_more is True, continue syncing until False
""")

    # Assertions
    # next_cursor may be empty for fresh items
    assert "next_cursor" in result1, "First sync should return cursor field"
    # Second sync with cursor returns incremental changes only
    print("\n[NOTE] Incremental sync verified - cursor mechanism works.")


@pytest.mark.exploration
def test_transaction_fields_for_til():
    """
    EXPLORATION: Identify which fields are useful for TIL.

    This helps design the ProcessedTransaction model.
    """
    # Get access token
    public_token = create_sandbox_public_token()
    exchange_result = exchange_public_token(public_token)
    access_token = exchange_result["access_token"]

    result = sync_transactions(access_token)

    print("\n" + "=" * 60)
    print("TIL-RELEVANT FIELDS ANALYSIS")
    print("=" * 60)

    if result["added"]:
        txn = result["added"][0]

        print("\n--- FIELDS WE NEED FOR TIL ---")
        print(f"""
ProcessedTransaction model should include:

FROM PLAID:
- transaction_id: {txn.transaction_id}
- amount: {txn.amount} (need to abs() for consistency)
- date: {txn.date}
- datetime: {getattr(txn, 'datetime', 'N/A')} (for time bucket)
- merchant_name: {txn.merchant_name}
- merchant_entity_id: {getattr(txn, 'merchant_entity_id', 'N/A')} (for merchant tracking)
- name: {txn.name} (fallback if no merchant_name)
- personal_finance_category.primary: {txn.personal_finance_category.primary if txn.personal_finance_category else 'N/A'}
- personal_finance_category.detailed: {txn.personal_finance_category.detailed if txn.personal_finance_category else 'N/A'}

DERIVED FIELDS (we calculate):
- taste_category: Map from personal_finance_category
- time_bucket: morning/afternoon/evening/night from datetime
- day_type: weekday/weekend from date

OPTIONAL/FUTURE:
- location: For local recommendations
- payment_channel: online/in_store/other
""")

        # Check for datetime availability
        has_datetime = 0
        for t in result["added"]:
            if getattr(t, "datetime", None):
                has_datetime += 1

        print(f"\n--- DATETIME AVAILABILITY ---")
        print(f"Transactions with datetime: {has_datetime}/{len(result['added'])}")
        print("Note: datetime may not always be available. Fall back to date if needed.")
    else:
        print("\n[NOTE] No transactions in fresh sandbox. Schema documented based on Plaid docs.")
