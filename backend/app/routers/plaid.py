"""Plaid API endpoints for bank account linking and transaction sync."""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.dependencies import get_supabase_client
from app.services.plaid_client import (
    create_link_token,
    exchange_public_token,
)
from app.services.plaid_service import PlaidService

router = APIRouter(prefix="/api/plaid", tags=["plaid"])


def get_plaid_service() -> PlaidService:
    """Dependency to get PlaidService instance."""
    return PlaidService(get_supabase_client())


# Request/Response models
class CreateLinkTokenRequest(BaseModel):
    """Request body for creating a Plaid link token."""

    user_id: str


class CreateLinkTokenResponse(BaseModel):
    """Response body for created link token."""

    link_token: str
    expiration: str


class ExchangeTokenRequest(BaseModel):
    """Request body for exchanging a public token."""

    public_token: str
    institution_id: str
    institution_name: str
    user_id: str  # In production, this would come from auth


class ExchangeTokenResponse(BaseModel):
    """Response body for exchanged token."""

    account_id: str
    institution_name: str
    last_synced: Optional[str] = None


class SyncRequest(BaseModel):
    """Request body for syncing transactions."""

    account_id: str


class TransactionData(BaseModel):
    """Transaction data from Plaid."""

    transaction_id: str
    amount: float
    date: str
    name: str
    merchant_name: Optional[str] = None
    category: Optional[list[str]] = None
    pending: bool = False


class SyncResponse(BaseModel):
    """Response body for transaction sync."""

    added: list[TransactionData]
    modified: list[TransactionData]
    removed: list[str]
    has_more: bool


class LinkedAccountResponse(BaseModel):
    """Response for a linked account."""

    id: str
    user_id: str
    institution_id: Optional[str] = None
    institution_name: Optional[str] = None
    last_synced_at: Optional[str] = None
    created_at: str


class DeleteResponse(BaseModel):
    """Response body for delete operations."""

    success: bool


@router.post("/create-link-token", response_model=CreateLinkTokenResponse)
async def create_plaid_link_token(request: CreateLinkTokenRequest) -> CreateLinkTokenResponse:
    """Create a Plaid Link token for initializing the link flow.

    This token is used by the mobile app to open Plaid Link UI.
    """
    result = create_link_token(user_id=request.user_id)
    return CreateLinkTokenResponse(
        link_token=result["link_token"],
        expiration=result["expiration"],
    )


@router.post("/exchange-token", response_model=ExchangeTokenResponse)
async def exchange_plaid_token(
    request: ExchangeTokenRequest,
    plaid_service: PlaidService = Depends(get_plaid_service),
) -> ExchangeTokenResponse:
    """Exchange a public token for an access token.

    Called after user completes Plaid Link. Stores the linked account in DB.
    """
    # Exchange public token for access token
    result = exchange_public_token(request.public_token)

    # Store linked account in database
    linked_account = plaid_service.link_account(
        user_id=request.user_id,
        access_token=result["access_token"],
        item_id=result["item_id"],
        institution_id=request.institution_id,
        institution_name=request.institution_name,
    )

    return ExchangeTokenResponse(
        account_id=linked_account["id"],
        institution_name=request.institution_name,
        last_synced=linked_account.get("last_synced_at"),
    )


@router.get("/accounts", response_model=list[LinkedAccountResponse])
async def get_linked_accounts(
    user_id: str,
    plaid_service: PlaidService = Depends(get_plaid_service),
) -> list[LinkedAccountResponse]:
    """Get all linked accounts for a user."""
    accounts = plaid_service.get_user_accounts(user_id)
    return [
        LinkedAccountResponse(
            id=acc["id"],
            user_id=acc["user_id"],
            institution_id=acc.get("institution_id"),
            institution_name=acc.get("institution_name"),
            last_synced_at=acc.get("last_synced_at"),
            created_at=acc["created_at"],
        )
        for acc in accounts
    ]


@router.post("/sync", response_model=SyncResponse)
async def sync_plaid_transactions(
    request: SyncRequest,
    plaid_service: PlaidService = Depends(get_plaid_service),
) -> SyncResponse:
    """Sync transactions for a linked account.

    Uses cursor-based sync to fetch only new/modified/removed transactions.
    """
    # Check if account exists
    account = plaid_service.get_account(request.account_id)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    # Sync transactions
    result = plaid_service.sync_transactions(request.account_id)

    # Convert transactions to response format
    def to_tx(t: dict) -> TransactionData:
        date_val = t["date"]
        date_str = date_val.isoformat() if hasattr(date_val, "isoformat") else str(date_val)
        return TransactionData(
            transaction_id=t["transaction_id"],
            amount=t["amount"],
            date=date_str,
            name=t["name"],
            merchant_name=t.get("merchant_name"),
            category=t.get("category"),
            pending=t.get("pending", False),
        )

    added = [to_tx(t) for t in result.get("added", [])]
    modified = [to_tx(t) for t in result.get("modified", [])]

    return SyncResponse(
        added=added,
        modified=modified,
        removed=result.get("removed", []),
        has_more=result.get("has_more", False),
    )


@router.delete("/accounts/{account_id}", response_model=DeleteResponse)
async def delete_linked_account(
    account_id: str,
    plaid_service: PlaidService = Depends(get_plaid_service),
) -> DeleteResponse:
    """Delete a linked account and all associated data.

    Removes the Plaid connection and synced transactions.
    """
    success = plaid_service.delete_account(account_id)
    if not success:
        raise HTTPException(status_code=404, detail="Account not found")

    return DeleteResponse(success=True)
