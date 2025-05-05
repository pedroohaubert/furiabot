from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import asyncio
from typing import Optional
from agent import FuriaAgent
from db import User
from auth import get_current_user

# Define o esquema do corpo da requisição para o stream
class StreamRequest(BaseModel):
    message: str
    session_id: Optional[str] = None

router = APIRouter()

# Endpoint para receber mensagens e retornar a resposta do agente em stream
@router.post("/stream_response")
async def stream_response(stream_request: StreamRequest, current_user: User = Depends(get_current_user)):
    agent = FuriaAgent()
    
    user_id = str(current_user.id)
    print(f"Streaming response for user: {user_id}, session: {stream_request.session_id or 'new session'}")

    # Função geradora assíncrona para o stream da resposta
    async def generate():
        response = agent.run(stream_request.message, user_id, stream_request.session_id)
        for chunk in response:
            await asyncio.sleep(0) # Permite que outras tarefas rodem
            yield chunk.to_json() + "\n" # Envia cada pedaço como JSON delimitado por nova linha

    return StreamingResponse(generate(), media_type="application/x-ndjson") # Retorna a resposta como stream

# Endpoint para obter o histórico de sessões do usuário
@router.get("/sessions")
async def get_user_sessions(current_user: User = Depends(get_current_user)):
    agent = FuriaAgent()
    user_id = str(current_user.id)
    print(f"Fetching sessions for user: {user_id}")
    sessions = agent.get_history(user_id) # Busca o histórico de sessões
    return {"sessions": sessions}
