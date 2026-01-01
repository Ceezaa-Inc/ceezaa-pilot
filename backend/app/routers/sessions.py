"""Sessions API endpoints.

Manages group planning sessions with real-time voting.
"""

from __future__ import annotations

import logging
from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from supabase import Client

from app.dependencies import get_supabase_client
from app.intelligence.matching_engine import MatchingEngine

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/sessions", tags=["sessions"])

# Shared matching engine instance
_matching_engine = MatchingEngine()


# --- Request/Response Models ---


class ParticipantResponse(BaseModel):
    """A session participant."""

    id: str
    user_id: str
    name: str
    avatar: str | None
    is_host: bool
    has_voted: bool


class SessionVenueResponse(BaseModel):
    """A venue in a session with vote count."""

    venue_id: str
    venue_name: str
    venue_type: str | None
    photo_url: str | None
    votes: int
    voted_by: list[str]
    match_percentage: int | None = None  # Group match score (0-100)


class SessionResponse(BaseModel):
    """Full session details."""

    id: str
    code: str
    title: str
    planned_date: str | None
    planned_time: str | None
    status: str
    host_id: str
    participants: list[ParticipantResponse]
    venues: list[SessionVenueResponse]
    winner_id: str | None
    created_at: str


class SessionListItem(BaseModel):
    """Session item for list view."""

    id: str
    code: str
    title: str
    planned_date: str | None
    status: str
    participant_count: int
    venue_count: int
    total_votes: int
    created_at: str


class SessionsListResponse(BaseModel):
    """List of user's sessions."""

    active: list[SessionListItem]
    past: list[SessionListItem]


class CreateSessionRequest(BaseModel):
    """Request to create a new session."""

    title: str
    planned_date: str | None = None
    planned_time: str | None = None


class AddVenueRequest(BaseModel):
    """Request to add a venue to a session.

    Either venue_id (for existing venues) or venue_name (to create new) is required.
    """

    venue_id: str | None = None     # Existing venue UUID
    venue_name: str | None = None   # For creating new venue from vault place
    venue_type: str | None = None   # Category/cuisine for new venue


class VoteRequest(BaseModel):
    """Request to vote for a venue."""

    venue_id: str


class InvitationResponse(BaseModel):
    """A pending invitation."""

    id: str
    session_id: str
    session_title: str
    session_date: str | None
    inviter_name: str
    inviter_avatar: str | None
    participant_count: int
    venue_count: int
    created_at: str


class InvitationsListResponse(BaseModel):
    """List of pending invitations."""

    invitations: list[InvitationResponse]


class InviteRequest(BaseModel):
    """Request to invite users to a session."""

    user_ids: list[str] | None = None
    phone_numbers: list[str] | None = None


class InviteResultResponse(BaseModel):
    """Result of sending invitations."""

    sent: int
    failed: int
    deep_link: str | None = None


class InvitationActionRequest(BaseModel):
    """Request to accept or decline an invitation."""

    action: str  # "accept" or "decline"


class InvitationActionResponse(BaseModel):
    """Response for decline action."""

    success: bool


# --- Endpoints ---


