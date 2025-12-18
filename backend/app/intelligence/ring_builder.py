"""RingBuilder - Constructs taste ring visualization data.

Transforms user_analysis into ring segments with visualization-specific logic:
- Max 5 segments
- Minimum 3% threshold
- Category colors
- Profile title/tagline
"""

from typing import Any, Optional
from supabase import Client

from app.intelligence.profile_titles import ProfileTitleMapper
from app.intelligence.quiz_processor import DeclaredTaste


# Category colors - consistent across the app
CATEGORY_COLORS: dict[str, str] = {
    "coffee": "#8B4513",      # Brown
    "dining": "#D4AF37",      # Gold
    "fast_food": "#FF8C00",   # Orange
    "nightlife": "#4B0082",   # Indigo
    "entertainment": "#FF6347",  # Tomato
    "fitness": "#32CD32",     # Lime green
    "groceries": "#228B22",   # Forest green
    "other_food": "#CD853F",  # Peru
    "other": "#808080",       # Gray
}

# Ring configuration
MAX_SEGMENTS = 5
MIN_PERCENTAGE = 3  # Segments below this are combined into "other"


class RingBuilder:
    """Builds taste ring visualization data from user_analysis."""

    def __init__(self, supabase: Client) -> None:
        """Initialize with Supabase client."""
        self._supabase = supabase
        self._title_mapper = ProfileTitleMapper()

    def build_ring(self, user_id: str) -> dict[str, Any]:
        """Build ring data for a user.

        Args:
            user_id: The user's ID

        Returns:
            Ring data with segments, profile_title, tagline
        """
        # Fetch user_analysis
        analysis = self._get_user_analysis(user_id)

        # Fetch declared_taste for profile title
        declared = self._get_declared_taste(user_id)

        # Build segments from categories
        segments = self._build_segments(analysis)

        # Get profile title
        profile_title, tagline = self._get_profile_info(declared)

        return {
            "segments": segments,
            "profile_title": profile_title,
            "tagline": tagline,
        }

    def _get_user_analysis(self, user_id: str) -> Optional[dict[str, Any]]:
        """Fetch user_analysis from database."""
        try:
            result = (
                self._supabase.table("user_analysis")
                .select("categories, total_transactions")
                .eq("user_id", user_id)
                .single()
                .execute()
            )
            return result.data
        except Exception:
            return None

    def _get_declared_taste(self, user_id: str) -> Optional[dict[str, Any]]:
        """Fetch declared_taste from database."""
        try:
            result = (
                self._supabase.table("declared_taste")
                .select("exploration_style, vibe_preferences")
                .eq("user_id", user_id)
                .single()
                .execute()
            )
            return result.data
        except Exception:
            return None

    def _build_segments(self, analysis: Optional[dict[str, Any]]) -> list[dict[str, Any]]:
        """Build ring segments from analysis data.

        Args:
            analysis: User analysis data with categories

        Returns:
            List of segment dicts with category, percentage, color
        """
        if not analysis or not analysis.get("categories"):
            return []

        categories = analysis["categories"]
        total = analysis.get("total_transactions", 0)

        if total == 0:
            return []

        # Calculate percentages
        raw_segments = []
        for cat_name, cat_data in categories.items():
            count = cat_data.get("count", 0) if isinstance(cat_data, dict) else 0
            percentage = round((count / total) * 100)

            if percentage >= MIN_PERCENTAGE:
                raw_segments.append({
                    "category": cat_name,
                    "percentage": percentage,
                    "color": CATEGORY_COLORS.get(cat_name, CATEGORY_COLORS["other"]),
                    "count": count,
                })

        # Sort by percentage descending
        raw_segments.sort(key=lambda x: x["percentage"], reverse=True)

        # Limit to MAX_SEGMENTS, combine rest into "other"
        if len(raw_segments) > MAX_SEGMENTS:
            top_segments = raw_segments[:MAX_SEGMENTS - 1]
            other_segments = raw_segments[MAX_SEGMENTS - 1:]

            other_percentage = sum(s["percentage"] for s in other_segments)
            other_count = sum(s["count"] for s in other_segments)

            top_segments.append({
                "category": "other",
                "percentage": other_percentage,
                "color": CATEGORY_COLORS["other"],
                "count": other_count,
            })

            raw_segments = top_segments

        # Remove count from final output (internal use only)
        segments = [
            {
                "category": s["category"],
                "percentage": s["percentage"],
                "color": s["color"],
            }
            for s in raw_segments
        ]

        return segments

    def _get_profile_info(
        self, declared: Optional[dict[str, Any]]
    ) -> tuple[str, str]:
        """Get profile title and tagline.

        Args:
            declared: Declared taste data

        Returns:
            Tuple of (profile_title, tagline)
        """
        if not declared:
            return "Taste Explorer", "Your taste journey begins"

        # Build DeclaredTaste object for the mapper
        declared_taste = DeclaredTaste(
            vibe_preferences=declared.get("vibe_preferences") or [],
            cuisine_preferences=[],
            exploration_style=declared.get("exploration_style"),
            social_preference=None,
            price_tier=None,
        )

        title, tagline = self._title_mapper.get_title(declared_taste)
        return title, tagline
