"""Users API endpoints.

User search for session invitations.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from supabase import Client

from app.dependencies import get_supabase_client

router = APIRouter(prefix="/api/users", tags=["users"])


# --- Request/Response Models ---


class UserSearchResult(BaseModel):
    """A user search result."""

    id: str
    display_name: str | None
    avatar_url: str | None


class UserSearchResponse(BaseModel):
    """Response for user search."""

    users: list[UserSearchResult]


# --- Endpoints ---


@router.get("/search", response_model=UserSearchResponse)
async def search_users(
    q: str = Query(..., min_length=1, description="Search query"),
    type: str = Query("username", description="Search type: 'username' or 'phone'"),
    supabase: Client = Depends(get_supabase_client),
) -> UserSearchResponse:
    """Search for users by username (display_name) or phone number.

    - type='username': Case-insensitive partial match on display_name
    - type='phone': Exact match on phone number (E.164 format)
    """
    users = []

    if type == "username":
        # Case-insensitive partial match on display_name
        result = (
            supabase.table("profiles")
            .select("id, display_name, avatar_url")
            .ilike("display_name", f"%{q}%")
            .limit(20)
            .execute()
        )

        for user in result.data or []:
            users.append(UserSearchResult(
                id=user["id"],
                display_name=user.get("display_name"),
                avatar_url=user.get("avatar_url"),
            ))

    elif type == "phone":
        # Exact match on phone number
        result = (
            supabase.table("profiles")
            .select("id, display_name, avatar_url, phone")
            .eq("phone", q)
            .maybe_single()
            .execute()
        )

        if result.data:
            users.append(UserSearchResult(
                id=result.data["id"],
                display_name=result.data.get("display_name"),
                avatar_url=result.data.get("avatar_url"),
            ))

    else:
        raise HTTPException(status_code=400, detail="type must be 'username' or 'phone'")

    return UserSearchResponse(users=users)