@router.get("/{user_id}", response_model=SessionsListResponse)
async def get_user_sessions(
    user_id: str,
    supabase: Client = Depends(get_supabase_client),
) -> SessionsListResponse:
    """Get all sessions for a user (as host or participant)."""
    # Get sessions where user is a participant
    participant_result = (
        supabase.table("session_participants")
        .select("session_id")
        .eq("user_id", user_id)
        .execute()
    )

    session_ids = [p["session_id"] for p in (participant_result.data or [])]

    if not session_ids:
        return SessionsListResponse(active=[], past=[])

    # Fetch session details
    sessions_result = (
        supabase.table("sessions")
        .select("*")
        .in_("id", session_ids)
        .order("created_at", desc=True)
        .execute()
    )

    sessions = sessions_result.data or []

    # Get participant and venue counts
    active = []
    past = []
    today = datetime.now().strftime("%Y-%m-%d")

    for session in sessions:
        # Get counts
        participants_result = (
            supabase.table("session_participants")
            .select("id", count="exact")
            .eq("session_id", session["id"])
            .execute()
        )
        venues_result = (
            supabase.table("session_venues")
            .select("id", count="exact")
            .eq("session_id", session["id"])
            .execute()
        )
        votes_result = (
            supabase.table("session_votes")
            .select("id", count="exact")
            .eq("session_id", session["id"])
            .execute()
        )

        item = SessionListItem(
            id=session["id"],
            code=session["invite_code"],
            title=session["title"],
            planned_date=session.get("planned_date"),
            status=session["status"],
            participant_count=participants_result.count or 0,
            venue_count=venues_result.count or 0,
            total_votes=votes_result.count or 0,
            created_at=session["created_at"],
        )

        # Categorize by date, not status
        # Upcoming: planned_date >= today OR no date set
        # Past: planned_date < today
        planned_date = session.get("planned_date")

        if not planned_date or planned_date >= today:
            active.append(item)
        else:
            past.append(item)

    return SessionsListResponse(active=active, past=past)


@router.post("/{user_id}", response_model=SessionResponse)
async def create_session(
    user_id: str,
    request: CreateSessionRequest,
    supabase: Client = Depends(get_supabase_client),
) -> SessionResponse:
    """Create a new session. User becomes the host."""
    session_data = {
        "host_id": user_id,
        "title": request.title,
        "planned_date": request.planned_date,
        "planned_time": request.planned_time,
        "status": "voting",
    }

    result = supabase.table("sessions").insert(session_data).execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create session")

    session = result.data[0]

    # Host is auto-added as participant via trigger, but let's verify
    # and get the full session details
    return await get_session_details(session["id"], supabase)


@router.get("/detail/{session_id}", response_model=SessionResponse)
async def get_session(
    session_id: str,
    supabase: Client = Depends(get_supabase_client),
) -> SessionResponse:
    """Get full session details by ID."""
    return await get_session_details(session_id, supabase)


@router.post("/join/{code}", response_model=SessionResponse)
async def join_session(
    code: str,
    user_id: str,
    supabase: Client = Depends(get_supabase_client),
) -> SessionResponse:
    """Join a session by invite code."""
    # Find session by code
    session_result = (
        supabase.table("sessions")
        .select("*")
        .eq("invite_code", code.upper())
        .maybe_single()
        .execute()
    )

    if not session_result.data:
        raise HTTPException(status_code=404, detail="Session not found")

    session = session_result.data

    if session["status"] != "voting":
        raise HTTPException(status_code=400, detail="Session is no longer accepting participants")

    # Check if already a participant
    existing_result = (
        supabase.table("session_participants")
        .select("id")
        .eq("session_id", session["id"])
        .eq("user_id", user_id)
        .execute()
    )

    if not existing_result.data:
        # Add as participant
        supabase.table("session_participants").insert({
            "session_id": session["id"],
            "user_id": user_id,
            "role": "participant",
        }).execute()

    # Mark any pending invitation for this session as accepted
    supabase.table("session_invitations").update({
        "status": "accepted",
        "responded_at": "now()",
    }).eq("session_id", session["id"]).eq("invitee_id", user_id).eq("status", "pending").execute()

    return await get_session_details(session["id"], supabase)


