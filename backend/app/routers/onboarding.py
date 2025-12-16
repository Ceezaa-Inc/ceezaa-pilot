"""Onboarding API endpoints for quiz submission and profile creation."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from supabase import Client

from app.dependencies import get_supabase_client
from app.intelligence import ProfileTitleMapper, QuizAnswer, QuizProcessor
from app.mappings.quiz_mappings import get_question_key

router = APIRouter(prefix="/api/onboarding", tags=["onboarding"])


class QuizAnswerRequest(BaseModel):
    """Single quiz answer from frontend."""

    question_id: int
    answer_id: str


class SubmitQuizRequest(BaseModel):
    """Request body for submitting quiz answers."""

    user_id: str
    answers: list[QuizAnswerRequest]


class SubmitQuizResponse(BaseModel):
    """Response body for quiz submission."""

    success: bool
    profile_title: str
    profile_tagline: str


def get_quiz_processor() -> QuizProcessor:
    """Dependency for QuizProcessor."""
    return QuizProcessor()


def get_profile_mapper() -> ProfileTitleMapper:
    """Dependency for ProfileTitleMapper."""
    return ProfileTitleMapper()


@router.post("/quiz", response_model=SubmitQuizResponse)
async def submit_quiz(
    request: SubmitQuizRequest,
    supabase: Client = Depends(get_supabase_client),
    quiz_processor: QuizProcessor = Depends(get_quiz_processor),
    profile_mapper: ProfileTitleMapper = Depends(get_profile_mapper),
) -> SubmitQuizResponse:
    """Submit quiz answers and create taste profile.

    1. Saves raw answers to quiz_responses table
    2. Processes answers through QuizProcessor to get declared taste
    3. Saves declared taste to declared_taste table
    4. Returns profile title and tagline from ProfileTitleMapper
    """
    print(f"[Onboarding] Quiz submission for user: {request.user_id}")
    print(f"[Onboarding] Answers count: {len(request.answers)}")

    # Convert request answers to QuizAnswer objects
    quiz_answers = [
        QuizAnswer(question_id=a.question_id, answer_id=a.answer_id)
        for a in request.answers
    ]

    # Process quiz to get declared taste
    declared_taste = quiz_processor.process(quiz_answers)
    print(f"[Onboarding] Processed taste: {declared_taste}")

    # Get profile title
    title, tagline = profile_mapper.get_title(declared_taste)
    print(f"[Onboarding] Title: {title}")

    try:
        # Save quiz responses to database
        for answer in request.answers:
            question_key = get_question_key(answer.question_id)
            if question_key:
                supabase.table("quiz_responses").upsert(
                    {
                        "user_id": request.user_id,
                        "question_key": question_key,
                        "answer_key": answer.answer_id,
                    },
                    on_conflict="user_id,question_key",
                ).execute()
        print("[Onboarding] Quiz responses saved")

        # Save declared taste to database
        taste_data = {
            "user_id": request.user_id,
            "vibe_preferences": declared_taste.vibe_preferences,
            "cuisine_preferences": declared_taste.cuisine_preferences,
            "dietary_restrictions": declared_taste.dietary_restrictions,
            "exploration_style": declared_taste.exploration_style,
            "social_preference": declared_taste.social_preference,
            "coffee_preference": declared_taste.coffee_preference,
            "price_tier": declared_taste.price_tier,
        }
        supabase.table("declared_taste").upsert(
            taste_data,
            on_conflict="user_id",
        ).execute()
        print("[Onboarding] Declared taste saved")

    except Exception as e:
        print(f"[Onboarding] DB error: {e}")
        import traceback
        traceback.print_exc()
        raise

    return SubmitQuizResponse(
        success=True,
        profile_title=title,
        profile_tagline=tagline,
    )
