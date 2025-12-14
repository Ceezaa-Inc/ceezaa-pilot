"""Pydantic models for Plaid transaction data.

These models document the schema returned by Plaid's transactions/sync endpoint.
Based on exploration tests run against the Plaid sandbox.

Reference: https://plaid.com/docs/api/products/transactions/
"""

from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel


class PersonalFinanceCategory(BaseModel):
    """Plaid's personal finance category classification.

    The primary category is the broad classification (e.g., FOOD_AND_DRINK).
    The detailed category provides more specificity (e.g., FOOD_AND_DRINK_COFFEE).
    """

    primary: str  # e.g., "FOOD_AND_DRINK", "ENTERTAINMENT", "TRANSPORTATION"
    detailed: str  # e.g., "FOOD_AND_DRINK_COFFEE", "FOOD_AND_DRINK_RESTAURANT"
    confidence_level: Optional[str] = None  # "HIGH", "MEDIUM", "LOW"


class Location(BaseModel):
    """Transaction location data (if available)."""

    city: Optional[str] = None
    region: Optional[str] = None  # State/province
    postal_code: Optional[str] = None
    country: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    store_number: Optional[str] = None
    address: Optional[str] = None


class PlaidTransaction(BaseModel):
    """A single transaction from Plaid's transactions/sync endpoint.

    Key fields for TIL (Taste Intelligence Layer):
    - transaction_id: Unique identifier
    - amount: Transaction amount (positive = debit, negative = credit)
    - date: Transaction date
    - datetime: Transaction datetime (if available, for time bucket analysis)
    - merchant_name: Name of the merchant
    - personal_finance_category: Category classification
    """

    transaction_id: str
    amount: float  # Positive = money spent, Negative = credit/refund
    date: date  # Transaction date (always available)
    datetime: Optional[datetime] = None  # Exact timestamp (not always available)
    authorized_date: Optional[date] = None
    authorized_datetime: Optional[datetime] = None
    name: str  # Transaction name (fallback if no merchant_name)
    merchant_name: Optional[str] = None  # Cleaned merchant name
    merchant_entity_id: Optional[str] = None  # Plaid's merchant identifier
    personal_finance_category: Optional[PersonalFinanceCategory] = None
    location: Optional[Location] = None
    payment_channel: str  # "in store", "online", "other"
    pending: bool
    account_id: str

    class Config:
        """Pydantic configuration."""

        frozen = True  # Make immutable


class TransactionSyncResponse(BaseModel):
    """Response from Plaid's transactions/sync endpoint.

    Uses cursor-based pagination for incremental sync:
    1. First sync: Call without cursor, get all historical transactions
    2. Subsequent syncs: Pass previous next_cursor, get only changes
    3. Continue while has_more is True
    """

    added: list[PlaidTransaction]  # New transactions
    modified: list[PlaidTransaction]  # Updated transactions
    removed: list[str]  # Transaction IDs that were removed
    next_cursor: str  # Cursor for next sync call
    has_more: bool  # True if more pages available


class ProcessedTransaction(BaseModel):
    """A transaction processed for TIL analysis.

    This is the normalized format used internally after processing
    the raw Plaid transaction data.
    """

    id: str  # Same as transaction_id
    amount: float  # Absolute value (always positive)
    timestamp: datetime  # datetime if available, else midnight on date
    merchant_name: str  # merchant_name or name fallback
    merchant_id: Optional[str] = None  # merchant_entity_id
    taste_category: str  # Mapped from personal_finance_category
    time_bucket: str  # "morning", "afternoon", "evening", "night"
    day_type: str  # "weekday", "weekend"
    payment_channel: str
    pending: bool