@router.post("/{session_id}/venues", response_model=SessionResponse)
async def add_venue_to_session(
    session_id: str,
    request: AddVenueRequest,
    user_id: str,
    supabase: Client = Depends(get_supabase_client),
) -> SessionResponse:
    """Add a venue to a session.

    Accepts either:
    - venue_id: UUID of existing venue in venues table
    - venue_name + venue_type: Creates a new venue from vault place data
    """
    # Validate request
    if not request.venue_id and not request.venue_name:
        raise HTTPException(
            status_code=400,
            detail="Either venue_id or venue_name is required",
        )

    # Check session exists and is voting
    session_result = (
        supabase.table("sessions")
        .select("status")
        .eq("id", session_id)
        .maybe_single()
        .execute()
    )

    if not session_result.data:
        raise HTTPException(status_code=404, detail="Session not found")

    if session_result.data["status"] != "voting":
        raise HTTPException(status_code=400, detail="Session is no longer accepting venues")

    venue_id = request.venue_id

    # If venue_id provided, check if it exists
    if venue_id:
        venue_check = (
            supabase.table("venues")
            .select("id")
            .eq("id", venue_id)
            .maybe_single()
            .execute()
        )
        if not venue_check.data:
            # Venue ID doesn't exist - try to create from name if provided
            if request.venue_name:
                venue_id = None  # Will create below
            else:
                print(f"[Sessions] Venue {request.venue_id} not found, skipping")
                return await get_session_details(session_id, supabase)

    # Create venue if we have venue_name but no valid venue_id
    if not venue_id and request.venue_name:
        # Check if venue with this name already exists
        existing_venue = (
            supabase.table("venues")
            .select("id")
            .eq("name", request.venue_name)
            .maybe_single()
            .execute()
        )

        if existing_venue.data:
            venue_id = existing_venue.data["id"]
        else:
            # Create new venue from vault place data
            new_venue = supabase.table("venues").insert({
                "name": request.venue_name,
                "taste_cluster": request.venue_type,  # Use venue_type as taste_cluster
            }).execute()

            if new_venue.data:
                venue_id = new_venue.data[0]["id"]
                print(f"[Sessions] Created venue {venue_id} for '{request.venue_name}'")
            else:
                raise HTTPException(status_code=500, detail="Failed to create venue")

    # Check if venue already added to session
    try:
        existing = (
            supabase.table("session_venues")
            .select("id")
            .eq("session_id", session_id)
            .eq("venue_id", venue_id)
            .maybe_single()
            .execute()
        )
        venue_already_added = existing.data is not None
    except Exception:
        venue_already_added = False

    if not venue_already_added:
        supabase.table("session_venues").insert({
            "session_id": session_id,
            "venue_id": venue_id,
            "added_by": user_id,
        }).execute()

    return await get_session_details(session_id, supabase)


@router.post("/{session_id}/vote", response_model=SessionResponse)
async def vote_for_venue(
    session_id: str,
    request: VoteRequest,
    user_id: str,
    supabase: Client = Depends(get_supabase_client),
) -> SessionResponse:
    """Vote for a venue in a session."""
    # Check session is voting
    session_result = (
        supabase.table("sessions")
        .select("status")
        .eq("id", session_id)
        .maybe_single()
        .execute()
    )

    if not session_result.data:
        raise HTTPException(status_code=404, detail="Session not found")

    if session_result.data["status"] != "voting":
        raise HTTPException(status_code=400, detail="Voting is closed")

    # Check user is a participant
    participant = (
        supabase.table("session_participants")
        .select("id")
        .eq("session_id", session_id)
        .eq("user_id", user_id)
        .maybe_single()
        .execute()
    )

    if not participant.data:
        raise HTTPException(status_code=403, detail="Not a participant in this session")

    # Add or update vote (atomic upsert - uses unique_user_vote_per_session constraint)
    supabase.table("session_votes").upsert(
        {
            "session_id": session_id,
            "venue_id": request.venue_id,
            "user_id": user_id,
        },
        on_conflict="session_id,user_id"
    ).execute()

    return await get_session_details(session_id, supabase)


