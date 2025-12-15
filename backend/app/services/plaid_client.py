"""Plaid API client wrapper."""

from functools import lru_cache
from typing import Optional

import plaid
from plaid.api import plaid_api
from plaid.model.country_code import CountryCode
from plaid.model.link_token_create_request import LinkTokenCreateRequest
from plaid.model.link_token_create_request_user import LinkTokenCreateRequestUser
from plaid.model.products import Products
from plaid.model.sandbox_public_token_create_request import (
    SandboxPublicTokenCreateRequest,
)
from plaid.model.sandbox_public_token_create_request_options import (
    SandboxPublicTokenCreateRequestOptions,
)
from plaid.model.sandbox_public_token_create_request_options_transactions import (
    SandboxPublicTokenCreateRequestOptionsTransactions,
)
from plaid.model.item_public_token_exchange_request import (
    ItemPublicTokenExchangeRequest,
)
from plaid.model.transactions_sync_request import TransactionsSyncRequest

from app.config import get_settings


@lru_cache
def get_plaid_client() -> plaid_api.PlaidApi:
    """Get cached Plaid API client."""
    settings = get_settings()

    # Map environment string to Plaid environment
    # Note: Plaid SDK only has Sandbox and Production
    env_map = {
        "sandbox": plaid.Environment.Sandbox,
        "production": plaid.Environment.Production,
    }

    configuration = plaid.Configuration(
        host=env_map.get(settings.plaid_env, plaid.Environment.Sandbox),
        api_key={
            "clientId": settings.plaid_client_id,
            "secret": settings.plaid_secret,
        },
    )

    api_client = plaid.ApiClient(configuration)
    return plaid_api.PlaidApi(api_client)


def create_link_token(user_id: str) -> dict:
    """Create a Plaid Link token for a user.

    Args:
        user_id: Unique identifier for the user

    Returns:
        dict with link_token and expiration
    """
    client = get_plaid_client()

    request_kwargs = {
        "products": [Products("transactions")],
        "client_name": "Ceezaa",
        "country_codes": [CountryCode("US")],
        "language": "en",
        "user": LinkTokenCreateRequestUser(client_user_id=user_id),
    }

    # Note: redirect_uri for OAuth banks (Chase, etc.) requires configuration
    # in Plaid Dashboard first. Uncomment once registered:
    # if settings.plaid_env == "sandbox":
    #     request_kwargs["redirect_uri"] = "https://cdn.plaid.com/link/v2/stable/sandbox-oauth-a2a-redirect.html"
    # else:
    #     request_kwargs["redirect_uri"] = "ceezaa://plaid-oauth"

    request = LinkTokenCreateRequest(**request_kwargs)
    response = client.link_token_create(request)

    return {
        "link_token": response.link_token,
        "expiration": response.expiration.isoformat(),
    }


def exchange_public_token(public_token: str) -> dict:
    """Exchange a public token for an access token.

    Args:
        public_token: The public token from Plaid Link

    Returns:
        dict with access_token and item_id
    """
    client = get_plaid_client()

    request = ItemPublicTokenExchangeRequest(public_token=public_token)
    response = client.item_public_token_exchange(request)

    return {
        "access_token": response.access_token,
        "item_id": response.item_id,
    }


def create_sandbox_public_token(
    institution_id: str = "ins_109508",
    with_transactions: bool = False,
) -> str:
    """Create a sandbox public token for testing.

    Args:
        institution_id: Plaid institution ID (default: First Platypus Bank)
        with_transactions: If True, use custom_user to generate realistic transactions

    Returns:
        public_token for testing
    """
    client = get_plaid_client()

    request_kwargs = {
        "institution_id": institution_id,
        "initial_products": [Products("transactions")],
    }

    # Use custom user options to get transactions with different date ranges
    if with_transactions:
        from datetime import date, timedelta
        # Generate transactions for the past 30 days
        end = date.today()
        start = end - timedelta(days=30)
        request_kwargs["options"] = SandboxPublicTokenCreateRequestOptions(
            transactions=SandboxPublicTokenCreateRequestOptionsTransactions(
                start_date=start,
                end_date=end,
            )
        )

    request = SandboxPublicTokenCreateRequest(**request_kwargs)

    response = client.sandbox_public_token_create(request)
    return response.public_token


def create_sandbox_item_with_transactions() -> dict:
    """Create a sandbox item with pre-populated transactions for testing.

    This is useful for integration tests that need transaction data.

    Returns:
        dict with access_token, item_id, and initial transaction sync result
    """
    # Create public token with transactions enabled
    public_token = create_sandbox_public_token(with_transactions=True)

    # Exchange for access token
    exchange_result = exchange_public_token(public_token)

    # Sync transactions to verify they exist
    sync_result = sync_transactions(exchange_result["access_token"])

    return {
        "access_token": exchange_result["access_token"],
        "item_id": exchange_result["item_id"],
        "transactions_added": len(sync_result["added"]),
        "next_cursor": sync_result["next_cursor"],
    }


def sync_transactions(access_token: str, cursor: Optional[str] = None) -> dict:
    """Sync transactions using the transactions/sync endpoint.

    Args:
        access_token: The access token for the account
        cursor: Optional cursor for incremental sync

    Returns:
        dict with added, modified, removed transactions and next_cursor
    """
    client = get_plaid_client()

    request_kwargs = {"access_token": access_token}
    if cursor:
        request_kwargs["cursor"] = cursor

    request = TransactionsSyncRequest(**request_kwargs)
    response = client.transactions_sync(request)

    return {
        "added": response.added,
        "modified": response.modified,
        "removed": response.removed,
        "next_cursor": response.next_cursor,
        "has_more": response.has_more,
    }
