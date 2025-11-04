import json
import os
import random
import re
import string
from datetime import datetime, timedelta
from typing import Optional

import google.generativeai as genai
from database import Base
from database import MealPlan as DbMealPlan
from database import User as DbUser
from database import engine, get_db
from dotenv import load_dotenv
from email_service import (send_meal_plan_email, send_reset_email,
                           send_verification_email)
from fastapi import (Body, Depends, FastAPI, File, Form, HTTPException,
                     Request, UploadFile)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
from passlib.context import CryptContext
from pydantic import BaseModel
from sqlalchemy.orm import Session

load_dotenv()
api_key = os.getenv("MY_API_KEY")
genai.configure(api_key=api_key)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

Base.metadata.create_all(bind=engine)

def seed_admin():
    db = next(get_db())
    if not db.query(DbUser).filter(DbUser.username == "admin").first():
        db.add(DbUser(username="admin", password_hash=pwd_context.hash("admin123")))
        db.commit()
seed_admin()

class User(BaseModel):
    username: str
    password: str
    email: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str

class Profile(BaseModel):
    name: str
    age: int
    height: int
    weight: int
    goal: str
    restrictions: Optional[str] = None
    preferences: Optional[str] = None

def create_access_token(data: dict, expires_delta=None):
    to_encode = data.copy()
    to_encode["exp"] = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_password(plain, hashed):
    return pwd_context.verify(plain, hashed)

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    username = payload.get("sub")
    user = db.query(DbUser).filter(DbUser.username == username).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid authentication")
    return user

