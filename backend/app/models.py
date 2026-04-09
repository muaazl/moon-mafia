# ASSESSMENT: Software Design (High Cohesion) — All persistence models in one module.
from sqlalchemy import Column, Integer, String, Float, DateTime
from app.database import Base
import datetime


class User(Base):  # ASSESSMENT: Virtual Identity — User entity for auth & game state.
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, unique=True, nullable=False, index=True)  # codename / login username
    age = Column(Integer, nullable=False)
    gender = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    capital = Column(Float, default=1000.0)
    avatar_url = Column(String, nullable=True)
    games_played = Column(Integer, default=0)
    total_wins = Column(Integer, default=0)
    total_losses = Column(Integer, default=0)
    total_rounds = Column(Integer, default=0)
    current_streak = Column(Integer, default=0)
    heart_mode_wins = Column(Integer, default=0)
    carrot_mode_wins = Column(Integer, default=0)
    security_question = Column(String, nullable=True)
    security_answer = Column(String, nullable=True)
    has_seen_tutorial = Column(Integer, default=0)  # 0 for False, 1 for True
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