@router.post("/{session_id}/close", response_model=SessionResponse)
async def close_voting(
    session_id: str,
    user_id: str,
    supabase: Client = Depends(get_supabase_client),
) -> SessionResponse:
    """Close voting and determine winner. Only host can close."""
    # Check user is host
    session_result = (
        supabase.table("sessions")
        .select("host_id, status")
        .eq("id", session_id)
        .maybe_single()
        .execute()
    )

    if not session_result.data:
        raise HTTPException(status_code=404, detail="Session not found")

    if session_result.data["host_id"] != user_id:
        raise HTTPException(status_code=403, detail="Only host can close voting")

    if session_result.data["status"] != "voting":
        raise HTTPException(status_code=400, detail="Session is not in voting state")

    # Get vote counts
    votes_result = (
        supabase.table("session_votes")
        .select("venue_id")
        .eq("session_id", session_id)
        .execute()
    )

    votes = votes_result.data or []

    # Count votes per venue
    vote_counts: dict[str, int] = {}
    for vote in votes:
        venue_id = vote["venue_id"]
        vote_counts[venue_id] = vote_counts.get(venue_id, 0) + 1

    # Find winner (most votes)
    winner_id = None
    if vote_counts:
        winner_id = max(vote_counts, key=vote_counts.get)

    # Update session
    supabase.table("sessions").update({
        "status": "confirmed",
        "winning_venue_id": winner_id,
        "closed_at": datetime.now().isoformat(),
    }).eq("id", session_id).execute()

    return await get_session_details(session_id, supabase)


@router.delete("/{session_id}/participants/{participant_user_id}", response_model=SessionResponse)
async def remove_participant(
    session_id: str,
    participant_user_id: str,
    user_id: str,
    supabase: Client = Depends(get_supabase_client),
) -> SessionResponse:
    """Remove a participant from a session. Only host can remove."""
    # Check session exists and user is host
    session_result = (
        supabase.table("sessions")
        .select("host_id, status")
        .eq("id", session_id)
        .maybe_single()
        .execute()
    )

    if not session_result.data:
        raise HTTPException(status_code=404, detail="Session not found")

    if session_result.data["host_id"] != user_id:
        raise HTTPException(status_code=403, detail="Only host can remove participants")

    if session_result.data["status"] != "voting":
        raise HTTPException(status_code=400, detail="Cannot remove participants from closed session")

    # Cannot remove self (host)
    if participant_user_id == user_id:
        raise HTTPException(status_code=400, detail="Host cannot remove themselves")

    # Delete from session_participants
    (
        supabase.table("session_participants")
        .delete()
        .eq("session_id", session_id)
        .eq("user_id", participant_user_id)
        .execute()
    )

    # Also delete their votes from this session
    supabase.table("session_votes").delete().eq(
        "session_id", session_id
    ).eq("user_id", participant_user_id).execute()

    return await get_session_details(session_id, supabase)


# --- Invitation Endpoints ---


@router.get("/{user_id}/invitations", response_model=InvitationsListResponse)
async def get_invitations(
    user_id: str,
    supabase: Client = Depends(get_supabase_client),
) -> InvitationsListResponse:
    """Get pending invitations for a user."""
    # Get pending invitations with session and inviter info
    result = (
        supabase.table("session_invitations")
        .select("*, sessions(id, title, planned_date, status, invite_code), profiles!session_invitations_inviter_id_fkey(id, display_name, avatar_url)")
        .eq("invitee_id", user_id)
        .eq("status", "pending")
        .order("created_at", desc=True)
        .execute()
    )

    invitations_data = result.data or []
    invitations = []

    for inv in invitations_data:
        session = inv.get("sessions") or {}
        inviter = inv.get("profiles") or {}

        # Skip if session is no longer voting
        if session.get("status") != "voting":
            continue

        # Get counts for this session
        participants_result = (
            supabase.table("session_participants")
            .select("id", count="exact")
            .eq("session_id", inv["session_id"])
            .execute()
        )
        venues_result = (
            supabase.table("session_venues")
            .select("id", count="exact")
            .eq("session_id", inv["session_id"])
            .execute()
        )

        invitations.append(InvitationResponse(
            id=inv["id"],
            session_id=inv["session_id"],
            session_title=session.get("title", "Unknown Session"),
            session_date=session.get("planned_date"),
            inviter_name=inviter.get("display_name") or "Unknown",
            inviter_avatar=inviter.get("avatar_url"),
            participant_count=participants_result.count or 0,
            venue_count=venues_result.count or 0,
            created_at=inv["created_at"],
        ))

    return InvitationsListResponse(invitations=invitations)


