"""Import venues pipeline.

Reads venue data from venues_with_reviews.json (from discover_venues.py),
tags with Claude, inserts into Supabase.

Usage:
    cd backend
    source .venv/bin/activate
    python scripts/import_venues.py
"""

import json
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from supabase import create_client

# Add app to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.intelligence.venue_tagger import VenueTagger

# Load environment variables
load_dotenv()

# Supabase config
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")


def load_venues_with_reviews(filepath: str) -> list[dict]:
    """Load venues with reviews from JSON file.

    Args:
        filepath: Path to venues_with_reviews.json

    Returns:
        List of venue dicts with reviews.
    """
    with open(filepath) as f:
        data = json.load(f)
    return data.get("venues", [])


def map_price_to_tier(price_str: str | None) -> str | None:
    """Map Google price string to tier.

    Args:
        price_str: Google price like "$", "$$", etc.

    Returns:
        Price tier string.
    """
    if not price_str:
        return None
    return price_str.strip()


def import_venues(
    venues: list[dict],
    dry_run: bool = False,
) -> dict:
    """Run the full import pipeline.

    Args:
        venues: List of venue dicts with reviews (from discover_venues.py)
        dry_run: If True, don't insert into DB

    Returns:
        Summary dict with stats.
    """
    # Tag with Claude
    tagger = VenueTagger()
    total_cost = 0.0
    tagged_venues = []

    print("\n" + "=" * 60)
    print("TAGGING VENUES")
    print("=" * 60)

    for venue in venues:
        print(f"\n[Tagging] {venue['name']}...")

        profile, usage = tagger.tag_with_usage(venue)
        total_cost += usage["total_cost"]

        # Build DB record
        db_record = {
            "google_place_id": venue["place_id"],
            "name": venue["name"],
            "formatted_address": venue.get("address"),
            "lat": venue.get("lat"),
            "lng": venue.get("lng"),
            "city": venue.get("city") or "Los Angeles",
            "google_rating": venue.get("rating"),
            "google_price_level": len(venue.get("price", "")) if venue.get("price") else None,
            "opening_hours": venue.get("opening_hours"),
            "photo_references": [venue.get("photo_url")] if venue.get("photo_url") else [],
            # AI-generated tags
            "taste_cluster": profile.taste_cluster,
            "cuisine_type": profile.cuisine_type,
            "price_tier": map_price_to_tier(venue.get("price")),
            "energy": profile.energy,
            "tagline": profile.tagline,
            "best_for": profile.best_for,
            "standout": profile.standout,
            # Legacy boolean fields (for backwards compat)
            "date_friendly": "date_night" in profile.best_for,
            "group_friendly": "group_celebration" in profile.best_for or "casual_hangout" in profile.best_for,
            "cozy": "cozy_vibes" in profile.standout,
            "vibe_tags": profile.standout,
            "is_active": True,
        }

        tagged_venues.append(db_record)

        print(f"  Tagline: \"{profile.tagline}\"")
        print(f"  Cluster: {profile.taste_cluster} | Energy: {profile.energy}")
        print(f"  Cost: ${usage['total_cost']:.5f}")

    # 3. Insert into Supabase
    if not dry_run and tagged_venues:
        print("\n" + "=" * 60)
        print("INSERTING INTO DATABASE")
        print("=" * 60)

        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

        for record in tagged_venues:
            try:
                supabase.table("venues").upsert(
                    record,
                    on_conflict="google_place_id"
                ).execute()
                print(f"  [OK] {record['name']}")
            except Exception as e:
                print(f"  [ERR] {record['name']}: {e}")

    # Summary
    summary = {
        "venues_processed": len(tagged_venues),
        "total_cost": total_cost,
        "avg_cost_per_venue": total_cost / len(tagged_venues) if tagged_venues else 0,
        "dry_run": dry_run,
    }

    print("\n" + "=" * 60)
    print("IMPORT SUMMARY")
    print("=" * 60)
    print(f"Venues processed: {summary['venues_processed']}")
    print(f"Total AI cost: ${summary['total_cost']:.4f}")
    print(f"Avg cost/venue: ${summary['avg_cost_per_venue']:.5f}")
    if dry_run:
        print("\n[DRY RUN] No data was inserted into the database")

    return summary


def main():
    """Run import from venues_with_reviews.json."""
    # Check for venues file
    venues_file = Path(__file__).parent.parent / "data" / "venues_with_reviews.json"

    if not venues_file.exists():
        print(f"[ERROR] Venues file not found: {venues_file}")
        print("\nRun discover_venues.py first to discover venues.")
        return

    venues = load_venues_with_reviews(str(venues_file))
    print(f"Loaded {len(venues)} venues")

    # Run with dry_run=False to actually insert
    import_venues(venues, dry_run=False)


if __name__ == "__main__":
    main()
