"""Plaid category mapping configuration.

Maps Plaid's personal_finance_category.detailed values to Ceezaa taste categories.
Reference: https://plaid.com/documents/transactions-personal-finance-category-taxonomy.csv
"""

# Primary taste categories used in Ceezaa TIL
TASTE_CATEGORIES = {
    "coffee": "Coffee & Cafes",
    "dining": "Restaurants & Dining",
    "fast_food": "Fast Food",
    "nightlife": "Bars & Nightlife",
    "groceries": "Groceries",
    "entertainment": "Entertainment",
    "fitness": "Fitness & Recreation",
    "other_food": "Other Food & Drink",
    "other": "Other",
}


# Map Plaid detailed categories to Ceezaa taste categories
# Using detailed category (more specific) rather than primary
PLAID_TO_TASTE_CATEGORY: dict[str, str] = {
    # Coffee & Cafes
    "FOOD_AND_DRINK_COFFEE": "coffee",

    # Restaurants & Dining
    "FOOD_AND_DRINK_RESTAURANT": "dining",
    "FOOD_AND_DRINK_RESTAURANT_ASIAN": "dining",
    "FOOD_AND_DRINK_RESTAURANT_EUROPEAN": "dining",
    "FOOD_AND_DRINK_RESTAURANT_LATIN_AMERICAN": "dining",
    "FOOD_AND_DRINK_RESTAURANT_AMERICAN": "dining",
    "FOOD_AND_DRINK_RESTAURANT_INDIAN": "dining",
    "FOOD_AND_DRINK_RESTAURANT_MIDDLE_EASTERN": "dining",
    "FOOD_AND_DRINK_RESTAURANT_AFRICAN": "dining",
    "FOOD_AND_DRINK_RESTAURANT_SEAFOOD": "dining",
    "FOOD_AND_DRINK_RESTAURANT_STEAKHOUSE": "dining",
    "FOOD_AND_DRINK_RESTAURANT_PIZZA": "dining",
    "FOOD_AND_DRINK_RESTAURANT_SUSHI": "dining",
    "FOOD_AND_DRINK_RESTAURANT_THAI": "dining",
    "FOOD_AND_DRINK_RESTAURANT_VEGETARIAN_VEGAN": "dining",
    "FOOD_AND_DRINK_RESTAURANT_BAKERY": "dining",
    "FOOD_AND_DRINK_RESTAURANT_CAFE": "dining",
    "FOOD_AND_DRINK_RESTAURANT_BREAKFAST_BRUNCH": "dining",
    "FOOD_AND_DRINK_RESTAURANT_DELI": "dining",
    "FOOD_AND_DRINK_RESTAURANT_JUICE_SMOOTHIE": "dining",
    "FOOD_AND_DRINK_RESTAURANT_ICE_CREAM": "dining",
    "FOOD_AND_DRINK_RESTAURANT_DESSERT": "dining",

    # Fast Food
    "FOOD_AND_DRINK_FAST_FOOD": "fast_food",

    # Bars & Nightlife
    "FOOD_AND_DRINK_BAR": "nightlife",
    "FOOD_AND_DRINK_BAR_WINE": "nightlife",
    "FOOD_AND_DRINK_BAR_BEER": "nightlife",
    "FOOD_AND_DRINK_BAR_COCKTAIL": "nightlife",
    "FOOD_AND_DRINK_BAR_SPORTS": "nightlife",
    "FOOD_AND_DRINK_NIGHTCLUB": "nightlife",

    # Groceries (track but don't use for recommendations)
    "FOOD_AND_DRINK_GROCERIES": "groceries",
    "FOOD_AND_DRINK_SUPERMARKETS_AND_GROCERIES": "groceries",

    # Other food & drink
    "FOOD_AND_DRINK_OTHER": "other_food",
    "FOOD_AND_DRINK_BEER_WINE_AND_LIQUOR": "other_food",
    "FOOD_AND_DRINK_VENDING_MACHINES": "other_food",
    "FOOD_AND_DRINK_CATERING": "other_food",
    "FOOD_AND_DRINK_FOOD_TRUCK": "other_food",

    # Entertainment (for future expansion)
    "ENTERTAINMENT": "entertainment",
    "ENTERTAINMENT_CASINOS_AND_GAMBLING": "entertainment",
    "ENTERTAINMENT_MOVIES_AND_DVS": "entertainment",
    "ENTERTAINMENT_MUSIC_AND_AUDIO": "entertainment",
    "ENTERTAINMENT_NEWSPAPERS_AND_MAGAZINES": "entertainment",
    "ENTERTAINMENT_SPORTING_EVENTS_AMUSEMENT_PARKS_AND_MUSEUMS": "entertainment",
    "ENTERTAINMENT_TV_AND_MOVIES": "entertainment",
    "ENTERTAINMENT_VIDEO_GAMES": "entertainment",

    # Fitness & Recreation
    "RECREATION_FITNESS": "fitness",
    "RECREATION_OUTDOORS": "fitness",
    "RECREATION_SPORTS_AND_FITNESS_CLASSES": "fitness",
}