@router.post("/{session_id}/invite", response_model=InviteResultResponse)
async def send_invitations(
    session_id: str,
    request: InviteRequest,
    user_id: str,
    supabase: Client = Depends(get_supabase_client),
) -> InviteResultResponse:
    """Send invitations to users for a session."""
    # Check session exists and is voting
    session_result = (
        supabase.table("sessions")
        .select("id, status, invite_code")
        .eq("id", session_id)
        .maybe_single()
        .execute()
    )

    if not session_result.data:
        raise HTTPException(status_code=404, detail="Session not found")

    if session_result.data["status"] != "voting":
        raise HTTPException(status_code=400, detail="Session is no longer accepting invites")

    # Check user is a participant
    participant = (
        supabase.table("session_participants")
        .select("id")
        .eq("session_id", session_id)
        .eq("user_id", user_id)
        .maybe_single()
        .execute()
    )

    if not participant.data:
        raise HTTPException(status_code=403, detail="Only session participants can invite others")

    sent = 0
    failed = 0
    deep_link = None

    logger.info(f"[send_invitations] session_id={session_id}, user_id={user_id}, request={request}")

    # Invite existing users by user_id
    if request.user_ids:
        for invitee_id in request.user_ids:
            logger.info(f"[send_invitations] Processing invitee_id={invitee_id}, type={type(invitee_id)}")

            # Validate UUID format
            try:
                UUID(invitee_id)
            except (ValueError, TypeError) as e:
                logger.error(f"[send_invitations] Invalid UUID format for invitee_id={invitee_id}: {e}")
                failed += 1
                continue

            # Skip if already a participant
            try:
                existing_participant = (
                    supabase.table("session_participants")
                    .select("id")
                    .eq("session_id", session_id)
                    .eq("user_id", invitee_id)
                    .maybe_single()
                    .execute()
                )
                logger.info(f"[send_invitations] existing_participant query result: {existing_participant}")
            except Exception as e:
                logger.error(f"[send_invitations] Query failed for existing_participant: {e}", exc_info=True)
                failed += 1
                continue

            if existing_participant and existing_participant.data:
                logger.info(f"[send_invitations] Skipping - already a participant")
                continue

            # Skip if already invited
            try:
                existing_invite = (
                    supabase.table("session_invitations")
                    .select("id")
                    .eq("session_id", session_id)
                    .eq("invitee_id", invitee_id)
                    .maybe_single()
                    .execute()
                )
                logger.info(f"[send_invitations] existing_invite query result: {existing_invite}")
            except Exception as e:
                logger.error(f"[send_invitations] Query failed for existing_invite: {e}", exc_info=True)
                failed += 1
                continue

            if existing_invite and existing_invite.data:
                logger.info(f"[send_invitations] Skipping - already invited")
                continue

            try:
                supabase.table("session_invitations").insert({
                    "session_id": session_id,
                    "inviter_id": user_id,
                    "invitee_id": invitee_id,
                    "status": "pending",
                }).execute()
                sent += 1
                logger.info(f"[send_invitations] Successfully sent invitation to {invitee_id}")
            except Exception as e:
                logger.error(f"[send_invitations] Failed to insert invitation: {e}", exc_info=True)
                failed += 1

    # Create invitations for phone numbers (non-app users)
    if request.phone_numbers:
        invite_code = session_result.data["invite_code"]
        deep_link = f"https://ceezaa.app/join/{invite_code}"

        for phone in request.phone_numbers:
            # Skip if already invited by phone
            existing_phone_invite = (
                supabase.table("session_invitations")
                .select("id")
                .eq("session_id", session_id)
                .eq("invitee_phone", phone)
                .maybe_single()
                .execute()
            )
            if existing_phone_invite.data:
                continue

            try:
                supabase.table("session_invitations").insert({
                    "session_id": session_id,
                    "inviter_id": user_id,
                    "invitee_phone": phone,
                    "status": "pending",
                }).execute()
                sent += 1
            except Exception:
                failed += 1

    return InviteResultResponse(sent=sent, failed=failed, deep_link=deep_link)


