import os
import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Optional
import jwt
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import User
from app.schemas.schemas import UserLogin, UserRegister, UserResponse, TokenResponse, OnboardingUpdate

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

SECRET_KEY = os.getenv("JWT_SECRET", "freshroute_super_secure_enterprise_key_2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

def hash_password(password: str, salt: Optional[str] = None) -> str:
    if not salt:
        salt = secrets.token_hex(16)
    hashed = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100000).hex()
    return f"{salt}${hashed}"

def verify_password(plain_password: str, stored_hash: str) -> bool:
    try:
        salt, hashed = stored_hash.split("$", 1)
        check_hashed = hashlib.pbkdf2_hmac("sha256", plain_password.encode("utf-8"), salt.encode("utf-8"), 100000).hex()
        return secrets.compare_digest(hashed, check_hashed)
    except Exception:
        return False

def create_access_token(user_id: int, email: str) -> str:
    expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    payload = {"sub": str(user_id), "email": email, "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)) -> User:
    if not authorization:
        # Fallback to demo user if unauthenticated for easy demonstration
        demo_user = db.query(User).filter(User.email == "demo@freshroute.io").first()
        if not demo_user:
            demo_user = User(
                email="demo@freshroute.io",
                hashed_password=hash_password("DemoPassword123!"),
                full_name="Alex Rivera",
                organization="Pacific Fresh Logistics Hub",
                role="Director of Logistics & Dispatch",
                has_completed_onboarding=False
            )
            db.add(demo_user)
            db.commit()
            db.refresh(demo_user)
        return demo_user

    try:
        token = authorization.replace("Bearer ", "").strip()
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("sub"))
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

@router.post("/register", response_model=TokenResponse)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

    new_user = User(
        email=user_in.email.lower(),
        hashed_password=hash_password(user_in.password),
        full_name=user_in.full_name,
        organization=user_in.organization,
        role=user_in.role,
        has_completed_onboarding=False
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token(new_user.id, new_user.email)
    return TokenResponse(access_token=token, user=UserResponse.from_orm(new_user))

@router.post("/login", response_model=TokenResponse)
def login(login_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_in.email.lower()).first()
    if not user or not verify_password(login_in.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password.")

    token = create_access_token(user.id, user.email)
    return TokenResponse(access_token=token, user=UserResponse.from_orm(user))

@router.post("/demo-login", response_model=TokenResponse)
def demo_login(db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == "demo@freshroute.io").first()
    if not user:
        user = User(
            email="demo@freshroute.io",
            hashed_password=hash_password("DemoFreshRoute2026!"),
            full_name="Alex Rivera",
            organization="Pacific Fresh Logistics Hub",
            role="Director of Logistics & Dispatch",
            has_completed_onboarding=False
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token(user.id, user.email)
    return TokenResponse(access_token=token, user=UserResponse.from_orm(user))

@router.get("/me", response_model=UserResponse)
def get_me(user: User = Depends(get_current_user)):
    return UserResponse.from_orm(user)

@router.put("/onboarding", response_model=UserResponse)
def update_onboarding(data: OnboardingUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user.has_completed_onboarding = data.has_completed_onboarding
    db.commit()
    db.refresh(user)
    return UserResponse.from_orm(user)

@router.post("/reset-password")
def reset_password(payload: dict):
    email = payload.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email is required.")
    # In development mode, explain limitation honestly per requirement 10
    return {
        "status": "success",
        "message": f"Password reset instructions have been simulated for {email}. (Note: SMTP email delivery is disabled in the hackathon development environment)."
    }
