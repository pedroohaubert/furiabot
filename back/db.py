from sqlalchemy import create_engine, Column, Integer, String, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from dotenv import load_dotenv, dotenv_values

# Carrega as variáveis do .env explicitamente
config = dotenv_values()

# Configuração JWT
SECRET_KEY = config.get("SECRET_KEY", "insecure_dev_key_change_in_production") # Chave secreta para JWT (idealmente de variável de ambiente)
ALGORITHM = "HS256" # Algoritmo de assinatura JWT
ACCESS_TOKEN_EXPIRE_MINUTES = 30 # Tempo de expiração do token de acesso em minutos
REFRESH_TOKEN_EXPIRE_DAYS = 7 # Tempo de expiração do token de atualização em dias

# Configuração do banco de dados PostgreSQL
SQLALCHEMY_DATABASE_URL = config["DB_URL"] # Usa a URL do banco de dados do .env
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=3600
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine) # Fábrica de sessões do SQLAlchemy
Base = declarative_base() # Classe base para modelos declarativos

# Contexto de criptografia para senhas usando bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# Modelo SQLAlchemy para a tabela de usuários
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)


# Cria as tabelas no banco de dados se elas ainda não existirem
Base.metadata.create_all(bind=engine)


# Função de dependência para obter uma sessão do banco de dados
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Funções de utilidade para autenticação e senha
def verify_password(plain_password, hashed_password):
    """Verifica se a senha fornecida corresponde ao hash armazenado."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    """Gera o hash de uma senha."""
    return pwd_context.hash(password)


# Funções CRUD para usuários
def create_user(db: Session, username: str, email: str, password: str):
    """Cria um novo usuário no banco de dados."""
    hashed_password = get_password_hash(password)
    db_user = User(username=username, email=email, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def get_user_by_username(db: Session, username: str):
    """Busca um usuário pelo nome de usuário."""
    return db.query(User).filter(User.username == username).first()


def get_user_by_email(db: Session, email: str):
    """Busca um usuário pelo email."""
    return db.query(User).filter(User.email == email).first()


def authenticate_user(db: Session, username: str, password: str):
    """Autentica um usuário verificando username e senha."""
    user = get_user_by_username(db, username)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user


# Funções para geração de tokens JWT
def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None):
    """Cria um token de acesso JWT."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: Dict[str, Any]):
    """Cria um token de atualização JWT."""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
