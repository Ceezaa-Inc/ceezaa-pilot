"""Sessions API endpoints.

Manages group planning sessions with real-time voting.
"""

from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from supabase import Client

from app.dependencies import get_supabase_client

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


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
    """Request to add a venue to a session."""

    venue_id: str


class VoteRequest(BaseModel):
    """Request to vote for a venue."""

    venue_id: str


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

        item = SessionListItem(
            id=session["id"],
            code=session["invite_code"],
            title=session["title"],
            planned_date=session.get("planned_date"),
            status=session["status"],
            participant_count=participants_result.count or 0,
            venue_count=venues_result.count or 0,
            created_at=session["created_at"],
        )

        if session["status"] in ["voting", "pending"]:
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
    existing = (
        supabase.table("session_participants")
        .select("id")
        .eq("session_id", session["id"])
        .eq("user_id", user_id)
        .maybe_single()
        .execute()
    )

    if not existing.data:
        # Add as participant
        supabase.table("session_participants").insert({
            "session_id": session["id"],
            "user_id": user_id,
            "role": "participant",
        }).execute()

    return await get_session_details(session["id"], supabase)


@router.post("/{session_id}/venues", response_model=SessionResponse)
async def add_venue_to_session(
    session_id: str,
    request: AddVenueRequest,
    user_id: str,
    supabase: Client = Depends(get_supabase_client),
) -> SessionResponse:
    """Add a venue to a session."""
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

    # Check if venue exists in venues table
    venue_check = (
        supabase.table("venues")
        .select("id")
        .eq("id", request.venue_id)
        .maybe_single()
        .execute()
    )

    if not venue_check.data:
        # Venue doesn't exist - skip adding it
        # In a full implementation, we'd either create the venue or use a different approach
        print(f"[Sessions] Venue {request.venue_id} not found in database, skipping")
        return await get_session_details(session_id, supabase)

    # Check if venue already added to session
    try:
        existing = (
            supabase.table("session_venues")
            .select("id")
            .eq("session_id", session_id)
            .eq("venue_id", request.venue_id)
            .maybe_single()
            .execute()
        )
        venue_already_added = existing.data is not None
    except Exception:
        venue_already_added = False

    if not venue_already_added:
        supabase.table("session_venues").insert({
            "session_id": session_id,
            "venue_id": request.venue_id,
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

    # Add or update vote (upsert)
    # First remove any existing vote by this user
    supabase.table("session_votes").delete().eq("session_id", session_id).eq("user_id", user_id).execute()

    # Add new vote
    supabase.table("session_votes").insert({
        "session_id": session_id,
        "venue_id": request.venue_id,
        "user_id": user_id,
    }).execute()

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


# --- Helper Functions ---


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

    # Get session venues with vote counts
    venues_result = (
        supabase.table("session_venues")
        .select("venue_id, venues(id, name, taste_cluster, photo_references)")
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

    # Build venues list
    venues = []
    for sv in venues_data:
        venue = sv.get("venues") or {}
        venue_id = sv["venue_id"]
        photo_url = None
        if venue.get("photo_references"):
            photo_url = venue["photo_references"][0]

        venues.append(SessionVenueResponse(
            venue_id=venue_id,
            venue_name=venue.get("name", "Unknown"),
            venue_type=venue.get("taste_cluster"),
            photo_url=photo_url,
            votes=len(vote_counts.get(venue_id, [])),
            voted_by=vote_counts.get(venue_id, []),
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
