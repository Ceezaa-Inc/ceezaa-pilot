"""Debug script to inspect Apify response structure."""

import json
import os
from apify_client import ApifyClient
from dotenv import load_dotenv

load_dotenv()

APIFY_TOKEN = os.getenv("APIFY_TOKEN")
ACTOR_ID = "f8d1fJGFQuLQW1MH0"

client = ApifyClient(APIFY_TOKEN)

print("Running a small test query...")

run_input = {
    "mode": "search",
    "searchQuery": "restaurants near usc",
    "location": "Los Angeles, CA",
    "maxResults": 3,
    "maxReviews": 1,
    "language": "en",
}

run = client.actor(ACTOR_ID).call(run_input=run_input)

print(f"\nDataset ID: {run['defaultDatasetId']}")
print("\nRaw items from Apify:")

items = list(client.dataset(run["defaultDatasetId"]).iterate_items())
print(f"Got {len(items)} items")

if items:
    print("\n--- First item keys ---")
    print(sorted(items[0].keys()))

    print("\n--- First item (pretty printed) ---")
    print(json.dumps(items[0], indent=2, default=str)[:3000])
