"""Profile title mappings based on taste attributes.

Maps (exploration_style, dominant_vibe) combinations to profile titles.
This is a deterministic, rule-based mapping (no AI).

~20 combinations cover 95% of users.
"""

from __future__ import annotations


# Profile title mapping: (exploration_style, dominant_vibe) -> (title, tagline)
# dominant_vibe is the most prominent vibe from user's preferences
PROFILE_TITLES: dict[tuple[str, str], tuple[str, str]] = {
    # Adventurous exploration styles
    ("adventurous", "trendy"): ("Trend Hunter", "First to find the next big thing"),
    ("adventurous", "social"): ("Social Explorer", "Where the party's at"),
    ("adventurous", "energetic"): ("Thrill Seeker", "Life's too short for boring food"),
    ("adventurous", "upscale"): ("Refined Adventurer", "Luxury with a twist"),
    ("adventurous", "casual"): ("Curious Wanderer", "Always open to new flavors"),
    ("adventurous", "intimate"): ("Hidden Gem Hunter", "Finds the spots no one knows"),
    ("adventurous", "romantic"): ("Date Night Pioneer", "Romance meets discovery"),
    # Very adventurous (even more exploratory)
    ("very_adventurous", "trendy"): ("Culinary Trailblazer", "No dish too daring"),
    ("very_adventurous", "social"): ("Party Pioneer", "Leading the crew to new places"),
    ("very_adventurous", "energetic"): ("Flavor Chaser", "The weirder, the better"),
    ("very_adventurous", "upscale"): ("Gourmet Explorer", "Fine dining frontiers"),
    # Moderate exploration styles
    ("moderate", "trendy"): ("Trend Watcher", "Keeps up with what's hot"),
    ("moderate", "social"): ("Social Foodie", "Great company, great food"),
    ("moderate", "casual"): ("Easy Going Eater", "Good vibes, good bites"),
    ("moderate", "upscale"): ("Occasional Splurger", "Treats when it counts"),
    ("moderate", "chill"): ("Balanced Palate", "Open to suggestions"),
    ("moderate", "intimate"): ("Thoughtful Diner", "Quality over quantity"),
    # Routine exploration styles (creatures of habit)
    ("routine", "chill"): ("Comfort Connoisseur", "Knows what they love"),
    ("routine", "casual"): ("Neighborhood Regular", "Loyal to the locals"),
    ("routine", "homebody"): ("Home Chef", "Kitchen is their happy place"),
    ("routine", "upscale"): ("Classic Sophisticate", "Timeless taste"),
    ("routine", "intimate"): ("Cozy Corner Lover", "Same spot, same smile"),
    ("routine", "social"): ("Local Legend", "Everyone knows their order"),
}

# Default title when no match is found
DEFAULT_TITLE: tuple[str, str] = ("Taste Explorer", "Discovering your perfect spots")


def get_profile_title(
    exploration_style: str | None,
    dominant_vibe: str | None,
) -> tuple[str, str]:
    """Get profile title and tagline based on taste attributes.

    Args:
        exploration_style: User's exploration style (routine, moderate, adventurous, very_adventurous)
        dominant_vibe: User's dominant vibe preference

    Returns:
        Tuple of (title, tagline)
    """
    if not exploration_style or not dominant_vibe:
        return DEFAULT_TITLE

    # Normalize inputs
    exploration_style = exploration_style.lower()
    dominant_vibe = dominant_vibe.lower()

    # Try exact match first
    key = (exploration_style, dominant_vibe)
    if key in PROFILE_TITLES:
        return PROFILE_TITLES[key]

    # Try with simplified exploration (very_adventurous -> adventurous)
    if exploration_style == "very_adventurous":
        key = ("adventurous", dominant_vibe)
        if key in PROFILE_TITLES:
            return PROFILE_TITLES[key]

    # Try with related vibes
    vibe_fallbacks: dict[str, list[str]] = {
        "elegant": ["upscale"],
        "relaxed": ["casual", "chill"],
        "fun": ["energetic", "social"],
        "romantic": ["intimate"],
        "adventurous": ["trendy"],
    }

    for fallback_vibe in vibe_fallbacks.get(dominant_vibe, []):
        key = (exploration_style, fallback_vibe)
        if key in PROFILE_TITLES:
            return PROFILE_TITLES[key]

    return DEFAULT_TITLE


def get_dominant_vibe(vibes: list[str]) -> str | None:
    """Determine the dominant vibe from a list of vibes.

    Uses a priority order to pick the most characteristic vibe.

    Args:
        vibes: List of vibe preferences

    Returns:
        The dominant vibe, or None if list is empty
    """
    if not vibes:
        return None

    # Priority order for vibes (higher = more characteristic)
    vibe_priority = [
        "trendy",
        "upscale",
        "romantic",
        "intimate",
        "energetic",
        "social",
        "casual",
        "chill",
        "relaxed",
        "homebody",
        "fun",
        "elegant",
        "adventurous",
    ]

    # Return the highest priority vibe found in the list
    for vibe in vibe_priority:
        if vibe in vibes:
            return vibe

    # If no priority match, return the first vibe
    return vibes[0]
