import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Load .env if present
try:
    from dotenv import load_dotenv
    load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))
except ImportError:
    pass  # dotenv not installed, skip

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL environment variable is not set. Please check your .env file in backend directory.")


# Add pool_pre_ping and pool_recycle for reliability
# Optionally disable SSL if not needed (add ?sslmode=disable to DATABASE_URL)
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,         # Checks connection before using
    pool_recycle=1800           # Recycle connections every 30 minutes
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