@router.post("/invitations/{invitation_id}/respond")
async def respond_to_invitation(
    invitation_id: str,
    request: InvitationActionRequest,
    user_id: str,
    supabase: Client = Depends(get_supabase_client),
) -> SessionResponse | InvitationActionResponse:
    """Accept or decline an invitation."""
    # Validate action
    if request.action not in ["accept", "decline"]:
        raise HTTPException(status_code=400, detail="Action must be 'accept' or 'decline'")

    # Get invitation
    invitation_result = (
        supabase.table("session_invitations")
        .select("*")
        .eq("id", invitation_id)
        .maybe_single()
        .execute()
    )

    if not invitation_result.data:
        raise HTTPException(status_code=404, detail="Invitation not found")

    invitation = invitation_result.data

    # Verify user is the invitee
    if invitation["invitee_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to respond to this invitation")

    # Check invitation is still pending
    if invitation["status"] != "pending":
        raise HTTPException(status_code=400, detail="Invitation has already been responded to")

    if request.action == "accept":
        # Check session is still voting
        session_result = (
            supabase.table("sessions")
            .select("status")
            .eq("id", invitation["session_id"])
            .maybe_single()
            .execute()
        )

        if not session_result.data or session_result.data["status"] != "voting":
            raise HTTPException(status_code=400, detail="Session is no longer accepting participants")

        # Add as participant
        supabase.table("session_participants").insert({
            "session_id": invitation["session_id"],
            "user_id": user_id,
            "role": "participant",
        }).execute()

        # Update invitation status
        supabase.table("session_invitations").update({
            "status": "accepted",
            "responded_at": datetime.now().isoformat(),
        }).eq("id", invitation_id).execute()

        # Return full session details
        return await get_session_details(invitation["session_id"], supabase)

    else:  # decline
        # Update invitation status
        supabase.table("session_invitations").update({
            "status": "declined",
            "responded_at": datetime.now().isoformat(),
        }).eq("id", invitation_id).execute()

        return InvitationActionResponse(success=True)


# --- Helper Functions ---


def _calculate_group_match(
    participant_ids: list[str],
    venue: dict,
    supabase: Client,
) -> int | None:
    """Calculate group match percentage for a venue.

    Aggregates fused taste profiles of all participants and scores venue against group taste.
    Returns None if no taste data available.
    """
    if not participant_ids:
        return None

    # Get fused taste for all participants
    fused_result = (
        supabase.table("fused_taste")
        .select("categories, vibes, exploration_ratio")
        .in_("user_id", participant_ids)
        .execute()
    )

    fused_data = fused_result.data or []
    if not fused_data:
        return None

    # Aggregate group taste profile
    # For categories: average the percentages
    # For vibes: union all vibes
    all_vibes: set[str] = set()
    category_totals: dict[str, float] = {}
    category_counts: dict[str, int] = {}

    for profile in fused_data:
        # Aggregate vibes
        vibes = profile.get("vibes") or []
        all_vibes.update(vibes)

        # Aggregate categories (stored as list of dicts with "name" and "percentage")
        categories = profile.get("categories") or []
        for cat_data in categories:
            if isinstance(cat_data, dict):
                cat_name = cat_data.get("name", "")
                pct = cat_data.get("percentage", 0)
                if cat_name:
                    category_totals[cat_name] = category_totals.get(cat_name, 0) + pct
                    category_counts[cat_name] = category_counts.get(cat_name, 0) + 1

    # Average the category percentages (format: {category: percentage})
    avg_categories: dict[str, float] = {}
    for cat, total in category_totals.items():
        avg_categories[cat] = total / category_counts[cat]

    # Build group taste profile
    group_taste = {
        "categories": avg_categories,
        "vibes": list(all_vibes),
    }

    # Build venue profile for matching
    venue_profile = {
        "taste_cluster": venue.get("taste_cluster"),
        "cuisine_type": venue.get("cuisine_type"),
        "price_tier": venue.get("price_tier"),
        "energy": venue.get("energy"),
        "best_for": venue.get("best_for") or [],
        "standout": venue.get("standout") or [],
    }

    # Calculate match score
    result = _matching_engine.score(group_taste, venue_profile)
    return result.match_score


