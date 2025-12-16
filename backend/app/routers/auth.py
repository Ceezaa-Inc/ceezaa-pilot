"""Authentication API endpoints using Supabase Auth."""

from __future__ import annotations

import re
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel, field_validator

from app.dependencies import get_supabase_client
from supabase import Client

router = APIRouter(prefix="/api/auth", tags=["auth"])


def get_supabase() -> Client:
    """Dependency to get Supabase client instance."""
    return get_supabase_client()


# Request/Response models
class SendOtpRequest(BaseModel):
    """Request body for sending OTP."""

    phone: str

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        """Validate phone number format (E.164)."""
        # Remove any whitespace
        v = v.strip()
        # Must start with + and contain only digits after
        if not re.match(r"^\+[1-9]\d{1,14}$", v):
            raise ValueError("Phone must be in E.164 format (e.g., +14155551234)")
        return v


class SendOtpResponse(BaseModel):
    """Response body for OTP sent."""

    success: bool
    message: str


class VerifyOtpRequest(BaseModel):
    """Request body for verifying OTP."""

    phone: str
    token: str  # The 6-digit OTP code

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        """Validate phone number format."""
        v = v.strip()
        if not re.match(r"^\+[1-9]\d{1,14}$", v):
            raise ValueError("Phone must be in E.164 format")
        return v


class AuthSession(BaseModel):
    """User session data."""

    access_token: str
    refresh_token: str
    expires_in: int
    token_type: str


class UserProfile(BaseModel):
    """User profile data."""

    id: str
    phone: Optional[str] = None
    email: Optional[str] = None
    created_at: str
    user_metadata: dict[str, Any] = {}


class VerifyOtpResponse(BaseModel):
    """Response body for verified OTP."""

    user: UserProfile
    session: AuthSession


class SocialAuthRequest(BaseModel):
    """Request body for social auth (Apple/Google)."""

    id_token: str
    nonce: Optional[str] = None  # Required for Apple Sign-in


class RefreshTokenRequest(BaseModel):
    """Request body for refreshing token."""

    refresh_token: str


class LogoutResponse(BaseModel):
    """Response body for logout."""

    success: bool


@router.post("/send-otp", response_model=SendOtpResponse)
async def send_otp(
    request: SendOtpRequest,
    supabase: Client = Depends(get_supabase),
) -> SendOtpResponse:
    """Send OTP to phone number.

    Initiates phone verification by sending a 6-digit code via SMS.
    """
    try:
        # Use Supabase Auth to send OTP
        supabase.auth.sign_in_with_otp({"phone": request.phone})

        return SendOtpResponse(
            success=True,
            message="OTP sent successfully",
        )
    except Exception as e:
        error_msg = str(e)
        # Handle rate limiting
        if "rate" in error_msg.lower():
            raise HTTPException(
                status_code=429,
                detail="Too many requests. Please wait before trying again.",
            )
        raise HTTPException(status_code=400, detail=f"Failed to send OTP: {error_msg}")


