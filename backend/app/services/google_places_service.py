"""GooglePlacesService - Google Places API (New) integration for venue data.

Uses the new Places API (places.googleapis.com/v1) with AI features.
Provides caching via places_lookup_cache table for merchant matching.
"""

from __future__ import annotations

import time
from dataclasses import dataclass, field
from typing import Any

import requests
from supabase import Client

from app.config import get_settings

BASE_URL = "https://places.googleapis.com/v1"

# Standard fields for venue data
VENUE_FIELDS = [
    "places.id",
    "places.displayName",
    "places.formattedAddress",
    "places.location",
    "places.rating",
    "places.userRatingCount",
    "places.priceLevel",
    "places.googleMapsUri",
    "places.websiteUri",
    "places.primaryType",
    "places.types",
    "places.regularOpeningHours",
    "places.photos",
    # Atmosphere
    "places.dineIn",
    "places.delivery",
    "places.takeout",
    "places.reservable",
    "places.goodForGroups",
    "places.outdoorSeating",
    # AI summaries
    "places.editorialSummary",
    "places.generativeSummary",
]

# Fields for place details (single venue)
DETAIL_FIELDS = [
    "id",
    "displayName",
    "formattedAddress",
    "location",
    "rating",
    "userRatingCount",
    "priceLevel",
    "googleMapsUri",
    "websiteUri",
    "primaryType",
    "types",
    "regularOpeningHours",
    "photos",
    "reviews",
    "dineIn",
    "delivery",
    "takeout",
    "reservable",
    "goodForGroups",
    "outdoorSeating",
    "editorialSummary",
    "generativeSummary",
]


@dataclass
class PlaceMatch:
    """Result from findPlace or textSearch."""

    place_id: str
    name: str
    formatted_address: str | None = None
    lat: float | None = None
    lng: float | None = None


@dataclass
class PlaceDetails:
    """Full venue details from Place Details API."""

    place_id: str
    name: str
    formatted_address: str | None = None
    lat: float | None = None
    lng: float | None = None
    rating: float | None = None
    review_count: int | None = None
    price_level: int | None = None  # 0-4
    google_maps_uri: str | None = None
    website_uri: str | None = None
    primary_type: str | None = None
    types: list[str] = field(default_factory=list)
    opening_hours: dict[str, Any] | None = None
    photo_references: list[str] = field(default_factory=list)
    # Atmosphere
    dine_in: bool | None = None
    delivery: bool | None = None
    takeout: bool | None = None
    reservable: bool | None = None
    good_for_groups: bool | None = None
    outdoor_seating: bool | None = None
    # AI summaries
    editorial_summary: str | None = None
    generative_summary: str | None = None
    reviews: list[dict[str, Any]] = field(default_factory=list)


class RateLimiter:
    """Token bucket rate limiter for API calls."""

    def __init__(self, rate: float = 500, per: float = 60.0) -> None:
        """Initialize rate limiter.

        Args:
            rate: Number of requests allowed per period
            per: Period in seconds (default 60s = 1 minute)
        """
        self.rate = rate
        self.per = per
        self.tokens = rate
        self.last_update = time.time()

    def acquire(self) -> None:
        """Acquire a token, blocking if rate limit exceeded."""
        now = time.time()
        elapsed = now - self.last_update
        self.tokens = min(self.rate, self.tokens + elapsed * (self.rate / self.per))
        self.last_update = now

        if self.tokens < 1:
            sleep_time = (1 - self.tokens) * (self.per / self.rate)
            time.sleep(sleep_time)
            self.tokens = 0
        else:
            self.tokens -= 1


