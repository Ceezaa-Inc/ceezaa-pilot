"""Mood filter mappings for discovery feed.

Maps user-selected moods to venue attributes for filtering and boosting.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class MoodConfig:
    """Configuration for a mood filter."""

    # Venue energy levels that match this mood
    energy_match: list[str]

    # Venue best_for tags that match this mood
    best_for_match: list[str]

    # Venue standout tags to boost for this mood
    standout_boost: list[str]

    # Boost amounts (added to base match score) - kept low for balance
    energy_boost: int = 8        # +8% for matching energy
    best_for_boost: int = 4      # +4% per matching best_for tag
    standout_boost_amt: int = 3  # +3% per matching standout tag


# Mood configurations matching the mobile MoodGrid
# Moods: chill, energetic, romantic, social, adventurous, cozy
MOOD_CONFIGS: dict[str, MoodConfig] = {
    "chill": MoodConfig(
        energy_match=["chill"],
        best_for_match=["solo_work", "casual_hangout"],
        standout_boost=["cozy_vibes"],
    ),
    "energetic": MoodConfig(
        energy_match=["lively"],
        best_for_match=["group_celebration", "late_night"],
        standout_boost=[],
    ),
    "romantic": MoodConfig(
        energy_match=["chill", "moderate"],
        best_for_match=["date_night"],
        standout_boost=["cozy_vibes", "upscale_feel"],
    ),
    "social": MoodConfig(
        energy_match=["moderate", "lively"],
        best_for_match=["group_celebration", "casual_hangout"],
        standout_boost=[],
    ),
    "adventurous": MoodConfig(
        energy_match=["moderate", "lively"],
        best_for_match=[],  # Any occasion for adventurous
        standout_boost=["hidden_gem", "cult_following"],
    ),
    "cozy": MoodConfig(
        energy_match=["chill"],
        best_for_match=["casual_hangout", "solo_work"],
        standout_boost=["cozy_vibes", "local_favorite"],
    ),
}


def calculate_mood_boost(
    mood: str,
    venue_energy: str | None,
    venue_best_for: list[str] | None,
    venue_standout: list[str] | None,
) -> int:
    """Calculate mood boost for a venue.

    Args:
        mood: Selected mood from the MoodGrid.
        venue_energy: Venue's energy level.
        venue_best_for: Venue's best_for tags.
        venue_standout: Venue's standout qualities.

    Returns:
        Total boost to add to base match score (0-50 typically).
    """
    config = MOOD_CONFIGS.get(mood)
    if not config:
        return 0

    boost = 0

    # Energy match boost
    if venue_energy and venue_energy in config.energy_match:
        boost += config.energy_boost

    # Best-for match boost (per tag)
    if venue_best_for:
        overlap = set(venue_best_for) & set(config.best_for_match)
        boost += len(overlap) * config.best_for_boost

    # Standout boost (per tag)
    if venue_standout:
        overlap = set(venue_standout) & set(config.standout_boost)
        boost += len(overlap) * config.standout_boost_amt

    # Cap total mood boost to prevent score inflation
    return min(boost, 20)


def get_available_moods() -> list[dict[str, str]]:
    """Get list of available moods for the MoodGrid.

    Returns:
        List of mood dicts with id, label, emoji.
    """
    return [
        {"id": "chill", "label": "Chill", "emoji": "😌"},
        {"id": "energetic", "label": "Energetic", "emoji": "⚡"},
        {"id": "romantic", "label": "Romantic", "emoji": "💕"},
        {"id": "social", "label": "Social", "emoji": "🎉"},
        {"id": "adventurous", "label": "Adventurous", "emoji": "🌍"},
        {"id": "cozy", "label": "Cozy", "emoji": "🕯️"},
    ]
