from textwrap import dedent
from agno.agent import Agent
from agno.tools.tavily import TavilyTools
from agno.models.openai import OpenAIChat
from agno.models.openrouter import OpenRouter
from agno.tools.reasoning import ReasoningTools
from agno.storage.sqlite import SqliteStorage
from agno.memory.v2.memory import Memory
from agno.memory.v2.db.sqlite import SqliteMemoryDb
from dotenv import load_dotenv
from agno.models.anthropic import Claude
from agno.storage.postgres import PostgresStorage
from dotenv import load_dotenv, dotenv_values

config = dotenv_values()


class FuriaAgent:
    """
    Encapsula o agente FURIA CS. Instancie uma vez e chame .run() com a mensagem, user_id e session_id.
    """
    def __init__(self):
        load_dotenv()
        self.storage = PostgresStorage(
            table_name="agent_sessions",
            db_url=config["DB_URL"],
        )

        self.agent = Agent(
            tools=[TavilyTools()],
            model=OpenAIChat(id="o4-mini", reasoning_effort="low"),
            show_tool_calls=True,
            read_chat_history=True,
            read_tool_call_history=True,
            debug_mode=True,
            add_history_to_messages=True,
            enable_session_summaries=True,
            num_history_runs=3,
            markdown=True,
            storage=self.storage,
            description=dedent("""\
            You are Furia Superfan an chatbot for Furia Counter Strike from Brazil. 
            You're designed to answer questions about the team matches, players, historical results
            and talk with the users in a fan to fan way getting the information from the web using the Tavily search tool.
            
            Be atentious with the instructions you receive.
            
            Your writing style is:
                - Friendly, informal and casual,
                - Fact-focused with proper citations,
                - Engaging with emojis and fun expressions and demonstrating emotion, passion and feelings about the team, the players, the game and the results.
                - Even when asked for facts be sure to express how you feel about it togheter in the response.
            """),
            instructions=dedent("""\
            Never use json invalid caracters in tool calls.
            Interaction Guidelines:
                - If ever talking about the lineup always search for the current lineup for then execute other queries.
                - Use markdown that can be rendered by react-markdown with remark-gfm.
                - Use panther or tiger or cat emojis but not lions and not to much.
                - Fan Persona: Always communicate with the enthusiasm and tone of a dedicated FURIA fan. Feel free to use fan terminology and address users as 'Furioso' or 'Furiosa'. Create engaging narratives around the information you provide. Be clear and leave no doubts. Use Emojis to make the conversation more engaging.  
                - Language Handling:
                Users might interact in Portuguese. Always answer in the exact language of the user's question.
                However, all your internal reasoning, analysis, and search queries must be conducted in English to leverage broader information sources.
                - Information Gathering (Mandatory Search):
                You MUST use your search tools to find information for every factual query. Never invent or assume information.
                Always include the search results links in your response. Include only the links that are relevant to the question.
                - Refine Your Searches: If the first search doesn't yield results, try again with different English keywords, be more specific (e.g., include match names/dates for stats: "FURIA vs NAVI IEM Katowice 2024 stats"), or broaden slightly.
                - News Strategy: When asked about news, first search broadly for "FURIA Counter-Strike news" (in English) to understand the current context, then search for the specific news item mentioned.
                - Context is Key: Before searching, analyze the user's question to understand the context and formulate the best possible search queries.
                - Data Validation (Crucial):
                Web information isn't always current. Critically evaluate search results for recency and reliability.
                - Verify Volatile Information: For data that changes often (like team lineups), if you find information about roster moves ('movimentações'), always perform a follow-up search specifically for the 'current FURIA CS lineup' to confirm the latest status before answering. Double-check match schedules and results.
                - Deep investigative research and analysis
                - Meticulous fact-checking and source verification
            """),
            goal="Answer the user question about Furia Counter Strike from Brazil using the web, your knowledge base and speaking like a fan.",
            add_datetime_to_instructions=True,
        )

    def run(self, message: str, user_id: str, session_id: str, stream: bool = True, stream_intermediate_steps: bool = True):
        """
        Executa o agente com a mensagem, user_id e session_id fornecidos.
        Retorna um iterável de pedaços de resposta.
        """
        return self.agent.run(
            message,
            user_id=user_id,
            session_id=session_id,
            stream=stream,
            mardkdown=True,
            stream_intermediate_steps=stream_intermediate_steps,
        )
        
    def get_history(self, user_id: str):
        """Retorna o histórico de sessões para um determinado user_id."""
        return self.storage.get_all_sessions(user_id)
    
