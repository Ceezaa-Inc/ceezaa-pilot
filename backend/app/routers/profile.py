"""Profile API endpoints.

User profile data, notification preferences, data export, and account deletion.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel
from supabase import Client

from app.dependencies import get_supabase_client

router = APIRouter(prefix="/api/profile", tags=["profile"])


# --- Request/Response Models ---


class ProfileResponse(BaseModel):
    """User profile data."""

    id: str
    username: str | None
    display_name: str | None
    phone: str | None
    avatar_emoji: str | None
    avatar_url: str | None
    created_at: str
    linked_accounts_count: int


class NotificationPreferencesResponse(BaseModel):
    """Notification preferences."""

    daily_insights: bool
    streak_milestones: bool
    session_invites: bool
    voting_reminders: bool
    plan_confirmations: bool
    marketing: bool


class UpdateNotificationPreferencesRequest(BaseModel):
    """Request to update notification preferences."""

    daily_insights: bool | None = None
    streak_milestones: bool | None = None
    session_invites: bool | None = None
    voting_reminders: bool | None = None
    plan_confirmations: bool | None = None
    marketing: bool | None = None


class DataExportResponse(BaseModel):
    """Data export response with all user data."""

    exported_at: str
    data: dict[str, Any]


class DeleteAccountResponse(BaseModel):
    """Account deletion response."""

    success: bool
    message: str


class UpdateProfileRequest(BaseModel):
    """Request to update profile."""

    display_name: str | None = None
    avatar_emoji: str | None = None
    avatar_url: str | None = None
    phone: str | None = None


# --- Endpoints ---


@router.get("/{user_id}", response_model=ProfileResponse)
async def get_profile(
    user_id: str,
    supabase: Client = Depends(get_supabase_client),
) -> ProfileResponse:
    """Get user profile data including linked accounts count."""
    # Get profile
    profile_result = (
        supabase.table("profiles")
        .select("id, username, display_name, phone, avatar_emoji, avatar_url, created_at")
        .eq("id", user_id)
        .maybe_single()
        .execute()
    )

    if not profile_result.data:
        raise HTTPException(status_code=404, detail="Profile not found")

    profile = profile_result.data

    # Get linked accounts count
    accounts_result = (
        supabase.table("linked_accounts")
        .select("id", count="exact")
        .eq("user_id", user_id)
        .execute()
    )
    linked_accounts_count = accounts_result.count or 0

    return ProfileResponse(
        id=profile["id"],
        username=profile.get("username"),
        display_name=profile.get("display_name"),
        phone=profile.get("phone"),
        avatar_emoji=profile.get("avatar_emoji"),
        avatar_url=profile.get("avatar_url"),
        created_at=profile["created_at"],
        linked_accounts_count=linked_accounts_count,
    )


@router.put("/{user_id}", response_model=ProfileResponse)
async def update_profile(
    user_id: str,
    request: UpdateProfileRequest,
    supabase: Client = Depends(get_supabase_client),
) -> ProfileResponse:
    """Update user profile. Only provided fields are updated."""
    # Build update dict with only non-None values
    update_data = {}
    if request.display_name is not None:
        update_data["display_name"] = request.display_name
    if request.avatar_emoji is not None:
        update_data["avatar_emoji"] = request.avatar_emoji
    if request.avatar_url is not None:
        update_data["avatar_url"] = request.avatar_url
    if request.phone is not None:
        update_data["phone"] = request.phone

    if not update_data:
        # No updates, just return current profile
        return await get_profile(user_id, supabase)

    # Update profile
    result = (
        supabase.table("profiles")
        .update(update_data)
        .eq("id", user_id)
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Profile not found")

    # Return updated profile
    return await get_profile(user_id, supabase)


@router.get("/{user_id}/notifications", response_model=NotificationPreferencesResponse)
async def get_notification_preferences(
    user_id: str,
    supabase: Client = Depends(get_supabase_client),
) -> NotificationPreferencesResponse:
    """Get user notification preferences."""
    result = (
        supabase.table("notification_preferences")
        .select("daily_insights, streak_milestones, session_invites, voting_reminders, plan_confirmations, marketing")
        .eq("user_id", user_id)
        .maybe_single()
        .execute()
    )

    if not result.data:
        # Return defaults if no preferences exist
        return NotificationPreferencesResponse(
            daily_insights=True,
            streak_milestones=True,
            session_invites=True,
            voting_reminders=True,
            plan_confirmations=True,
            marketing=False,
        )

    prefs = result.data
    return NotificationPreferencesResponse(
        daily_insights=prefs.get("daily_insights", True),
        streak_milestones=prefs.get("streak_milestones", True),
        session_invites=prefs.get("session_invites", True),
        voting_reminders=prefs.get("voting_reminders", True),
        plan_confirmations=prefs.get("plan_confirmations", True),
        marketing=prefs.get("marketing", False),
    )


@router.put("/{user_id}/notifications", response_model=NotificationPreferencesResponse)
async def update_notification_preferences(
    user_id: str,
    request: UpdateNotificationPreferencesRequest,
    supabase: Client = Depends(get_supabase_client),
) -> NotificationPreferencesResponse:
    """Update user notification preferences. Only provided fields are updated."""
    # Build update dict with only non-None values
    update_data = {k: v for k, v in request.model_dump().items() if v is not None}

    if not update_data:
        # No updates, just return current preferences
        return await get_notification_preferences(user_id, supabase)

    # Upsert preferences
    result = (
        supabase.table("notification_preferences")
        .upsert({"user_id": user_id, **update_data})
        .execute()
    )

    # Return updated preferences
    return await get_notification_preferences(user_id, supabase)


@router.post("/{user_id}/export", response_model=DataExportResponse)
async def export_user_data(
    user_id: str,
    supabase: Client = Depends(get_supabase_client),
) -> DataExportResponse:
    """Export all user data as JSON."""
    data: dict[str, Any] = {}

    # Profile
    profile_result = supabase.table("profiles").select("*").eq("id", user_id).maybe_single().execute()
    data["profile"] = profile_result.data

    # Declared taste (quiz responses)
    declared_result = supabase.table("declared_taste").select("*").eq("user_id", user_id).maybe_single().execute()
    data["declared_taste"] = declared_result.data

    # Fused taste
    fused_result = supabase.table("fused_taste").select("*").eq("user_id", user_id).maybe_single().execute()
    data["fused_taste"] = fused_result.data

    # User analysis (observed taste)
    analysis_result = supabase.table("user_analysis").select("*").eq("user_id", user_id).maybe_single().execute()
    data["user_analysis"] = analysis_result.data

    # Place visits
    visits_result = (
        supabase.table("place_visits")
        .select("id, merchant_name, visited_at, amount, reaction, notes, source")
        .eq("user_id", user_id)
        .execute()
    )
    data["place_visits"] = visits_result.data

    # Transactions (sanitized - no raw Plaid data)
    transactions_result = (
        supabase.table("transactions")
        .select("id, merchant_name, amount, date, taste_category, plaid_category_primary")
        .eq("user_id", user_id)
        .execute()
    )
    data["transactions"] = transactions_result.data

    # Session participations
    sessions_result = (
        supabase.table("session_participants")
        .select("session_id, role, joined_at")
        .eq("user_id", user_id)
        .execute()
    )
    data["session_participations"] = sessions_result.data

    # Notification preferences
    notif_result = supabase.table("notification_preferences").select("*").eq("user_id", user_id).maybe_single().execute()
    data["notification_preferences"] = notif_result.data

    return DataExportResponse(
        exported_at=datetime.now(timezone.utc).isoformat(),
        data=data,
    )


@router.delete("/{user_id}", response_model=DeleteAccountResponse)
async def delete_account(
    user_id: str,
    supabase: Client = Depends(get_supabase_client),
    x_confirm_delete: str | None = Header(None, alias="X-Confirm-Delete"),
) -> DeleteAccountResponse:
    """Hard delete user account and all associated data.

    Requires X-Confirm-Delete: true header for safety.
    """
    if x_confirm_delete != "true":
        raise HTTPException(
            status_code=400,
            detail="Account deletion requires X-Confirm-Delete: true header",
        )

    # Verify user exists
    profile_result = supabase.table("profiles").select("id").eq("id", user_id).maybe_single().execute()
    if not profile_result.data:
        raise HTTPException(status_code=404, detail="User not found")

    # Delete from all tables in order (respecting foreign key constraints)
    # Most child tables have ON DELETE CASCADE, but we'll be explicit

    # 1. Daily cached data
    supabase.table("daily_insights").delete().eq("user_id", user_id).execute()
    supabase.table("daily_dna").delete().eq("user_id", user_id).execute()
    supabase.table("daily_profile_titles").delete().eq("user_id", user_id).execute()

    # 2. Session-related (need to handle sessions user hosts)
    # Get sessions hosted by user
    hosted_sessions = supabase.table("sessions").select("id").eq("host_id", user_id).execute()
    for session in hosted_sessions.data or []:
        session_id = session["id"]
        supabase.table("session_votes").delete().eq("session_id", session_id).execute()
        supabase.table("session_venues").delete().eq("session_id", session_id).execute()
        supabase.table("session_participants").delete().eq("session_id", session_id).execute()
        supabase.table("session_invitations").delete().eq("session_id", session_id).execute()

    # Delete sessions hosted by user
    supabase.table("sessions").delete().eq("host_id", user_id).execute()

    # Delete user's participations in other sessions
    supabase.table("session_participants").delete().eq("user_id", user_id).execute()
    supabase.table("session_invitations").delete().eq("invitee_user_id", user_id).execute()
    supabase.table("session_invitations").delete().eq("inviter_user_id", user_id).execute()

    # 3. Visit and transaction data
    supabase.table("place_visits").delete().eq("user_id", user_id).execute()
    supabase.table("transactions").delete().eq("user_id", user_id).execute()
    supabase.table("linked_accounts").delete().eq("user_id", user_id).execute()

    # 4. Taste data
    supabase.table("fused_taste").delete().eq("user_id", user_id).execute()
    supabase.table("user_analysis").delete().eq("user_id", user_id).execute()
    supabase.table("declared_taste").delete().eq("user_id", user_id).execute()
    supabase.table("quiz_responses").delete().eq("user_id", user_id).execute()

    # 5. Collections
    supabase.table("bookmarks").delete().eq("user_id", user_id).execute()
    # Get user's playlists
    playlists = supabase.table("playlists").select("id").eq("user_id", user_id).execute()
    for playlist in playlists.data or []:
        supabase.table("playlist_venues").delete().eq("playlist_id", playlist["id"]).execute()
    supabase.table("playlists").delete().eq("user_id", user_id).execute()

    # 6. User settings
    supabase.table("push_tokens").delete().eq("user_id", user_id).execute()
    supabase.table("notification_preferences").delete().eq("user_id", user_id).execute()
    supabase.table("onboarding_state").delete().eq("user_id", user_id).execute()

    # 7. Finally, delete profile (this is the main user record)
    supabase.table("profiles").delete().eq("id", user_id).execute()

    # 8. Delete from auth.users using admin API
    try:
        supabase.auth.admin.delete_user(user_id)
    except Exception:
        # Auth user might not exist or already deleted
        pass

    return DeleteAccountResponse(
        success=True,
        message="Account and all associated data have been permanently deleted",
    )
