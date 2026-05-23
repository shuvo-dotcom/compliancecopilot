from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    REDIS_URL: str
    MINIO_ENDPOINT: str
    MINIO_ACCESS_KEY: str
    MINIO_SECRET_KEY: str
    WEBAUTHN_RP_ID: str = "localhost"
    WEBAUTHN_RP_NAME: str = "ComplianceCopilot"
    WEBAUTHN_ORIGIN: str = "http://localhost:3000"
    SECRET_KEY: str = "change-this-to-a-random-secret"

    class Config:
        env_file = ".env"


settings = Settings()
