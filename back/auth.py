from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import Optional

from db import (
    get_db,
    create_user,
    authenticate_user,
    create_access_token,
    create_refresh_token,
    get_user_by_username,
    get_user_by_email,
    User,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    JWTError,
    jwt,
    SECRET_KEY,
    ALGORITHM,
)

# Define o esquema do corpo da requisição para criação de usuário usando Pydantic
class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str

class RefreshToken(BaseModel):
    refresh_token: str

class TokenData(BaseModel):
    username: Optional[str] = None

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
router = APIRouter()

# Função de dependência para obter o usuário atual a partir do token JWT
async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    user = get_user_by_username(db, username=token_data.username)
    if user is None:
        raise credentials_exception
    return user

# Endpoint para registrar um novo usuário
@router.post("/register", response_model=Token)
async def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    # Verificar se usuário já existe pelo nome de usuário
    db_user_by_username = get_user_by_username(db, username=user_data.username)
    if db_user_by_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # Verificar se usuário já existe pelo email
    db_user_by_email = get_user_by_email(db, email=user_data.email)
    if db_user_by_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Criar novo usuário no banco de dados
    user = create_user(
        db=db, 
        username=user_data.username, 
        email=user_data.email, 
        password=user_data.password
    )
    
    # Gerar tokens de acesso e atualização
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    refresh_token = create_refresh_token(data={"sub": user.username})
    
    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}

# Endpoint para login e obtenção de tokens
@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # Autenticar usuário
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    # Gerar tokens de acesso e atualização
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    refresh_token = create_refresh_token(data={"sub": user.username})
    
    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}

# Endpoint para atualizar o token de acesso usando o token de atualização
@router.post("/refresh-token", response_model=Token)
async def refresh_access_token(token_data: RefreshToken, db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Decodificar o refresh token para obter o username
        payload = jwt.decode(token_data.refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    # Verificar se o usuário existe
    user = get_user_by_username(db, username=username)
    if user is None:
        raise credentials_exception
        
    # Gerar novos tokens de acesso e atualização
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": username}, expires_delta=access_token_expires
    )
    refresh_token = create_refresh_token(data={"sub": username})
    
    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}