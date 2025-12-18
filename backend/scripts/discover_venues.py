"""Discover venues near USC using Apify Google Maps scraper.

Two-step process:
1. Search mode → discover venues and get their URLs
2. Reviews mode with startUrls → fetch reviews for each venue

Usage:
    cd backend
    source .venv/bin/activate
    pip install apify-client
    python scripts/discover_venues.py
"""

import json
import os
from datetime import datetime
from pathlib import Path

from apify_client import ApifyClient
from dotenv import load_dotenv

load_dotenv()

# Apify config
APIFY_TOKEN = os.getenv("APIFY_TOKEN")
ACTOR_ID = "f8d1fJGFQuLQW1MH0"  # Google Maps scraper

# Search queries for different venue types
SEARCH_QUERIES = [
    {"query": "best restaurants near usc", "location": "Los Angeles, CA", "max": 50},
    {"query": "cafes coffee shops near usc", "location": "Los Angeles, CA", "max": 50},
    {"query": "pubs bars near usc", "location": "Los Angeles, CA", "max": 50},
    {"query": "nightclubs clubs near usc", "location": "Los Angeles, CA", "max": 50},
]

MAX_REVIEWS_PER_VENUE = 15
BATCH_SIZE = 20  # Process reviews in batches to avoid timeout


def discover_venues(queries: list[dict], max_results_per_query: int = 50) -> list[dict]:
    """Step 1: Discover venues using search mode.

    Args:
        queries: List of search query configs
        max_results_per_query: Max venues per query

    Returns:
        List of venue dicts with URLs (no reviews yet).
    """
    client = ApifyClient(APIFY_TOKEN)
    all_venues = []
    seen_place_ids = set()

    for q in queries:
        print(f"\n[Search] '{q['query']}' in {q['location']}...")

        run_input = {
            "mode": "search",
            "searchQuery": q["query"],
            "location": q["location"],
            "maxResults": q.get("max", max_results_per_query),
            "maxReviews": 1,  # Minimum required
            "language": "en",
        }

        # Run the actor
        run = client.actor(ACTOR_ID).call(run_input=run_input)

        # Fetch results
        count = 0
        for item in client.dataset(run["defaultDatasetId"]).iterate_items():
            place_id = item.get("place_id")
            if not place_id or place_id in seen_place_ids:
                continue

            seen_place_ids.add(place_id)
            count += 1

            # Get first image URL if available
            images = item.get("images", [])
            photo_url = images[0] if images else None

            venue = {
                "place_id": place_id,
                "url": item.get("url"),
                "name": item.get("name"),
                "category": item.get("category"),
                "categories": [item.get("category")] if item.get("category") else [],
                "rating": item.get("rating"),
                "price": item.get("price_level"),
                "address": item.get("address"),
                "city": "Los Angeles",
                "lat": item.get("latitude"),
                "lng": item.get("longitude"),
                "opening_hours": None,  # Not returned in search mode
                "photo_url": photo_url,
                "query": q["query"],
                "reviews": [],
            }
            all_venues.append(venue)

        print(f"  Found {count} new venues")

    return all_venues


def fetch_reviews_for_venues(venues: list[dict], max_reviews: int = 15) -> list[dict]:
    """Step 2: Fetch reviews using startUrls mode.

    Args:
        venues: List of venue dicts with URLs
        max_reviews: Max reviews per venue

    Returns:
        Same venues list with reviews added.
    """
    client = ApifyClient(APIFY_TOKEN)

    # Build URL list
    urls = [{"url": v["url"]} for v in venues if v.get("url")]
    if not urls:
        print("[Reviews] No URLs to fetch reviews for")
        return venues

    print(f"\n[Reviews] Fetching reviews for {len(urls)} venues...")

    # Process in batches
    for batch_start in range(0, len(urls), BATCH_SIZE):
        batch_urls = urls[batch_start : batch_start + BATCH_SIZE]
        print(f"  Batch {batch_start // BATCH_SIZE + 1}: {len(batch_urls)} venues...")

        run_input = {
            "startUrls": batch_urls,
            "maxReviews": max_reviews,
            "reviewsSort": "mostRelevant",
            "language": "en",
            "reviewsOrigin": "all",
            "personalData": False,
        }

        # Run the actor
        run = client.actor(ACTOR_ID).call(run_input=run_input)

        # Group reviews by place_id
        reviews_by_place = {}
        for item in client.dataset(run["defaultDatasetId"]).iterate_items():
            place_id = item.get("place_id")
            # Reviews are nested in the item - extract them
            reviews = item.get("reviews", [])

            if place_id and reviews:
                if place_id not in reviews_by_place:
                    reviews_by_place[place_id] = []
                for review in reviews[:max_reviews]:
                    text = review.get("text", "")
                    if text:
                        reviews_by_place[place_id].append({
                            "text": text[:500],
                            "stars": review.get("rating"),
                        })

        # Add reviews to venues
        for venue in venues:
            if venue["place_id"] in reviews_by_place:
                venue["reviews"] = reviews_by_place[venue["place_id"]]

        print(f"    Got reviews for {len(reviews_by_place)} venues")

    return venues


def main():
    print("=" * 60)
    print("VENUE DISCOVERY + REVIEWS")
    print("=" * 60)

    # Step 1: Discover venues
    venues = discover_venues(SEARCH_QUERIES)
    print(f"\n[Discovery] Total venues found: {len(venues)}")

    # Step 2: Fetch reviews
    venues = fetch_reviews_for_venues(venues, max_reviews=MAX_REVIEWS_PER_VENUE)

    # Save to JSON
    output_path = Path(__file__).parent.parent / "data" / "venues_with_reviews.json"
    output_data = {
        "discovered_at": datetime.now().isoformat(),
        "location": "USC Los Angeles",
        "queries": [q["query"] for q in SEARCH_QUERIES],
        "total_venues": len(venues),
        "total_reviews": sum(len(v.get("reviews", [])) for v in venues),
        "venues": venues,
    }

    with open(output_path, "w") as f:
        json.dump(output_data, f, indent=2)

    print(f"\n{'=' * 60}")
    print("DISCOVERY SUMMARY")
    print("=" * 60)
    print(f"Total venues: {len(venues)}")
    print(f"Total reviews: {output_data['total_reviews']}")
    print(f"Saved to: {output_path}")

    # Breakdown by query
    print("\nBy category:")
    for q in SEARCH_QUERIES:
        matching = [v for v in venues if v["query"] == q["query"]]
        reviews = sum(len(v.get("reviews", [])) for v in matching)
        print(f"  {q['query']}: {len(matching)} venues, {reviews} reviews")


if __name__ == "__main__":
    main()
