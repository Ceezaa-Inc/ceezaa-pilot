"""Comprehensive Google Places API (New) validation tests.

Uses the NEW Places API with AI features:
- POST https://places.googleapis.com/v1/places:searchText
- POST https://places.googleapis.com/v1/places:searchNearby
- GET  https://places.googleapis.com/v1/places/{place_id}

AI Features available:
- generativeSummary - AI-powered place description
- reviewSummary - AI digest of reviews

Run:
    cd backend
    source .venv/bin/activate
    pip install requests
    python scripts/test_google_places.py
"""

import os
import json
from typing import Any

import requests
from dotenv import load_dotenv

load_dotenv()

# Support both env var names
API_KEY = os.getenv("PLACES_API_KEY") or os.getenv("GOOGLE_PLACES_API_KEY")

# New Places API base URL
BASE_URL = "https://places.googleapis.com/v1"


def print_header(title: str) -> None:
    """Print a formatted section header."""
    print(f"\n{'=' * 60}")
    print(f" {title}")
    print("=" * 60)


def print_result(label: str, value: Any, indent: int = 2) -> None:
    """Print a labeled result with indentation."""
    prefix = " " * indent
    if value is None:
        value = "N/A"
    elif isinstance(value, str) and len(value) > 100:
        value = value[:100] + "..."
    print(f"{prefix}{label}: {value}")


def make_request(
    endpoint: str,
    method: str = "POST",
    data: dict = None,
    field_mask: list[str] = None,
) -> dict:
    """Make a request to the new Places API.

    Args:
        endpoint: API endpoint (e.g., "/places:searchText")
        method: HTTP method
        data: Request body (for POST)
        field_mask: Fields to return

    Returns:
        Response JSON dict
    """
    url = f"{BASE_URL}{endpoint}"

    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": API_KEY,
    }

    if field_mask:
        headers["X-Goog-FieldMask"] = ",".join(field_mask)

    if method == "POST":
        response = requests.post(url, headers=headers, json=data)
    else:
        response = requests.get(url, headers=headers)

    if response.status_code != 200:
        print(f"  API Error: {response.status_code}")
        print(f"  Response: {response.text[:500]}")
        return {"error": response.text}

    return response.json()


def test_text_search() -> dict:
    """Test Text Search (New) - for Discover pipeline.

    POST /places:searchText
    """
    print_header("TEST 1: Text Search (New) - Venue Discovery")
    print("\nThis powers the Discover feed - finding venues by category in a city.")

    queries = [
        "best restaurants in Los Angeles",
        "top coffee shops near USC",
        "popular bars in Downtown LA",
    ]

    # Fields to request (comprehensive for venue profiles)
    field_mask = [
        "places.id",
        "places.displayName",
        "places.formattedAddress",
        "places.location",
        "places.types",
        "places.primaryType",
        "places.rating",
        "places.userRatingCount",
        "places.priceLevel",
        "places.photos",
        "places.googleMapsUri",
        # Atmosphere
        "places.dineIn",
        "places.takeout",
        "places.delivery",
        "places.reservable",
        # AI Features
        "places.editorialSummary",
        "places.generativeSummary",
    ]

    results = {"queries": [], "total_venues": 0, "sample_place_id": None}

    for query in queries:
        print(f"\nQuery: '{query}'")

        response = make_request(
            "/places:searchText",
            data={"textQuery": query, "maxResultCount": 10},
            field_mask=field_mask,
        )

        if "error" in response:
            results["queries"].append({"query": query, "error": response["error"]})
            continue

        places = response.get("places", [])
        print(f"  Found: {len(places)} venues")
        results["total_venues"] += len(places)

        query_result = {"query": query, "count": len(places), "samples": []}

        for p in places[:3]:
            name = p.get("displayName", {}).get("text", "Unknown")
            rating = p.get("rating", "N/A")
            print(f"    - {name} ({rating} stars)")

            # Save first place_id for later tests
            if not results["sample_place_id"] and p.get("id"):
                results["sample_place_id"] = p["id"]

            query_result["samples"].append({
                "name": name,
                "place_id": p.get("id"),
                "rating": rating,
            })

        results["queries"].append(query_result)

    print(f"\n  Total venues discovered: {results['total_venues']}")
    return results


