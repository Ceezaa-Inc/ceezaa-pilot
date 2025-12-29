"""Application configuration using pydantic-settings."""

from functools import lru_cache
from typing import Literal

from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",  # Ignore extra env vars not defined in Settings
    )

    # App
    app_name: str = "Ceezaa Backend"
    app_env: Literal["development", "staging", "production"] = "development"
    debug: bool = True

    # Supabase
    supabase_url: str = ""
    supabase_service_role_key: str = ""

    # Plaid
    plaid_client_id: str = ""
    plaid_secret: str = ""
    plaid_env: Literal["sandbox", "development", "production"] = "sandbox"

    # Google Places
    google_places_api_key: str = Field(
        default="",
        validation_alias=AliasChoices("GOOGLE_PLACES_API_KEY", "PLACES_API_KEY"),
    )

    # OpenAI
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"

    # Expo Push
    expo_access_token: str = ""

    @property
    def is_production(self) -> bool:
        """Check if running in production."""
        return self.app_env == "production"


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
