"""
Plaid Link Token Exploration Tests.

These tests explore the Plaid Link flow to understand the API before building production code.
Run with: pytest tests/exploration/test_plaid_link.py -v -s

IMPORTANT: These tests use REAL Plaid sandbox credentials from .env (not .env.test)
"""

from pathlib import Path

import pytest
from dotenv import load_dotenv

# Load real .env for exploration tests (need actual Plaid sandbox credentials)
real_env_path = Path(__file__).parent.parent.parent / ".env"
load_dotenv(real_env_path, override=True)

# Clear caches to pick up new env
from app.config import get_settings
from app.services.plaid_client import get_plaid_client

get_settings.cache_clear()
get_plaid_client.cache_clear()

from app.services.plaid_client import (
    create_link_token,
    create_sandbox_public_token,
    exchange_public_token,
)


@pytest.mark.exploration
def test_create_link_token():
    """
    EXPLORATION: Understand link token creation.

    The link token is used to initialize Plaid Link in the mobile app.
    It contains configuration for what products to access.
    """
    result = create_link_token(user_id="test-user-123")

    print("\n=== LINK TOKEN RESPONSE ===")
    print(f"link_token: {result['link_token'][:50]}...")
    print(f"expiration: {result['expiration']}")

    # Verify structure
    assert "link_token" in result
    assert "expiration" in result
    assert result["link_token"].startswith("link-")


@pytest.mark.exploration
def test_sandbox_token_creation():
    """
    EXPLORATION: Create a sandbox public token for testing.

    In sandbox mode, we can create public tokens programmatically
    without going through Plaid Link UI.
    """
    public_token = create_sandbox_public_token()

    print("\n=== SANDBOX PUBLIC TOKEN ===")
    print(f"public_token: {public_token}")

    assert public_token is not None
    assert public_token.startswith("public-sandbox-")


@pytest.mark.exploration
def test_exchange_public_token():
    """
    EXPLORATION: Exchange public token for access token.

    After user completes Plaid Link, we get a public_token.
    We exchange it for an access_token that we store securely.
    """
    # First create a sandbox public token
    public_token = create_sandbox_public_token()

    # Then exchange it
    result = exchange_public_token(public_token)

    print("\n=== TOKEN EXCHANGE RESPONSE ===")
    print(f"access_token: {result['access_token'][:30]}...")
    print(f"item_id: {result['item_id']}")

    # Verify structure
    assert "access_token" in result
    assert "item_id" in result
    assert result["access_token"].startswith("access-sandbox-")


@pytest.mark.exploration
def test_full_link_flow():
    """
    EXPLORATION: Complete link flow end-to-end.

    This simulates what happens when a user:
    1. Starts Plaid Link (we create link_token)
    2. Completes Link (we get public_token back)
    3. Exchange for access_token (we store this)
    """
    # Step 1: Create link token
    link_result = create_link_token(user_id="test-user-456")
    print("\n=== STEP 1: CREATE LINK TOKEN ===")
    print(f"link_token created: {link_result['link_token'][:50]}...")

    # Step 2: Simulate user completing Link (sandbox mode)
    public_token = create_sandbox_public_token()
    print("\n=== STEP 2: USER COMPLETES LINK (SANDBOX) ===")
    print(f"public_token received: {public_token}")

    # Step 3: Exchange for access token
    access_result = exchange_public_token(public_token)
    print("\n=== STEP 3: EXCHANGE FOR ACCESS TOKEN ===")
    print(f"access_token: {access_result['access_token'][:30]}...")
    print(f"item_id: {access_result['item_id']}")

    # All steps succeeded
    assert link_result["link_token"]
    assert public_token
    assert access_result["access_token"]
    assert access_result["item_id"]

    print("\n=== FLOW COMPLETE ===")
    print("Ready to fetch transactions with access_token!")
