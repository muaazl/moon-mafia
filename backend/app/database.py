
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv
from sqlalchemy import text

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL environment variable is not set. Please check your .env file.")

engine = create_engine(DATABASE_URL)


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """Dependency-injected DB session for FastAPI routes."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def fix_postgres_sequences():
    """
    Utility to synchronize PostgreSQL ID sequences with existing data.
    Prevents 'UniqueViolation' errors if IDs were manually inserted or migrated.
    """
    if DATABASE_URL and ("postgresql" in DATABASE_URL or "postgres" in DATABASE_URL):

        try:
            with engine.connect() as connection:
                connection.execute(text(
                    "SELECT setval(pg_get_serial_sequence('users', 'id'), coalesce(max(id), 0) + 1, false) FROM users;"
                ))
                connection.commit()
                print("Database sequences synchronized successfully.")
        except Exception as e:
            print(f"Warning: Failed to sync database sequences: {e}")