def test_place_details(place_id: str = None) -> dict:
    """Test Place Details (New) - for rich venue profiles.

    GET /places/{place_id}
    """
    print_header("TEST 2: Place Details (New) - Full Venue Data")
    print("\nThis fetches complete venue data including AI summaries.")

    if not place_id:
        # Find a place first
        print("\n  Finding a test place...")
        search_response = make_request(
            "/places:searchText",
            data={"textQuery": "Republique Los Angeles", "maxResultCount": 1},
            field_mask=["places.id", "places.displayName"],
        )

        if "error" in search_response or not search_response.get("places"):
            print("  ERROR: Could not find test place")
            return {"error": "No place found"}

        place_id = search_response["places"][0]["id"]

    print(f"\n  Fetching details for: {place_id[:30]}...")

    # Comprehensive field mask for venue profile
    field_mask = [
        # Basic
        "id",
        "displayName",
        "formattedAddress",
        "location",
        "types",
        "primaryType",
        "primaryTypeDisplayName",
        # Ratings
        "rating",
        "userRatingCount",
        "priceLevel",
        "priceRange",
        # Links
        "googleMapsUri",
        "websiteUri",
        # Hours
        "regularOpeningHours",
        "currentOpeningHours",
        # Photos
        "photos",
        # Atmosphere
        "dineIn",
        "takeout",
        "delivery",
        "reservable",
        "goodForGroups",
        "outdoorSeating",
        "liveMusic",
        "servesBreakfast",
        "servesLunch",
        "servesDinner",
        "servesBeer",
        "servesWine",
        # AI Features
        "editorialSummary",
        "generativeSummary",
        "reviews",
    ]

    response = make_request(
        f"/places/{place_id}",
        method="GET",
        field_mask=field_mask,
    )

    if "error" in response:
        return response

    # Display results
    print("\n  Basic Info:")
    print_result("Name", response.get("displayName", {}).get("text"))
    print_result("Address", response.get("formattedAddress"))
    print_result("Primary Type", response.get("primaryTypeDisplayName", {}).get("text"))
    print_result("Types", response.get("types", [])[:5])

    print("\n  Ratings & Price:")
    print_result("Rating", response.get("rating"))
    print_result("Review Count", response.get("userRatingCount"))
    print_result("Price Level", response.get("priceLevel"))

    print("\n  Links:")
    print_result("Google Maps", response.get("googleMapsUri"))
    print_result("Website", response.get("websiteUri"))

    print("\n  Hours:")
    hours = response.get("regularOpeningHours", {})
    if hours.get("weekdayDescriptions"):
        print_result("Sample Hours", hours["weekdayDescriptions"][0])
    else:
        print_result("Hours", "Not available")

    print("\n  Photos:")
    photos = response.get("photos", [])
    print_result("Photo Count", len(photos))
    if photos:
        # Photo name format: places/{place_id}/photos/{photo_reference}
        photo_name = photos[0].get("name", "")
        print_result("First Photo", photo_name)

    print("\n  Atmosphere:")
    print_result("Dine-in", response.get("dineIn"))
    print_result("Takeout", response.get("takeout"))
    print_result("Delivery", response.get("delivery"))
    print_result("Reservable", response.get("reservable"))
    print_result("Good for Groups", response.get("goodForGroups"))
    print_result("Outdoor Seating", response.get("outdoorSeating"))
    print_result("Live Music", response.get("liveMusic"))

    print("\n  AI Features:")
    editorial = response.get("editorialSummary", {}).get("text")
    print_result("Editorial Summary", editorial)

    generative = response.get("generativeSummary", {})
    if generative:
        overview = generative.get("overview", {}).get("text")
        print_result("AI Summary", overview)
    else:
        print_result("AI Summary", "Not available (may require billing)")

    return {
        "success": True,
        "place_id": place_id,
        "name": response.get("displayName", {}).get("text"),
        "photo_name": photos[0].get("name") if photos else None,
        "has_ai_summary": bool(generative),
        "fields_available": list(response.keys()),
    }


