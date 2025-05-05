# Furia Project

Este projeto consiste em um backend Python (FastAPI) e um frontend Next.js.

## Configuração e Execução

### Pré-requisitos

*   Python 3.9+ e pip
*   Node.js e pnpm

### Backend (Python/FastAPI)

1.  **Navegue até o diretório do backend:**
    ```bash
    cd back
    ```

2.  **Crie um ambiente virtual (recomendado):**
    ```bash
    python -m venv venv
    source venv/bin/activate  # No Windows use `venv\Scripts\activate`
    ```

3.  **Instale as dependências:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Configure as variáveis de ambiente:**
    Crie um arquivo `.env` na pasta `back` com o seguinte conteúdo (substitua os valores pelos seus):
    ```properties
    # Exemplo de back/.env
    TAVILY_API_KEY=sua_tavily_api_key
    OPENAI_API_KEY=sua_openai_api_key
    DB_URL=postgresql://usuario:senha@host:porta/database?sslmode=require
    SECRET_KEY=sua_chave_secreta_para_jwt # Ex: execute `openssl rand -hex 32` no terminal
    ALGORITHM=HS256 # Algoritmo JWT
    ACCESS_TOKEN_EXPIRE_MINUTES=30 # Tempo de expiração do token de acesso
    REFRESH_TOKEN_EXPIRE_DAYS=7 # Tempo de expiração do token de refresh
    ```
    *Nota: A `DB_URL` no exemplo é para Neon.tech, ajuste conforme seu provedor de banco de dados.*

5.  **Execute o servidor backend:**
    ```bash
    uvicorn main:app --reload --host 0.0.0.0 --port 8000
    ```
    O backend estará rodando em `http://localhost:8000`.

### Frontend (Next.js/pnpm)

1.  **Navegue até o diretório do frontend:**
    ```bash
    cd ../front/furiabot
    ```

2.  **Instale as dependências:**
    ```bash
    pnpm install
    ```

3.  **Configure as variáveis de ambiente:**
    Crie um arquivo `.env.local` na pasta `front/furiabot` com o seguinte conteúdo:
    ```properties
    # Exemplo de front/furiabot/.env.local
    NEXT_PUBLIC_API_URL=http://localhost:8000
    ```
    *Certifique-se de que `NEXT_PUBLIC_API_URL` aponta para o endereço onde o backend está rodando.*

4.  **Execute o servidor de desenvolvimento frontend:**
    ```bash
    pnpm dev
    ```
    O frontend estará acessível em `http://localhost:3000`.