def get_taste_category(plaid_detailed_category: str) -> str:
    """Map a Plaid detailed category to a Ceezaa taste category.

    Args:
        plaid_detailed_category: The detailed category from Plaid's
            personal_finance_category.detailed field

    Returns:
        The corresponding Ceezaa taste category, or "other" if not mapped
    """
    return PLAID_TO_TASTE_CATEGORY.get(plaid_detailed_category, "other")


def is_food_related(plaid_primary_category: str) -> bool:
    """Check if a Plaid primary category is food-related.

    Used to filter transactions for taste analysis.

    Args:
        plaid_primary_category: The primary category from Plaid's
            personal_finance_category.primary field

    Returns:
        True if the category is food-related
    """
    return plaid_primary_category in {
        "FOOD_AND_DRINK",
        "ENTERTAINMENT",
        "RECREATION",
    }


# Categories to include in taste analysis
ANALYZABLE_PRIMARY_CATEGORIES = {
    "FOOD_AND_DRINK",
}

# Categories to exclude from recommendations (but still track)
NON_RECOMMENDATION_CATEGORIES = {
    "groceries",
    "other_food",
    "other",
}


# Map Plaid detailed categories to cuisine types
# Extracts cuisine info that would otherwise be lost when mapping to "dining"
CUISINE_MAPPING: dict[str, str] = {
    "FOOD_AND_DRINK_RESTAURANT_ASIAN": "asian",
    "FOOD_AND_DRINK_RESTAURANT_SUSHI": "sushi",
    "FOOD_AND_DRINK_RESTAURANT_THAI": "thai",
    "FOOD_AND_DRINK_RESTAURANT_INDIAN": "indian",
    "FOOD_AND_DRINK_RESTAURANT_LATIN_AMERICAN": "latin",
    "FOOD_AND_DRINK_RESTAURANT_EUROPEAN": "european",
    "FOOD_AND_DRINK_RESTAURANT_AMERICAN": "american",
    "FOOD_AND_DRINK_RESTAURANT_MIDDLE_EASTERN": "middle_eastern",
    "FOOD_AND_DRINK_RESTAURANT_AFRICAN": "african",
    "FOOD_AND_DRINK_RESTAURANT_SEAFOOD": "seafood",
    "FOOD_AND_DRINK_RESTAURANT_STEAKHOUSE": "steakhouse",
    "FOOD_AND_DRINK_RESTAURANT_PIZZA": "pizza",
    "FOOD_AND_DRINK_RESTAURANT_VEGETARIAN_VEGAN": "vegetarian",
    "FOOD_AND_DRINK_RESTAURANT_BREAKFAST_BRUNCH": "brunch",
}


def get_cuisine(plaid_detailed_category: str) -> str | None:
    """Extract cuisine type from Plaid detailed category.

    Args:
        plaid_detailed_category: The detailed category from Plaid's
            personal_finance_category.detailed field

    Returns:
        The cuisine type (e.g., "asian", "sushi") or None if not a restaurant
    """
    return CUISINE_MAPPING.get(plaid_detailed_category)