@router.post("/verify-otp", response_model=VerifyOtpResponse)
async def verify_otp(
    request: VerifyOtpRequest,
    supabase: Client = Depends(get_supabase),
) -> VerifyOtpResponse:
    """Verify OTP and return session.

    Verifies the 6-digit code and creates a user session.
    """
    try:
        # Verify OTP with Supabase Auth
        response = supabase.auth.verify_otp(
            {"phone": request.phone, "token": request.token, "type": "sms"}
        )

        if not response.user or not response.session:
            raise HTTPException(status_code=401, detail="Invalid or expired OTP")

        return VerifyOtpResponse(
            user=UserProfile(
                id=response.user.id,
                phone=response.user.phone,
                email=response.user.email,
                created_at=response.user.created_at,
                user_metadata=response.user.user_metadata or {},
            ),
            session=AuthSession(
                access_token=response.session.access_token,
                refresh_token=response.session.refresh_token,
                expires_in=response.session.expires_in,
                token_type=response.session.token_type,
            ),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid OTP: {str(e)}")


@router.post("/apple", response_model=VerifyOtpResponse)
async def sign_in_with_apple(
    request: SocialAuthRequest,
    supabase: Client = Depends(get_supabase),
) -> VerifyOtpResponse:
    """Sign in with Apple.

    Exchanges Apple identity token for a Supabase session.
    """
    try:
        # Sign in with Apple ID token
        response = supabase.auth.sign_in_with_id_token(
            {
                "provider": "apple",
                "token": request.id_token,
                "nonce": request.nonce,
            }
        )

        if not response.user or not response.session:
            raise HTTPException(status_code=401, detail="Apple sign-in failed")

        return VerifyOtpResponse(
            user=UserProfile(
                id=response.user.id,
                phone=response.user.phone,
                email=response.user.email,
                created_at=response.user.created_at,
                user_metadata=response.user.user_metadata or {},
            ),
            session=AuthSession(
                access_token=response.session.access_token,
                refresh_token=response.session.refresh_token,
                expires_in=response.session.expires_in,
                token_type=response.session.token_type,
            ),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Apple sign-in failed: {str(e)}")


@router.post("/google", response_model=VerifyOtpResponse)
async def sign_in_with_google(
    request: SocialAuthRequest,
    supabase: Client = Depends(get_supabase),
) -> VerifyOtpResponse:
    """Sign in with Google.

    Exchanges Google ID token for a Supabase session.
    """
    try:
        # Sign in with Google ID token
        response = supabase.auth.sign_in_with_id_token(
            {
                "provider": "google",
                "token": request.id_token,
            }
        )

        if not response.user or not response.session:
            raise HTTPException(status_code=401, detail="Google sign-in failed")

        return VerifyOtpResponse(
            user=UserProfile(
                id=response.user.id,
                phone=response.user.phone,
                email=response.user.email,
                created_at=response.user.created_at,
                user_metadata=response.user.user_metadata or {},
            ),
            session=AuthSession(
                access_token=response.session.access_token,
                refresh_token=response.session.refresh_token,
                expires_in=response.session.expires_in,
                token_type=response.session.token_type,
            ),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Google sign-in failed: {str(e)}")


@router.post("/refresh", response_model=VerifyOtpResponse)
async def refresh_token(
    request: RefreshTokenRequest,
    supabase: Client = Depends(get_supabase),
) -> VerifyOtpResponse:
    """Refresh access token.

    Uses refresh token to get a new access token.
    """
    try:
        response = supabase.auth.refresh_session(request.refresh_token)

        if not response.user or not response.session:
            raise HTTPException(status_code=401, detail="Invalid refresh token")

        return VerifyOtpResponse(
            user=UserProfile(
                id=response.user.id,
                phone=response.user.phone,
                email=response.user.email,
                created_at=response.user.created_at,
                user_metadata=response.user.user_metadata or {},
            ),
            session=AuthSession(
                access_token=response.session.access_token,
                refresh_token=response.session.refresh_token,
                expires_in=response.session.expires_in,
                token_type=response.session.token_type,
            ),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Token refresh failed: {str(e)}")


@router.get("/me", response_model=UserProfile)
async def get_current_user(
    authorization: str = Header(..., description="Bearer token"),
    supabase: Client = Depends(get_supabase),
) -> UserProfile:
    """Get current authenticated user.

    Requires a valid access token in the Authorization header.
    """
    # Extract token from Bearer header
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")

    token = authorization[7:]  # Remove "Bearer " prefix

    try:
        # Get user from token
        response = supabase.auth.get_user(token)

        if not response.user:
            raise HTTPException(status_code=401, detail="Invalid or expired token")

        return UserProfile(
            id=response.user.id,
            phone=response.user.phone,
            email=response.user.email,
            created_at=response.user.created_at,
            user_metadata=response.user.user_metadata or {},
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")


@router.post("/logout", response_model=LogoutResponse)
async def logout(
    authorization: str = Header(..., description="Bearer token"),
    supabase: Client = Depends(get_supabase),
) -> LogoutResponse:
    """Sign out user.

    Invalidates the current session.
    """
    # Extract token from Bearer header
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")

    token = authorization[7:]

    try:
        # Sign out user (invalidate token)
        supabase.auth.admin.sign_out(token)
        return LogoutResponse(success=True)
    except Exception:
        # Even if sign out fails on server, return success
        # Client should clear tokens locally regardless
        return LogoutResponse(success=True)
