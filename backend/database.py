from sqlalchemy import create_engine, Column, Integer, String, ForeignKey, DateTime, Text, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime

SQLALCHEMY_DATABASE_URL = "sqlite:///./nutri_champ.db"

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password_hash = Column(String)
    email = Column(String, nullable=True)
    email_verified = Column(Integer, default=0)  # 0/1 flag
    email_verification_code = Column(String, nullable=True)
    reset_token = Column(String, nullable=True)
    reset_token_expiry = Column(DateTime, nullable=True)
    name = Column(String, nullable=True)
    age = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    weight = Column(Integer, nullable=True)
    goal = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    meal_plans = relationship("MealPlan", back_populates="user")
    food_analyses = relationship("FoodAnalysis", back_populates="user")

class MealPlan(Base):
    __tablename__ = "meal_plans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String, nullable=True)
    meal_plan_data = Column(JSON)  # Store the full meal plan JSON
    nutrition_summary = Column(JSON)  # Store nutrition summary
    restrictions = Column(Text, nullable=True)
    preferences = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="meal_plans")

class FoodAnalysis(Base):
    __tablename__ = "food_analyses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    food_name = Column(String, nullable=True)
    image_filename = Column(String, nullable=True)
    nutrition_data = Column(JSON)  # Store nutrition summary
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="food_analyses")
