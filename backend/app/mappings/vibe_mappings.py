"""Vibe/energy mappings for venue matching.

Maps venue energy levels to compatible user vibes.
"""

from __future__ import annotations


# Venue energy → compatible user vibes
# Venue energy is AI-generated: "chill", "moderate", "lively"
# User vibes are from quiz: various (see ALL_VIBES in quiz_mappings.py)
ENERGY_TO_VIBES: dict[str, list[str]] = {
    "chill": [
        "chill",
        "intimate",
        "cozy",
        "relaxed",
        "romantic",
        "homebody",
    ],
    "moderate": [
        "social",
        "casual",
        "trendy",
        "upscale",
        "elegant",
    ],
    "lively": [
        "energetic",
        "fun",
        "adventurous",
        "social",  # Social fits both moderate and lively
    ],
}


def calculate_energy_match(user_vibes: list[str], venue_energy: str | None) -> float:
    """Calculate energy/vibe match score.

    Args:
        user_vibes: List of user's vibe preferences from quiz.
        venue_energy: Venue's energy level ("chill", "moderate", "lively").

    Returns:
        Match score 0.0-1.0:
        - 1.0: 2+ vibes match
        - 0.5: 1 vibe matches
        - 0.0: No vibes match
    """
    if not venue_energy or not user_vibes:
        return 0.0

    compatible_vibes = ENERGY_TO_VIBES.get(venue_energy, [])
    overlap = len(set(user_vibes) & set(compatible_vibes))

    # 2+ matches = full score, 1 match = half score
    if overlap >= 2:
        return 1.0
    if overlap == 1:
        return 0.5
    return 0.0


# Exploration style → standout bonus mapping
# Adventurous users get bonus for hidden gems and cult followings
EXPLORATION_BONUSES: dict[str, dict[str, float]] = {
    "adventurous": {
        "hidden_gem": 1.0,
        "cult_following": 0.7,
    },
    "very_adventurous": {
        "hidden_gem": 1.0,
        "cult_following": 0.7,
    },
    "moderate": {
        "hidden_gem": 0.3,
        "cult_following": 0.0,
    },
    "routine": {},  # No bonuses for routine users
}


def calculate_exploration_bonus(
    exploration_style: str | None,
    venue_standout: list[str] | None,
) -> float:
    """Calculate exploration bonus for adventurous users.

    Args:
        exploration_style: User's exploration style from quiz.
        venue_standout: Venue's standout qualities (e.g., ["hidden_gem"]).

    Returns:
        Bonus score 0.0-1.0.
    """
    if not exploration_style or not venue_standout:
        return 0.0

    bonuses = EXPLORATION_BONUSES.get(exploration_style, {})

    # Return highest matching bonus
    max_bonus = 0.0
    for standout in venue_standout:
        bonus = bonuses.get(standout, 0.0)
        max_bonus = max(max_bonus, bonus)

    return max_bonus
