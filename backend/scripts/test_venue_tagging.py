"""Test venue tagging costs with real Google Maps data via Apify.

Usage:
    cd backend
    source .venv/bin/activate
    python scripts/test_venue_tagging.py
"""

import json
import os
import time
import httpx
import anthropic
from dotenv import load_dotenv
from pydantic import BaseModel

# Load environment variables from .env
load_dotenv()

# Apify API config
APIFY_TOKEN = os.getenv("APIFY_TOKEN")
APIFY_ACTOR = "compass~google-maps-reviews-scraper"

# Test venues (Google Maps URLs)
TEST_URLS = [
    "https://maps.app.goo.gl/JgggQqrxobXd3Pu36",
    "https://maps.app.goo.gl/eVzfaDt3QLfrAQyz9",
    "https://maps.app.goo.gl/A6WGcTizRdSeNf6r9",
    "https://maps.app.goo.gl/Uqfogyd6Mh98xD5c9",
    "https://maps.app.goo.gl/rvavW58tpxVVzpXN6",
]


class VenueProfile(BaseModel):
    """AI-extracted venue profile for taste matching."""

    # Core categorization
    taste_cluster: str  # coffee, dining, nightlife, bakery
    cuisine_type: str | None  # indian, mexican, italian, etc. (null if not dining)

    # The verdict - 1 line combining vibe + energy
    tagline: str  # "Cozy Indian spot with generous portions"

    # Atmosphere
    energy: str  # chill, moderate, lively

    # Occasion matching (what's this place BEST for?) - max 3
    best_for: list[str]

    # Standout qualities - max 2
    standout: list[str]


SYSTEM_PROMPT = """You extract venue profiles for a taste-based restaurant discovery app.

## Output Schema
- taste_cluster: "coffee" | "dining" | "nightlife" | "bakery"
- cuisine_type: lowercase cuisine if dining (e.g., "indian"), null otherwise
- tagline: 1 punchy line (8-12 words) combining vibe + what it's known for
- energy: "chill" | "moderate" | "lively"
- best_for: max 3 from [date_night, group_celebration, solo_work, business_lunch, casual_hangout, late_night, family_outing, quick_bite]
- standout: max 2 from [hidden_gem, local_favorite, instagram_worthy, cult_following, cozy_vibes, upscale_feel]

## Tagline Examples
- "Cozy Indian spot with generous portions and friendly staff"
- "Buzzy gastropub for game day crowds and cold beers"
- "Chill neighborhood cafe perfect for laptop work"
- "Trendy Asian fusion with hidden gem vibes and killer ramen"
- "Lively sports bar with solid late-night bites"
- "Upscale Japanese for special occasions and date nights"

## Rules
- tagline should capture the ESSENCE - what would you tell a friend?
- best_for: pick occasions that ACTUALLY fit based on reviews
- standout: only include if there's clear evidence
- Be specific and opinionated, not generic
"""


def fetch_venues_from_apify(urls: list[str], max_reviews: int = 15) -> dict:
    """Fetch venue data from Apify Google Maps scraper."""
    print(f"[Apify] Starting scrape for {len(urls)} venues...")

    # Start the actor run
    response = httpx.post(
        f"https://api.apify.com/v2/acts/{APIFY_ACTOR}/runs?token={APIFY_TOKEN}",
        json={
            "language": "en",
            "maxReviews": max_reviews,
            "personalData": False,
            "reviewsSort": "mostRelevant",
            "startUrls": [{"url": url} for url in urls],
        },
        timeout=60,
    )
    run_data = response.json()["data"]
    run_id = run_data["id"]
    dataset_id = run_data["defaultDatasetId"]

    print(f"[Apify] Run started: {run_id}")

    # Poll for completion
    while True:
        status_resp = httpx.get(
            f"https://api.apify.com/v2/acts/{APIFY_ACTOR}/runs/{run_id}?token={APIFY_TOKEN}",
            timeout=30,
        )
        status = status_resp.json()["data"]["status"]
        print(f"[Apify] Status: {status}")

        if status == "SUCCEEDED":
            break
        elif status in ["FAILED", "ABORTED", "TIMED-OUT"]:
            raise Exception(f"Apify run failed: {status}")

        time.sleep(5)

    # Fetch results
    results_resp = httpx.get(
        f"https://api.apify.com/v2/datasets/{dataset_id}/items?token={APIFY_TOKEN}",
        timeout=60,
    )
    items = results_resp.json()

    # Group reviews by venue (placeId)
    venues = {}
    for item in items:
        place_id = item.get("placeId")
        if not place_id:
            continue

        if place_id not in venues:
            venues[place_id] = {
                "name": item.get("title"),
                "place_id": place_id,
                "category": item.get("categoryName"),
                "categories": item.get("categories", []),
                "rating": item.get("totalScore"),
                "price": item.get("price"),
                "address": item.get("address"),
                "city": item.get("city"),
                "reviews": [],
            }

        if item.get("text"):
            venues[place_id]["reviews"].append({
                "text": item["text"][:500],  # Truncate long reviews
                "stars": item.get("stars"),
            })

    print(f"[Apify] Found {len(venues)} venues with {sum(len(v['reviews']) for v in venues.values())} total reviews")
    return venues


