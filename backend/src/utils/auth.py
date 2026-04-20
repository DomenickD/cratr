import os
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from src.db.database import get_db
from src.models.user import User

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "cratr-enterprise-secret-key-2026")
ALGORITHM = "HS256"

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
security = HTTPBearer()


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    return pwd_context.hash(password)


def get_token(user_id: int, expire_minutes: int = 120) -> str:
    expire_time = datetime.now(timezone.utc) + timedelta(minutes=expire_minutes)
    return jwt.encode(
        {"sub": f"user:{user_id}", "exp": expire_time},
        SECRET_KEY,
        algorithm=ALGORITHM,
    )


def _resolve_user(credentials: HTTPAuthorizationCredentials, db: Session) -> User:
    """Decode bearer token and return the User. Raises 401 on any failure."""
    exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        sub: str = payload.get("sub", "")
        kind, user_id = sub.split(":")
        assert kind == "user"
    except Exception:
        raise exc

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise exc
    return user


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    return _resolve_user(credentials, db)


def require_enterprise_admin(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    user = _resolve_user(credentials, db)
    if user.role != "enterprise_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Enterprise admin access required",
        )
    return user
