from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware # Importa o middleware CORS

from db import (
    get_db,
    User,
)
from sqlalchemy.orm import Session
from auth import router as auth_router
from core import router as core_router 


app = FastAPI()


origins = ["*"]  # Allow all origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, 
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"], 
)

app.include_router(auth_router)
app.include_router(core_router)