async def get_session_details(session_id: str, supabase: Client) -> SessionResponse:
    """Get full session details with participants, venues, and votes."""
    # Get session
    session_result = (
        supabase.table("sessions")
        .select("*")
        .eq("id", session_id)
        .maybe_single()
        .execute()
    )

    if not session_result.data:
        raise HTTPException(status_code=404, detail="Session not found")

    session = session_result.data

    # Get participants with profile info
    participants_result = (
        supabase.table("session_participants")
        .select("*, profiles(id, display_name, avatar_url)")
        .eq("session_id", session_id)
        .execute()
    )

    participants_data = participants_result.data or []

    # Get votes for this session
    votes_result = (
        supabase.table("session_votes")
        .select("venue_id, user_id")
        .eq("session_id", session_id)
        .execute()
    )

    votes = votes_result.data or []
    user_votes = {v["user_id"] for v in votes}

    # Build participants list
    participants = []
    for p in participants_data:
        profile = p.get("profiles") or {}
        participants.append(ParticipantResponse(
            id=p["id"],
            user_id=p["user_id"],
            name=profile.get("display_name") or "Guest",
            avatar=profile.get("avatar_url"),
            is_host=p["role"] == "host",
            has_voted=p["user_id"] in user_votes,
        ))

    # Get participant IDs for group match calculation
    participant_ids = [p["user_id"] for p in participants_data]

    # Get session venues with full venue details for matching
    venues_result = (
        supabase.table("session_venues")
        .select("venue_id, venues(id, name, taste_cluster, cuisine_type, price_tier, energy, best_for, standout, photo_references)")
        .eq("session_id", session_id)
        .execute()
    )

    venues_data = venues_result.data or []

    # Count votes per venue
    vote_counts: dict[str, list[str]] = {}
    for vote in votes:
        venue_id = vote["venue_id"]
        if venue_id not in vote_counts:
            vote_counts[venue_id] = []
        vote_counts[venue_id].append(vote["user_id"])

    # Build venues list with match percentages
    venues = []
    for sv in venues_data:
        venue = sv.get("venues") or {}
        venue_id = sv["venue_id"]
        photo_url = None
        if venue.get("photo_references"):
            photo_url = venue["photo_references"][0]

        # Calculate group match percentage
        match_pct = _calculate_group_match(participant_ids, venue, supabase)

        venues.append(SessionVenueResponse(
            venue_id=venue_id,
            venue_name=venue.get("name", "Unknown"),
            venue_type=venue.get("taste_cluster"),
            photo_url=photo_url,
            votes=len(vote_counts.get(venue_id, [])),
            voted_by=vote_counts.get(venue_id, []),
            match_percentage=match_pct,
        ))

    # Sort venues by vote count (descending)
    venues.sort(key=lambda v: v.votes, reverse=True)

    return SessionResponse(
        id=session["id"],
        code=session["invite_code"],
        title=session["title"],
        planned_date=session.get("planned_date"),
        planned_time=session.get("planned_time"),
        status=session["status"],
        host_id=session["host_id"],
        participants=participants,
        venues=venues,
        winner_id=session.get("winning_venue_id"),
        created_at=session["created_at"],
    )
