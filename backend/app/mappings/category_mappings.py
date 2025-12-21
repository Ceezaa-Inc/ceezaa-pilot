"""Category mappings between Plaid user categories and venue taste clusters.

Plaid transaction categories don't map 1:1 to our venue taste_clusters.
This module provides bidirectional mappings to calculate category affinity.
"""

from __future__ import annotations


# Maps user categories (from Plaid transactions) to relevant venue clusters
# User spending in these categories indicates affinity for these venue types
USER_TO_VENUE_CLUSTERS: dict[str, list[str]] = {
    "coffee": ["coffee"],
    "dining": ["dining", "bakery"],
    "fast_food": ["dining", "bakery"],
    "nightlife": ["nightlife"],
    "entertainment": ["nightlife", "dining"],
    "fitness": [],
    "shopping": [],
    "groceries": [],
    "travel": ["dining", "coffee"],
    "other": ["coffee", "dining", "nightlife", "bakery"],  # Wide net for unknown
    "other_food": ["dining", "bakery"],
}

# Reverse mapping: venue cluster to relevant user categories
# Used to find how much user spends in categories relevant to this venue type
VENUE_TO_USER_CATEGORIES: dict[str, list[str]] = {
    "coffee": ["coffee", "other", "travel"],
    "dining": ["dining", "fast_food", "entertainment", "other", "other_food", "travel"],
    "nightlife": ["nightlife", "entertainment", "other"],
    "bakery": ["dining", "fast_food", "coffee", "other", "other_food"],
}


def calculate_category_affinity(
    user_categories: dict[str, float],
    venue_cluster: str,
) -> float:
    """Calculate category affinity score using mapped categories.

    Instead of exact matching (user "coffee" to venue "coffee"), this uses
    a mapping to find all relevant user spending categories for a venue type.

    Args:
        user_categories: Dict of category name -> percentage (0-100).
            E.g., {"coffee": 6, "other": 63, "entertainment": 19}
        venue_cluster: Venue's taste_cluster (coffee, dining, nightlife, bakery).

    Returns:
        Score 0.0-1.0 based on user's spending in relevant categories.
        - 0.0: No spending in relevant categories
        - 0.5: 25% combined spending
        - 1.0: 50%+ combined spending in relevant categories
    """
    if not venue_cluster or not user_categories:
        return 0.0  # No artificial floor

    # Get user categories that are relevant to this venue type
    relevant_user_cats = VENUE_TO_USER_CATEGORIES.get(venue_cluster.lower(), [])

    if not relevant_user_cats:
        return 0.0  # No artificial floor

    # Sum percentages from all relevant categories
    total_pct = 0.0
    for cat in relevant_user_cats:
        # Handle case-insensitive matching
        cat_lower = cat.lower()
        for user_cat, pct in user_categories.items():
            if user_cat.lower() == cat_lower:
                total_pct += pct
                break

    # Normalize: 50% combined spending = full score
    # This allows users who split spending across categories to still match well
    normalized = min(total_pct / 50.0, 1.0)

    return normalized  # No artificial floor


def get_relevant_venue_clusters(user_category: str) -> list[str]:
    """Get venue clusters that match a user spending category.

    Args:
        user_category: A Plaid category from user's transactions.

    Returns:
        List of venue taste_clusters that are relevant.
    """
    return USER_TO_VENUE_CLUSTERS.get(user_category.lower(), [])


def get_relevant_user_categories(venue_cluster: str) -> list[str]:
    """Get user categories that indicate affinity for a venue type.

    Args:
        venue_cluster: Venue's taste_cluster.

    Returns:
        List of user spending categories that indicate interest.
    """
    return VENUE_TO_USER_CATEGORIES.get(venue_cluster.lower(), [])
