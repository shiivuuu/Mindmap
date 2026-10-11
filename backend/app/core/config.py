import os
from pydantic import BaseModel
from dotenv import load_dotenv

# Load .env if present
load_dotenv()

class Settings(BaseModel):
    APP_NAME: str = os.getenv("APP_NAME", "MindMesh AI")
    APP_ENV: str = os.getenv("APP_ENV", "development")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "mindmesh_dev_jwt_secret_key_change_in_production_2026")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./mindmesh.db")
    
    # File Storage
    FILE_STORAGE_PATH: str = os.getenv("FILE_STORAGE_PATH", os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "uploads"))
    UPLOAD_MAX_MB: int = int(os.getenv("UPLOAD_MAX_MB", "25"))
    
    # CORS
    FRONTEND_ORIGIN: str = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
    
    # AI Engine
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "builtin") # builtin, openai, groq, ollama
    LLM_API_KEY: str = os.getenv("LLM_API_KEY", "")
    LLM_BASE_URL: str = os.getenv("LLM_BASE_URL", "")
    LLM_MODEL: str = os.getenv("LLM_MODEL", "gpt-4o-mini")
    EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "builtin-tfidf")

settings = Settings()

# Ensure uploads directory exists
os.makedirs(settings.FILE_STORAGE_PATH, exist_ok=True)