@app.post("/register", status_code=201)
def register(user: User, db: Session = Depends(get_db)):
    if db.query(DbUser).filter(DbUser.username == user.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")

    db_user = DbUser(
        username=user.username,
        password_hash=pwd_context.hash(user.password),
        email=user.email
    )

    if user.email:
        db_user.email_verification_code = "".join(random.choices(string.digits, k=6))

    db.add(db_user)
    db.commit()

    if user.email:
        send_verification_email(user.email, user.username, db_user.email_verification_code)

    return {"message": "User registered successfully"}

@app.post("/login", response_model=Token)
def login(user: User, db: Session = Depends(get_db)):
    db_user = db.query(DbUser).filter(DbUser.username == user.username).first()
    if not db_user or not verify_password(user.password, db_user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    token = create_access_token({"sub": user.username})
    return {"access_token": token, "token_type": "bearer"}

@app.get("/me")
def get_me(user: DbUser = Depends(get_current_user)):
    return {"username": user.username, "email": user.email}

def safe_parse_json(text: str):
    cleaned = text.strip()
    cleaned = re.sub(r"^```json|```$", "", cleaned)
    try:
        return json.loads(cleaned)
    except:
        return {"meal_plan": {}, "error": "bad JSON"}

@app.post("/meal-plan")
def meal_plan(payload: dict = Body(...), db: Session = Depends(get_db)):
    profile = Profile(**{
        "name": payload.get("name", "User"),
        "age": int(payload.get("age", 30)),
        "height": int(payload.get("height", 170)),
        "weight": int(payload.get("weight", 70)),
        "goal": payload.get("goal", "Maintain"),
        "restrictions": payload.get("restrictions"),
        "preferences": payload.get("preferences"),
    })

    prompt = f"""
Generate a structured 7-day meal plan that RESPECTS the user's dietary restrictions and preferences.
Return ONLY strict JSON in this exact schema (no extra fields, no prose):
{{
  "meal_plan": {{
    "monday": ["Breakfast: text", "Lunch: text", "Dinner: text"],
    "tuesday": ["Breakfast: text", "Lunch: text", "Dinner: text"],
    "wednesday": ["Breakfast: text", "Lunch: text", "Dinner: text"],
    "thursday": ["Breakfast: text", "Lunch: text", "Dinner: text"],
    "friday": ["Breakfast: text", "Lunch: text", "Dinner: text"],
    "saturday": ["Breakfast: text", "Lunch: text", "Dinner: text"],
    "sunday": ["Breakfast: text", "Lunch: text", "Dinner: text"]
  }},
  "nutrition_summary": {{
    "calories": 2000,
    "protein_g": 120,
    "carbs_g": 220,
    "fat_g": 60
  }}
}}

User Profile: {profile.dict()}
Dietary Restrictions to enforce: {profile.restrictions or "(none provided)"}
Preferences to prioritize (flavors, dislikes, cuisine): {profile.preferences or "(none provided)"}
"""

    try:
        model = genai.GenerativeModel(model_name="models/gemini-2.5-flash")
        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        data = safe_parse_json(response.text)

        meal_plan_data = data.get("meal_plan") or {}
        nutrition_summary = data.get("nutrition_summary") or {}
        nutrition_summary = {
            "calories": nutrition_summary.get("calories", 0),
            "protein_g": nutrition_summary.get("protein_g", 0),
            "carbs_g": nutrition_summary.get("carbs_g", 0),
            "fat_g": nutrition_summary.get("fat_g", 0),
        }

        db.add(DbMealPlan(
            user_id=None,
            title=f"Meal Plan - {profile.goal}",
            meal_plan_data=meal_plan_data,
            nutrition_summary=nutrition_summary,
            restrictions=profile.restrictions,
            preferences=profile.preferences,
        ))
        db.commit()

        return {"meal_plan": meal_plan_data, "nutrition_summary": nutrition_summary}

    except Exception as e:
        print("GEMINI ERROR:", e)
        raise HTTPException(status_code=500, detail="Gemini model failed")

@app.get("/models")
def list_models():
    return {"available_models": [m.name for m in genai.list_models()]}


# Analyze food (text and/or image)
@app.post("/analyze-food/")
async def analyze_food(
    food: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
    if not food and not file:
        raise HTTPException(status_code=400, detail="Provide text food description or an image file")

    prompt = (
        "Return ONLY JSON with a nutrition_summary object for the described food. "
        "Schema: {\n  \"nutrition_summary\": {\n    \"calories\": number, \n    \"protein_g\": number, \n    \"carbs_g\": number, \n    \"fat_g\": number\n  }\n}" 
        "No prose. Round values to integers."
    )

    try:
        model = genai.GenerativeModel(model_name="models/gemini-2.5-flash")
        parts = []
        if file is not None:
            b = await file.read()
            mime = file.content_type or "image/jpeg"
            parts.append({"mime_type": mime, "data": b})
        if food:
            parts.append(food)
        parts.append(prompt)

        response = model.generate_content(
            parts,
            generation_config={"response_mime_type": "application/json"},
        )
        data = safe_parse_json(response.text)
        nutrition = data.get("nutrition_summary") or data
        nutrition = {
            "calories": int(nutrition.get("calories", 0) or 0),
            "protein_g": int(nutrition.get("protein_g", 0) or 0),
            "carbs_g": int(nutrition.get("carbs_g", 0) or 0),
            "fat_g": int(nutrition.get("fat_g", 0) or 0),
        }

        # Save using FoodAnalysis model
        from database import FoodAnalysis as DbFoodAnalysis

        db.add(
            DbFoodAnalysis(
                user_id=None,
                food_name=(food or (file.filename if file else None)),
                image_filename=(file.filename if file else None),
                nutrition_data=nutrition,
            )
        )
        db.commit()

        return {"nutrition_summary": nutrition}

    except Exception as e:
        print("GEMINI ANALYZE ERROR:", e)
        raise HTTPException(status_code=500, detail="Analysis failed")


@app.get("/food-analyses")
def list_food_analyses(db: Session = Depends(get_db)):
    from database import FoodAnalysis as DbFoodAnalysis
    items = db.query(DbFoodAnalysis).order_by(DbFoodAnalysis.created_at.desc()).limit(50).all()
    def to_dict(x):
        return {
            "id": x.id,
            "food_name": x.food_name,
            "image_filename": x.image_filename,
            "nutrition_data": x.nutrition_data,
            "created_at": x.created_at.isoformat(),
        }
    return [to_dict(i) for i in items]


@app.get("/meal-plans")
def list_meal_plans(db: Session = Depends(get_db)):
    items = db.query(DbMealPlan).order_by(DbMealPlan.created_at.desc()).limit(50).all()
    def to_dict(x):
        return {
            "id": x.id,
            "title": x.title,
            "meal_plan": x.meal_plan_data,
            "nutrition_summary": x.nutrition_summary,
            "created_at": x.created_at.isoformat(),
        }
    return [to_dict(i) for i in items]


# --------- Email meal plan ---------
def _normalize_meal_plan(meal_plan: dict) -> dict:
    if not isinstance(meal_plan, dict):
        return {}
    order = ["breakfast", "lunch", "dinner", "snacks"]
    normalized = {}
    for day, meals in meal_plan.items():
        if isinstance(meals, dict):
            normalized[day] = meals
            continue
        mapping = {}
        if isinstance(meals, list):
            for i, item in enumerate(meals):
                text = str(item)
                if ":" in text:
                    lbl, rest = text.split(":", 1)
                    key = lbl.strip().lower()
                    if key not in order:
                        key = order[i] if i < len(order) else f"meal_{i+1}"
                    mapping[key] = (rest or "").strip()
                else:
                    key = order[i] if i < len(order) else f"meal_{i+1}"
                    mapping[key] = text
        normalized[day] = mapping
    return normalized


@app.post("/send-meal-plan-email")
def send_meal_plan_email_route(
    payload: dict = Body(...),
    user: DbUser = Depends(get_current_user),
):
    to_email = payload.get("to_email") or (user.email if user and getattr(user, "email", None) else None)
    if not to_email:
        raise HTTPException(status_code=400, detail="Destination email not provided and no email on file")

    meal_plan = payload.get("meal_plan") or {}
    nutrition_summary = payload.get("nutrition_summary") or {}
    data = {
        "meal_plan": _normalize_meal_plan(meal_plan),
        "nutrition_summary": nutrition_summary,
    }

    ok = send_meal_plan_email(to_email, getattr(user, "username", "User"), data)
    return {"sent": bool(ok)}