def tag_venue(client: anthropic.Anthropic, venue: dict) -> tuple[VenueProfile, dict]:
    """Tag a single venue and return (profile, usage_stats)."""
    # Build user message with venue data
    user_message = f"""## Venue Data
Name: {venue['name']}
Category: {venue['category']}
Categories: {', '.join(venue['categories'][:5])}
Rating: {venue['rating']}
Price: {venue['price']}

## Reviews ({len(venue['reviews'])} samples)
"""
    for i, review in enumerate(venue['reviews'][:10], 1):
        user_message += f"\n{i}. [{review['stars']}*] {review['text'][:300]}"

    # Use structured outputs for clean JSON
    response = client.beta.messages.parse(
        model="claude-haiku-4-5",
        max_tokens=300,
        betas=["structured-outputs-2025-11-13"],
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_message}],
        output_format=VenueProfile,
    )

    # Calculate costs
    input_tokens = response.usage.input_tokens
    output_tokens = response.usage.output_tokens
    input_cost = input_tokens * 1 / 1_000_000  # $1/M input
    output_cost = output_tokens * 5 / 1_000_000  # $5/M output

    usage = {
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
        "input_cost": input_cost,
        "output_cost": output_cost,
        "total_cost": input_cost + output_cost,
    }

    return response.parsed_output, usage


def main():
    print("=" * 60)
    print("VENUE TAGGING COST TEST")
    print("=" * 60)

    # Fetch venues from Apify
    venues = fetch_venues_from_apify(TEST_URLS, max_reviews=15)

    # Tag each venue with Claude
    client = anthropic.Anthropic()
    total_cost = 0
    total_input = 0
    total_output = 0

    print("\n" + "=" * 60)
    print("TAGGING RESULTS")
    print("=" * 60)

    for place_id, venue in venues.items():
        print(f"\n{'='*50}")
        print(f"📍 {venue['name']}")
        print(f"{'='*50}")

        profile, usage = tag_venue(client, venue)

        total_cost += usage["total_cost"]
        total_input += usage["input_tokens"]
        total_output += usage["output_tokens"]

        # Display the profile
        print(f"\n💬 \"{profile.tagline}\"")
        print(f"\n🏷️  Cluster: {profile.taste_cluster}" + (f" ({profile.cuisine_type})" if profile.cuisine_type else ""))
        print(f"⚡ Energy: {profile.energy}")
        print(f"🎯 Best for: {', '.join(profile.best_for)}")
        print(f"✨ Standout: {', '.join(profile.standout)}")
        print(f"\n📊 Tokens: {usage['input_tokens']} in / {usage['output_tokens']} out = ${usage['total_cost']:.5f}")

    # Summary
    num_venues = len(venues)
    print("\n" + "=" * 60)
    print("COST SUMMARY")
    print("=" * 60)
    print(f"Venues processed: {num_venues}")
    print(f"Total input tokens: {total_input}")
    print(f"Total output tokens: {total_output}")
    print(f"Total cost: ${total_cost:.6f}")
    print(f"Avg cost per venue: ${total_cost / num_venues:.6f}")
    print(f"\nProjected costs:")
    print(f"  200 venues: ${total_cost / num_venues * 200:.2f}")
    print(f"  1000 venues: ${total_cost / num_venues * 1000:.2f}")
    print(f"  10000 venues: ${total_cost / num_venues * 10000:.2f}")


if __name__ == "__main__":
    main()