def test_find_place() -> dict:
    """Test finding a place by merchant name + location.

    Uses Text Search with location bias - for Vault pipeline.
    """
    print_header("TEST 3: Find Place (Merchant Matching)")
    print("\nThis matches Plaid merchant names to Google Places for Vault.")

    test_cases = [
        {
            "merchant": "Starbucks",
            "lat": 34.0224,
            "lng": -118.2851,
            "expected_match": True,
            "description": "Chain with location",
        },
        {
            "merchant": "Republique LA",
            "lat": 34.0625,
            "lng": -118.3444,
            "expected_match": True,
            "description": "Unique local restaurant",
        },
        {
            "merchant": "ASDF123XYZ Random",
            "lat": 34.0,
            "lng": -118.0,
            "expected_match": False,
            "description": "Should NOT match",
        },
    ]

    field_mask = [
        "places.id",
        "places.displayName",
        "places.formattedAddress",
        "places.location",
        "places.types",
    ]

    results = {"passed": 0, "failed": 0, "samples": []}

    for tc in test_cases:
        print(f"\n[{tc['description']}] '{tc['merchant']}'")

        # Use locationBias for better matching
        data = {
            "textQuery": tc["merchant"],
            "maxResultCount": 1,
        }

        if tc["lat"] and tc["lng"]:
            data["locationBias"] = {
                "circle": {
                    "center": {"latitude": tc["lat"], "longitude": tc["lng"]},
                    "radius": 500.0,  # 500 meters
                }
            }
            print(f"  Location bias: ({tc['lat']}, {tc['lng']})")

        response = make_request("/places:searchText", data=data, field_mask=field_mask)

        if "error" in response:
            print(f"  Error: {response['error'][:100]}")
            results["failed"] += 1
            continue

        places = response.get("places", [])
        found = len(places) > 0

        status = "PASS" if found == tc["expected_match"] else "FAIL"
        if status == "PASS":
            results["passed"] += 1
        else:
            results["failed"] += 1

        print(f"  Result: {status}")

        if found:
            place = places[0]
            print_result("Place ID", place.get("id"))
            print_result("Name", place.get("displayName", {}).get("text"))
            print_result("Address", place.get("formattedAddress"))

            results["samples"].append({
                "merchant": tc["merchant"],
                "place_id": place.get("id"),
                "name": place.get("displayName", {}).get("text"),
            })

    print(f"\n  Summary: {results['passed']} passed, {results['failed']} failed")
    return results


def test_photo_url(photo_name: str = None) -> dict:
    """Test fetching a venue photo.

    New API uses: GET /places/{place_id}/photos/{photo_ref}/media
    """
    print_header("TEST 4: Photo Fetching")
    print("\nThis tests fetching venue photos from photo references.")

    if not photo_name:
        # Get a photo reference first
        print("\n  Finding a place with photos...")
        search_response = make_request(
            "/places:searchText",
            data={"textQuery": "Starbucks USC Los Angeles", "maxResultCount": 1},
            field_mask=["places.id", "places.photos"],
        )

        if "error" in search_response or not search_response.get("places"):
            print("  ERROR: Could not find test place")
            return {"error": "No place found"}

        photos = search_response["places"][0].get("photos", [])
        if not photos:
            print("  No photos available")
            return {"error": "No photos"}

        photo_name = photos[0].get("name")

    print(f"\n  Photo name: {photo_name}")

    # Photo URL format for new API
    photo_url = f"https://places.googleapis.com/v1/{photo_name}/media?maxWidthPx=400&key={API_KEY}"

    print(f"  Fetching from: {photo_url[:80]}...")

    try:
        response = requests.get(photo_url, allow_redirects=True)

        if response.status_code == 200:
            content_type = response.headers.get("Content-Type", "")
            content_length = len(response.content)

            print_result("Status", "SUCCESS")
            print_result("Content-Type", content_type)
            print_result("Size", f"{content_length} bytes")

            return {
                "success": True,
                "content_type": content_type,
                "size": content_length,
                "photo_name": photo_name,
            }
        else:
            print(f"  HTTP Error: {response.status_code}")
            print(f"  Response: {response.text[:200]}")
            return {"error": f"HTTP {response.status_code}"}

    except Exception as e:
        print(f"  ERROR: {e}")
        return {"error": str(e)}


