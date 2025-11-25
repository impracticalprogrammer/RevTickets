from passlib.context import CryptContext
from datetime import datetime, timedelta
from fastapi.security import OAuth2PasswordBearer
from fastapi import Depends, HTTPException, status
from jose import JWTError
from src.models.user import User
from src.models.enums import UserRole

import jwt
from src.models.user import User
import bcrypt
import warnings

SECRET_KEY = "rev-ticketing-system-secret-key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Suppress passlib warnings
warnings.filterwarnings("ignore", category=UserWarning, module="passlib")

# Use bcrypt directly to avoid passlib initialization issues
def hash_password(password: str) -> str:
    # Bcrypt has a 72-byte limit, so truncate if necessary
    password_bytes = password.encode('utf-8')
    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]
    
    # Hash using bcrypt directly
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    # Return as string with bcrypt identifier prefix for compatibility
    return hashed.decode('utf-8')

def verify_password(plain: str, hashed: str) -> bool:
    # Bcrypt has a 72-byte limit, so truncate if necessary
    password_bytes = plain.encode('utf-8')
    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]
    
    # Verify using bcrypt directly
    try:
        hashed_bytes = hashed.encode('utf-8')
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception:
        return False

# Create passlib context for backward compatibility (but we use bcrypt directly)
try:
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
except Exception:
    pwd_context = None

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/users/login")

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str):
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

async def authenticate_user(email: str, password: str):
    user = await User.find_one(User.email == email)
    if not user or not verify_password(password, user.hashed_password):
        return False
    return user
async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid token or authentication credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        user = await User.find_one(User.email == email)
        if user is None:
            raise credentials_exception
        return user
    except JWTError:
        raise credentials_exception
async def get_current_agent_user(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.agent:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted to agents only"
        )
    return current_user