class GooglePlacesService:
    """Service for Google Places API operations with caching."""

    def __init__(self, supabase: Client) -> None:
        """Initialize with Supabase client for caching.

        Args:
            supabase: Supabase client for database operations
        """
        self._supabase = supabase
        self._api_key = get_settings().google_places_api_key
        self._rate_limiter = RateLimiter(rate=500, per=60.0)

    def _make_request(
        self,
        endpoint: str,
        method: str = "POST",
        data: dict | None = None,
        field_mask: list[str] | None = None,
    ) -> dict[str, Any]:
        """Make a request to the Places API.

        Args:
            endpoint: API endpoint path (e.g., "/places:searchText")
            method: HTTP method (GET or POST)
            data: Request body data
            field_mask: List of fields to return

        Returns:
            Response data as dict

        Raises:
            ValueError: If API returns an error
        """
        self._rate_limiter.acquire()

        url = f"{BASE_URL}{endpoint}"
        headers = {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": self._api_key,
        }

        if field_mask:
            headers["X-Goog-FieldMask"] = ",".join(field_mask)

        if method == "POST":
            response = requests.post(url, json=data, headers=headers, timeout=10)
        else:
            response = requests.get(url, headers=headers, timeout=10)

        if response.status_code != 200:
            error = response.json().get("error", {})
            msg = error.get("message", response.text)
            raise ValueError(f"Places API error: {msg}")

        return response.json()

    def find_place(
        self,
        merchant_name: str,
        lat: float | None = None,
        lng: float | None = None,
    ) -> PlaceMatch | None:
        """Find a place by merchant name with optional location bias.

        Uses cache to avoid duplicate API calls.

        Args:
            merchant_name: The merchant name from Plaid
            lat: Latitude for location bias
            lng: Longitude for location bias

        Returns:
            PlaceMatch if found, None otherwise
        """
        # Normalize merchant name for caching
        normalized = merchant_name.lower().strip()

        # Check cache first
        cached = self._get_cached_lookup(normalized, lat, lng)
        if cached is not None:
            if cached.get("google_place_id"):
                return PlaceMatch(
                    place_id=cached["google_place_id"],
                    name=cached["matched_name"],
                    formatted_address=cached["formatted_address"],
                    lat=float(cached["lat"]) if cached.get("lat") else None,
                    lng=float(cached["lng"]) if cached.get("lng") else None,
                )
            # Cached as no-match
            return None

        # Search using textSearch with location bias
        data: dict[str, Any] = {
            "textQuery": merchant_name,
            "maxResultCount": 1,
        }

        if lat is not None and lng is not None:
            data["locationBias"] = {
                "circle": {
                    "center": {"latitude": lat, "longitude": lng},
                    "radius": 500.0,  # 500m radius
                }
            }

        try:
            result = self._make_request(
                "/places:searchText",
                data=data,
                field_mask=[
                    "places.id",
                    "places.displayName",
                    "places.formattedAddress",
                    "places.location",
                ],
            )
        except ValueError:
            # Cache as no-match on API error
            self._cache_lookup(normalized, merchant_name, lat, lng, None)
            return None

        places = result.get("places", [])
        if not places:
            # Cache as no-match
            self._cache_lookup(normalized, merchant_name, lat, lng, None)
            return None

        place = places[0]
        loc = place.get("location", {})

        match = PlaceMatch(
            place_id=place["id"],
            name=place.get("displayName", {}).get("text", merchant_name),
            formatted_address=place.get("formattedAddress"),
            lat=loc.get("latitude"),
            lng=loc.get("longitude"),
        )

        # Cache the successful match
        self._cache_lookup(normalized, merchant_name, lat, lng, match)

        return match

    def get_place_details(self, place_id: str) -> PlaceDetails | None:
        """Get full details for a place.

        Args:
            place_id: Google Place ID

        Returns:
            PlaceDetails if found, None on error
        """
        try:
            result = self._make_request(
                f"/places/{place_id}",
                method="GET",
                field_mask=DETAIL_FIELDS,
            )
        except ValueError:
            return None

        loc = result.get("location", {})
        opening_hours = result.get("regularOpeningHours")

        # Extract photo references (first 5)
        photos = result.get("photos", [])
        photo_refs = [p.get("name", "").split("/")[-1] for p in photos[:5] if p.get("name")]

        # Extract reviews for AI tagging
        reviews = []
        for review in result.get("reviews", [])[:10]:
            reviews.append({
                "text": review.get("text", {}).get("text", ""),
                "stars": review.get("rating"),
            })

        # Parse price level (PRICE_LEVEL_MODERATE -> 2)
        price_level = None
        price_str = result.get("priceLevel", "")
        if price_str:
            level_map = {
                "PRICE_LEVEL_FREE": 0,
                "PRICE_LEVEL_INEXPENSIVE": 1,
                "PRICE_LEVEL_MODERATE": 2,
                "PRICE_LEVEL_EXPENSIVE": 3,
                "PRICE_LEVEL_VERY_EXPENSIVE": 4,
            }
            price_level = level_map.get(price_str)

        # Extract AI summaries
        editorial = result.get("editorialSummary", {}).get("text")
        generative = result.get("generativeSummary", {}).get("overview", {}).get("text")

        return PlaceDetails(
            place_id=place_id,
            name=result.get("displayName", {}).get("text", "Unknown"),
            formatted_address=result.get("formattedAddress"),
            lat=loc.get("latitude"),
            lng=loc.get("longitude"),
            rating=result.get("rating"),
            review_count=result.get("userRatingCount"),
            price_level=price_level,
            google_maps_uri=result.get("googleMapsUri"),
            website_uri=result.get("websiteUri"),
            primary_type=result.get("primaryType"),
            types=result.get("types", []),
            opening_hours=opening_hours,
            photo_references=photo_refs,
            dine_in=result.get("dineIn"),
            delivery=result.get("delivery"),
            takeout=result.get("takeout"),
            reservable=result.get("reservable"),
            good_for_groups=result.get("goodForGroups"),
            outdoor_seating=result.get("outdoorSeating"),
            editorial_summary=editorial,
            generative_summary=generative,
            reviews=reviews,
        )

    def search_venues(
        self,
        query: str,
        lat: float,
        lng: float,
        radius: float = 5000.0,
        max_results: int = 20,
    ) -> list[PlaceMatch]:
        """Search for venues by text query with location.

        Used for Discover pipeline seeding.

        Args:
            query: Search query (e.g., "best restaurants in Los Angeles")
            lat: Center latitude
            lng: Center longitude
            radius: Search radius in meters (default 5km)
            max_results: Maximum number of results (default 20)

        Returns:
            List of PlaceMatch results
        """
        data = {
            "textQuery": query,
            "maxResultCount": min(max_results, 20),
            "locationBias": {
                "circle": {
                    "center": {"latitude": lat, "longitude": lng},
                    "radius": radius,
                }
            },
        }

        try:
            result = self._make_request(
                "/places:searchText",
                data=data,
                field_mask=[
                    "places.id",
                    "places.displayName",
                    "places.formattedAddress",
                    "places.location",
                    "places.rating",
                ],
            )
        except ValueError:
            return []

        matches = []
        for place in result.get("places", []):
            loc = place.get("location", {})
            matches.append(PlaceMatch(
                place_id=place["id"],
                name=place.get("displayName", {}).get("text", "Unknown"),
                formatted_address=place.get("formattedAddress"),
                lat=loc.get("latitude"),
                lng=loc.get("longitude"),
            ))

        return matches

    def get_photo_url(
        self,
        photo_reference: str,
        max_width: int = 400,
    ) -> str:
        """Generate photo URL for a photo reference.

        Args:
            photo_reference: Photo reference from place details
            max_width: Maximum width in pixels

        Returns:
            Photo URL
        """
        # For the new API, photos need to be fetched with the media endpoint
        # The reference is the full photo name like:
        # places/ChIJ.../photos/AZLas...
        return (
            f"{BASE_URL}/{photo_reference}/media"
            f"?maxWidthPx={max_width}&key={self._api_key}"
        )

    def fetch_photo(
        self,
        place_id: str,
        photo_name: str,
        max_width: int = 400,
    ) -> bytes | None:
        """Fetch photo binary data.

        Args:
            place_id: Google Place ID
            photo_name: Full photo name from place details
            max_width: Maximum width in pixels

        Returns:
            Photo bytes or None on error
        """
        self._rate_limiter.acquire()

        url = f"{BASE_URL}/{photo_name}/media?maxWidthPx={max_width}&key={self._api_key}"

        try:
            response = requests.get(url, timeout=10)
            if response.status_code == 200:
                return response.content
        except requests.RequestException:
            pass

        return None

    def _get_cached_lookup(
        self,
        normalized_name: str,
        lat: float | None,
        lng: float | None,
    ) -> dict[str, Any] | None:
        """Get cached merchant lookup result.

        Args:
            normalized_name: Normalized merchant name
            lat: Search latitude
            lng: Search longitude

        Returns:
            Cached result dict or None if not cached
        """
        query = (
            self._supabase.table("places_lookup_cache")
            .select("*")
            .eq("merchant_name_normalized", normalized_name)
        )

        # For location-biased searches, round to grid cell (~1km)
        if lat is not None and lng is not None:
            rounded_lat = round(lat, 2)  # ~1km precision
            rounded_lng = round(lng, 2)
            query = query.eq("search_lat", rounded_lat).eq("search_lng", rounded_lng)
        else:
            query = query.is_("search_lat", "null").is_("search_lng", "null")

        result = query.execute()
        return result.data[0] if result.data else None

    def _cache_lookup(
        self,
        normalized_name: str,
        original_name: str,
        lat: float | None,
        lng: float | None,
        match: PlaceMatch | None,
    ) -> None:
        """Cache a merchant lookup result.

        Args:
            normalized_name: Normalized merchant name
            original_name: Original merchant name
            lat: Search latitude
            lng: Search longitude
            match: PlaceMatch result or None for no-match
        """
        # Round coordinates to grid cell
        rounded_lat = round(lat, 2) if lat is not None else None
        rounded_lng = round(lng, 2) if lng is not None else None

        record = {
            "merchant_name_normalized": normalized_name,
            "merchant_name_original": original_name,
            "search_lat": rounded_lat,
            "search_lng": rounded_lng,
            "google_place_id": match.place_id if match else None,
            "matched_name": match.name if match else None,
            "formatted_address": match.formatted_address if match else None,
            "lat": match.lat if match else None,
            "lng": match.lng if match else None,
        }

        try:
            self._supabase.table("places_lookup_cache").upsert(
                record,
                on_conflict="merchant_name_normalized,search_lat,search_lng",
            ).execute()
        except Exception:
            # Ignore cache write failures
            pass

    def create_or_update_venue(
        self,
        details: PlaceDetails,
        city: str,
        source: str = "discover",
    ) -> dict[str, Any]:
        """Create or update a venue from PlaceDetails.

        Args:
            details: PlaceDetails from API
            city: City name for geo-filtering
            source: Source type ('discover' or 'transaction')

        Returns:
            The upserted venue record
        """
        # Map price_level to price_tier string
        price_tier_map = {0: "free", 1: "$", 2: "$$", 3: "$$$", 4: "$$$$"}
        price_tier = price_tier_map.get(details.price_level) if details.price_level else None

        record = {
            "google_place_id": details.place_id,
            "name": details.name,
            "formatted_address": details.formatted_address,
            "lat": details.lat,
            "lng": details.lng,
            "city": city,
            "google_rating": details.rating,
            "google_review_count": details.review_count,
            "google_price_level": details.price_level,
            "price_tier": price_tier,
            "google_maps_uri": details.google_maps_uri,
            "website_uri": details.website_uri,
            "primary_type": details.primary_type,
            "opening_hours": details.opening_hours,
            "photo_references": details.photo_references,
            "dine_in": details.dine_in,
            "delivery": details.delivery,
            "takeout": details.takeout,
            "reservable": details.reservable,
            "good_for_groups": details.good_for_groups,
            "outdoor_seating": details.outdoor_seating,
            "editorial_summary": details.editorial_summary,
            "generative_summary": details.generative_summary,
            "source": source,
        }

        result = self._supabase.table("venues").upsert(
            record,
            on_conflict="google_place_id",
        ).execute()

        return result.data[0] if result.data else record

    def get_venue_by_place_id(self, place_id: str) -> dict[str, Any] | None:
        """Get venue by Google Place ID.

        Args:
            place_id: Google Place ID

        Returns:
            Venue record or None if not found
        """
        result = (
            self._supabase.table("venues")
            .select("*")
            .eq("google_place_id", place_id)
            .execute()
        )
        return result.data[0] if result.data else None