def test_nearby_search() -> dict:
    """Test Nearby Search (New) - alternative for location-based discovery."""
    print_header("TEST 5: Nearby Search (New)")
    print("\nThis finds venues near a specific location.")

    # USC coordinates
    location = {"latitude": 34.0224, "longitude": -118.2851}

    field_mask = [
        "places.id",
        "places.displayName",
        "places.formattedAddress",
        "places.rating",
        "places.primaryType",
    ]

    response = make_request(
        "/places:searchNearby",
        data={
            "locationRestriction": {
                "circle": {
                    "center": location,
                    "radius": 1000.0,  # 1km
                }
            },
            "includedTypes": ["restaurant"],
            "maxResultCount": 10,
        },
        field_mask=field_mask,
    )

    if "error" in response:
        return response

    places = response.get("places", [])
    print(f"\n  Found {len(places)} restaurants within 1km of USC")

    for p in places[:5]:
        name = p.get("displayName", {}).get("text", "Unknown")
        rating = p.get("rating", "N/A")
        print(f"    - {name} ({rating} stars)")

    return {
        "success": True,
        "count": len(places),
        "location": location,
    }


def print_cost_estimate() -> None:
    """Print estimated API costs for the new Places API."""
    print_header("COST ESTIMATE (New API)")

    # New API pricing (as of 2024)
    print("\nNew Places API pricing tiers:")
    print("  - Essentials: $0.00 (basic fields)")
    print("  - Pro: ~$0.017/request (most fields)")
    print("  - Enterprise: ~$0.020/request (atmosphere, reviews)")
    print("  - Enterprise + Atmosphere: ~$0.025/request (AI summaries)")

    print("\nScenario estimates:")
    scenarios = [
        ("Seed 1 city (100 venues)", 100 * 0.032 + 100 * 0.025),
        ("Match 100 transactions (30% new)", 100 * 0.017 + 30 * 0.025),
        ("1000 users × 10 txns/month", 10000 * 0.017 + 3000 * 0.025),
    ]

    for name, cost in scenarios:
        print(f"  {name}: ${cost:.2f}")

    print("\nNote: Caching can reduce costs by 60-80% after initial seeding.")


def run_all_tests() -> dict:
    """Run all tests and return summary."""
    print("\n" + "=" * 60)
    print(" GOOGLE PLACES API (NEW) VALIDATION")
    print(" Unified Venue Pipeline - Ceezaa")
    print("=" * 60)
    print("\nUsing NEW Places API with AI features")
    print(f"Base URL: {BASE_URL}")

    results = {}

    # Test 1: Text Search
    results["text_search"] = test_text_search()

    # Test 2: Place Details (use place_id from search if available)
    sample_place_id = results["text_search"].get("sample_place_id")
    results["place_details"] = test_place_details(sample_place_id)

    # Test 3: Find Place (merchant matching)
    results["find_place"] = test_find_place()

    # Test 4: Photo fetching
    photo_name = results["place_details"].get("photo_name")
    results["photo"] = test_photo_url(photo_name)

    # Test 5: Nearby Search
    results["nearby_search"] = test_nearby_search()

    # Cost estimate
    print_cost_estimate()

    # Summary
    print_header("TEST SUMMARY")

    all_success = True
    for test_name, result in results.items():
        if isinstance(result, dict):
            if result.get("error"):
                status = "FAILED"
                all_success = False
            elif result.get("success") or result.get("passed", 0) > 0 or result.get("total_venues", 0) > 0:
                status = "PASSED"
            else:
                status = "UNKNOWN"
        else:
            status = "UNKNOWN"

        print(f"  {test_name}: {status}")

    # Check AI features
    if results.get("place_details", {}).get("has_ai_summary"):
        print("\n  AI Features: AVAILABLE")
    else:
        print("\n  AI Features: Not available (may need billing enabled)")

    print(f"\n  Overall: {'ALL TESTS PASSED' if all_success else 'SOME TESTS FAILED'}")

    return results


if __name__ == "__main__":
    if not API_KEY:
        print("=" * 60)
        print(" ERROR: Missing Google Places API Key")
        print("=" * 60)
        print("\nSetup steps:")
        print("1. Go to https://console.cloud.google.com/")
        print("2. Enable 'Places API (New)' for your project")
        print("3. Create an API key under Credentials")
        print("4. Add to backend/.env:")
        print("   PLACES_API_KEY=your_key_here")
        exit(1)

    print(f"\nAPI Key loaded: {API_KEY[:10]}...")

    # Run all tests
    results = run_all_tests()

    # Save results
    output_path = os.path.join(
        os.path.dirname(__file__),
        "..",
        "data",
        "places_api_test_results.json"
    )
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    with open(output_path, "w") as f:
        json.dump(results, f, indent=2, default=str)

    print(f"\n  Results saved to: {output_path}")
