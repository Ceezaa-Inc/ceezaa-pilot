"""Test Google Places API for merchant matching.

Usage:
    cd backend
    source .venv/bin/activate
    pip install googlemaps
    python scripts/test_google_places.py
"""

import os
from dotenv import load_dotenv

load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_PLACES_API_KEY")

if not GOOGLE_API_KEY:
    print("❌ Missing GOOGLE_PLACES_API_KEY in .env")
    print("\nSetup steps:")
    print("1. Go to https://console.cloud.google.com/")
    print("2. Enable 'Places API' for your project")
    print("3. Create an API key under Credentials")
    print("4. Add to backend/.env: GOOGLE_PLACES_API_KEY=your_key")
    exit(1)


def test_find_place():
    """Test finding a place by name + location."""
    import googlemaps

    gmaps = googlemaps.Client(key=GOOGLE_API_KEY)

    # Test cases: merchant name + coordinates (simulating Plaid data)
    test_cases = [
        {
            "merchant": "Starbucks",
            "lat": 34.0224,  # USC area
            "lng": -118.2851,
        },
        {
            "merchant": "McDonald's",
            "lat": 34.0195,
            "lng": -118.2863,
        },
        {
            "merchant": "Chipotle",
            "lat": 34.0210,
            "lng": -118.2790,
        },
    ]

    print("=" * 60)
    print("GOOGLE PLACES API TEST")
    print("=" * 60)

    for tc in test_cases:
        print(f"\n🔍 Searching: '{tc['merchant']}' near ({tc['lat']}, {tc['lng']})")

        # Method 1: Find Place from Text with location bias
        result = gmaps.find_place(
            input=tc["merchant"],
            input_type="textquery",
            location_bias=f"point:{tc['lat']},{tc['lng']}",
            fields=["place_id", "name", "formatted_address", "geometry", "types"],
        )

        if result.get("candidates"):
            place = result["candidates"][0]
            print(f"  ✅ Found: {place.get('name')}")
            print(f"     Place ID: {place.get('place_id')}")
            print(f"     Address: {place.get('formatted_address')}")
            print(f"     Types: {place.get('types', [])[:3]}")

            # Calculate distance
            if place.get("geometry"):
                loc = place["geometry"]["location"]
                print(f"     Location: ({loc['lat']:.4f}, {loc['lng']:.4f})")
        else:
            print(f"  ❌ No results found")

        # Method 2: Nearby Search (alternative approach)
        print(f"\n  [Nearby Search]")
        nearby = gmaps.places_nearby(
            location=(tc["lat"], tc["lng"]),
            radius=200,  # 200 meters
            keyword=tc["merchant"],
        )

        if nearby.get("results"):
            for i, place in enumerate(nearby["results"][:2]):
                print(f"  {i+1}. {place.get('name')} - {place.get('vicinity')}")
        else:
            print("  No nearby results")


def test_place_details():
    """Test getting full place details."""
    import googlemaps

    gmaps = googlemaps.Client(key=GOOGLE_API_KEY)

    # First find a place
    result = gmaps.find_place(
        input="Starbucks USC",
        input_type="textquery",
        fields=["place_id", "name"],
    )

    if not result.get("candidates"):
        print("No place found for details test")
        return

    place_id = result["candidates"][0]["place_id"]

    print("\n" + "=" * 60)
    print("PLACE DETAILS TEST")
    print("=" * 60)

    # Get full details
    details = gmaps.place(
        place_id,
        fields=[
            "name",
            "formatted_address",
            "geometry",
            "type",
            "price_level",
            "rating",
            "user_ratings_total",
            "opening_hours",
            "photos",
            "url",  # Google Maps URL
        ],
    )

    if details.get("result"):
        d = details["result"]
        print(f"\n📍 {d.get('name')}")
        print(f"   Address: {d.get('formatted_address')}")
        print(f"   Rating: {d.get('rating')} ({d.get('user_ratings_total')} reviews)")
        print(f"   Price: {'$' * d.get('price_level', 0) or 'N/A'}")
        print(f"   Maps URL: {d.get('url')}")

        if d.get("photos"):
            print(f"   Photos: {len(d['photos'])} available")


if __name__ == "__main__":
    try:
        import googlemaps
    except ImportError:
        print("Installing googlemaps...")
        os.system("pip install googlemaps")
        import googlemaps

    test_find_place()
    test_place_details()
