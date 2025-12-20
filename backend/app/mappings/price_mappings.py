"""Price tier mappings for venue matching.

Handles conversion between various price formats:
- Google Maps price ranges: "$1–10", "$10–20", "$30–50", etc.
- Google Maps dollar signs: "$", "$$", "$$$", "$$$$"
- User price tiers: "budget", "moderate", "premium", "luxury"
"""

from __future__ import annotations


# User price tier to numeric level (from quiz)
USER_PRICE_LEVELS: dict[str, int] = {
    "budget": 0,      # Under $30
    "moderate": 1,    # $30-60
    "premium": 2,     # $60-100
    "luxury": 3,      # Sky's the limit
}

# Standard dollar sign format to numeric level
DOLLAR_SIGN_LEVELS: dict[str, int] = {
    "$": 0,
    "$$": 1,
    "$$$": 2,
    "$$$$": 3,
}

# Google Maps price ranges to numeric level
# Based on typical LA restaurant prices
# Note: Google uses en-dash (–) but sometimes hyphen (-) appears, so we normalize
PRICE_RANGE_LEVELS: dict[str, int] = {
    # With en-dash (–)
    "$1–10": 0,       # Budget (fast food, coffee)
    "$10–20": 1,      # Moderate (casual dining)
    "$20–30": 1,      # Moderate (casual+)
    "$30–50": 2,      # Premium (nice dinner)
    "$50–100": 2,     # Premium (upscale)
    "$100+": 3,       # Luxury
    # With regular hyphen (-)
    "$1-10": 0,
    "$10-20": 1,
    "$20-30": 1,
    "$30-50": 2,
    "$50-100": 2,
    "$32.00": 2,      # Specific price → Premium
}


def normalize_venue_price(price_str: str | None) -> int:
    """Convert any venue price format to numeric level 0-3.

    Args:
        price_str: Price string from venue data (Google or DB).
            Could be: "$", "$$", "$10–20", None, etc.

    Returns:
        Numeric price level 0-3, or 1 (moderate) as default.
    """
    if not price_str:
        return 1  # Default to moderate

    price_str = price_str.strip()

    # Check dollar sign format first
    if price_str in DOLLAR_SIGN_LEVELS:
        return DOLLAR_SIGN_LEVELS[price_str]

    # Check price range format
    if price_str in PRICE_RANGE_LEVELS:
        return PRICE_RANGE_LEVELS[price_str]

    # Try to parse specific dollar amounts (e.g., "$32.00")
    if price_str.startswith("$") and not price_str.startswith("$$"):
        try:
            # Extract numeric value
            amount_str = price_str.replace("$", "").replace(",", "")
            amount = float(amount_str)
            if amount < 15:
                return 0  # Budget
            if amount < 40:
                return 1  # Moderate
            if amount < 80:
                return 2  # Premium
            return 3  # Luxury
        except ValueError:
            pass

    # Default to moderate if unparseable
    return 1


def normalize_user_price(user_tier: str | None) -> int:
    """Convert user price tier to numeric level 0-3.

    Args:
        user_tier: User's price tier from quiz.
            One of: "budget", "moderate", "premium", "luxury"

    Returns:
        Numeric price level 0-3.
    """
    if not user_tier:
        return 1  # Default to moderate

    return USER_PRICE_LEVELS.get(user_tier.lower(), 1)


def calculate_price_match(user_tier: str | None, venue_price: str | None) -> float:
    """Calculate price match score between user and venue.

    Args:
        user_tier: User's price tier ("budget", "moderate", etc.)
        venue_price: Venue's price string ("$$", "$10–20", etc.)

    Returns:
        Match score 0.0-1.0:
        - 1.0: Exact match
        - 0.5: One tier difference
        - 0.0: Two+ tiers difference
    """
    user_level = normalize_user_price(user_tier)
    venue_level = normalize_venue_price(venue_price)

    diff = abs(user_level - venue_level)

    if diff == 0:
        return 1.0
    if diff == 1:
        return 0.5
    return 0.0


def get_price_display(price_str: str | None) -> str:
    """Get user-friendly price display string.

    Args:
        price_str: Raw price string from venue data.

    Returns:
        Normalized display string like "$", "$$", "$$$", "$$$$".
    """
    level = normalize_venue_price(price_str)
    return "$" * (level + 1)
