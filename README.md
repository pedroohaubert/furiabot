# Furia Project

Este projeto consiste em um backend Python (FastAPI) e um frontend Next.js, criando um chatbot interativo sobre a equipe FURIA.

## Arquitetura

*   **Backend (Python/FastAPI):** Responsável pela lógica principal do agente de IA, gerenciamento de conversas e autenticação. Utiliza a biblioteca `agno` para orquestrar a comunicação com modelos de linguagem (LLMs), gerenciar o histórico da conversa, utilizar ferramentas (como busca na web) e persistir os dados da sessão.
*   **Frontend (Next.js/pnpm):** Interface de usuário web para interação com o chatbot. Lida com o registro e login de usuários, exibe a conversa e processa o streaming de mensagens recebidas do backend.

## Configuração e Execução

### Pré-requisitos

*   Python 3.9+ e pip
*   Node.js e pnpm

### Backend (Python/FastAPI)

O backend utiliza FastAPI e a biblioteca `agno` para criar um agente conversacional.

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
    TAVILY_API_KEY=sua_tavily_api_key # Chave para a ferramenta de busca Tavily
    OPENAI_API_KEY=sua_openai_api_key # Chave para o modelo OpenAI (ou outro LLM via agno)
    DB_URL=postgresql://usuario:senha@host:porta/database?sslmode=require # URL do banco de dados (PostgreSQL para agno.storage e usuários)
    SECRET_KEY=sua_chave_secreta_para_jwt # Ex: execute `openssl rand -hex 32` no terminal
    ALGORITHM=HS256 # Algoritmo JWT
    ACCESS_TOKEN_EXPIRE_MINUTES=30 # Tempo de expiração do token de acesso
    REFRESH_TOKEN_EXPIRE_DAYS=7 # Tempo de expiração do token de refresh
    ```
    *Nota: A `DB_URL` no exemplo é para Neon.tech, ajuste conforme seu provedor de banco de dados. O backend usa esta URL tanto para armazenar dados de sessão do `agno` quanto para a tabela de usuários.*

5.  **Execute o servidor backend:**
    ```bash
    uvicorn main:app --reload --host 0.0.0.0 --port 8000
    ```
    O backend estará rodando em `http://localhost:8000`. A API inclui endpoints para autenticação (`/register`, `/token`, `/refresh-token`), obtenção de sessões (`/sessions`) e o principal endpoint de streaming (`/stream_response`).

#### Detalhes do Backend (`agno`)

*   **Agente (`agno.agent.Agent`):** Orquestra o fluxo da conversa. Recebe a mensagem do usuário, interage com o LLM configurado (ex: `agno.models.openai.OpenAIChat`), decide se usa ferramentas, gerencia o estado e a memória da conversa.
*   **Modelos (`agno.models`):** Abstrações para interagir com diferentes LLMs (OpenAI, Anthropic, OpenRouter, etc.).
*   **Ferramentas (`agno.tools`):** Permite ao agente executar ações, como buscar informações na web (`TavilyTools`) ou realizar raciocínio interno (`ReasoningTools`).
*   **Armazenamento (`agno.storage`):** Persiste o estado e o histórico das sessões de conversa. Este projeto usa `PostgresStorage` para salvar os dados no banco de dados definido em `DB_URL`.
*   **Memória (`agno.memory`):** Gerencia o histórico de mensagens e as informações aprendidas durante a conversa para manter o contexto.
*   **Streaming:** O endpoint `/stream_response` utiliza `StreamingResponse` do FastAPI para enviar a resposta do agente em pedaços (chunks) no formato `application/x-ndjson`, permitindo que o frontend exiba a resposta progressivamente.

### Frontend (Next.js/pnpm)

O frontend é construído com Next.js e utiliza `pnpm` como gerenciador de pacotes.

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

#### Detalhes do Frontend

*   **Autenticação:**
    *   Utiliza um `AuthContext` (`lib/auth-context.tsx`) para gerenciar o estado de autenticação do usuário (login, registro, logout).
    *   A autenticação é baseada em tokens JWT (Access Token e Refresh Token) obtidos do backend (`/token`, `/register`).
    *   Os tokens são armazenados no `localStorage` do navegador.
    *   A função `fetchWithAuth` intercepta as chamadas à API, adiciona o Access Token ao cabeçalho `Authorization`. Em caso de erro 401 (Unauthorized), tenta automaticamente renovar o Access Token usando o Refresh Token (`/refresh-token`) antes de tentar a chamada original novamente.
*   **Interface de Chat (`app/chat/page.tsx`, `components/ChatInterface.tsx`):**
    *   Exibe as mensagens da conversa atual e as ferramentas sendo utilizadas pelo agente.
    *   Permite ao usuário enviar novas mensagens.
    *   Gerencia a lista de conversas anteriores (`components/ConversationSidebar.tsx`).
*   **Streaming de Mensagens:**
    *   Ao enviar uma mensagem, o frontend faz uma requisição POST para o endpoint `/stream_response` do backend.
    *   Utiliza a API `fetch` e `ReadableStream` para processar a resposta `application/x-ndjson`.
    *   Lê a resposta em chunks, decodifica, parseia os objetos JSON recebidos (que representam eventos do `agno`, como `RunStarted`, `ToolCallStarted`, `RunResponse`, `RunCompleted`).
    *   Atualiza a interface do usuário dinamicamente à medida que os chunks chegam, exibindo a resposta do assistente e o status das ferramentas em tempo real.
