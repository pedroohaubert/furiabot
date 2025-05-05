'use client';

import { useAuth } from "@/lib/auth-context";
import { useState, useEffect, useCallback, useRef } from "react"; // Adicionado useCallback e useRef
import ConversationSidebar from "@/components/ConversationSidebar";
import ChatInterface from "@/components/ChatInterface";
import { formatConversationList, extractMessages, extractToolCalls, findSessionById } from "@/lib/conversation-utils";
import { SessionData, Message, ToolCall, ConversationListItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
if (!API_URL) {
  throw new Error("NEXT_PUBLIC_API_URL is not defined. Please set it in your environment variables.");
}

// Função auxiliar para parsear tool calls do stream
const parseToolCall = (content: string): string | null => {
  const match = content.match(/^([a-zA-Z0-9_]+)\(.*\)$/);
  if (!match) return null;
  
  // Renomeia web_search_using_tavily para search
  const toolName = match[1] === "web_search_using_tavily" ? "search" : match[1];
  return toolName;
};

export default function Dashboard() {
  const { fetchWithAuth } = useAuth();
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isCreatingNewConversation, setIsCreatingNewConversation] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  // Ref para armazenar temporariamente o ID de nova sessão vindo do stream
  const newSessionIdRef = useRef<string | null>(null);
  // Armazena temporariamente o ID de nova sessão até buscarmos dados

  // Fetch the conversation data from the API
  // Usando useCallback para evitar recriação desnecessária e satisfazer o lint
  const fetchConversationData = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }
    setError(null);

    try {
      // Use NEXT_PUBLIC_API_URL
      const response = await fetchWithAuth(`${API_URL}/sessions`);

      if (!response.ok) {
        throw new Error(`Falha ao buscar dados: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      setSessionData(result);
    } catch (err: unknown) {
      console.error('Erro ao buscar dados de conversa:', err);
      setError(err instanceof Error ? err.message : 'Não foi possível buscar dados de conversa');
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [fetchWithAuth]); // Adicionado fetchWithAuth como dependência

  // Fetch conversation data on component mount and start a new conversation
  useEffect(() => {
    fetchConversationData();
    // Inicia uma nova conversa por padrão ao carregar a página
    handleNewConversation();
    // Auto-refresh data every 60 seconds
    const refreshInterval = setInterval(() => fetchConversationData(false), 60000);
    return () => clearInterval(refreshInterval);
  }, [fetchConversationData]); // Adicionado fetchConversationData como dependência

  // Update derived state when sessionData or activeSessionId changes
  useEffect(() => {
    if (sessionData) {
      // Update conversation list
      const formattedConversations = formatConversationList(sessionData);
      setConversations(formattedConversations);

      if (activeSessionId) {
        const activeSession = findSessionById(sessionData, activeSessionId);
        if (activeSession) {
          // Sessão ativa encontrada, atualiza mensagens e ferramentas
          // Apenas atualiza se os dados realmente mudaram para evitar re-render desnecessário
          // (Opcional, mas pode otimizar)
          // const currentMessagesJson = JSON.stringify(messages);
          // const newMessagesJson = JSON.stringify(extractMessages(activeSession));
          // if (currentMessagesJson !== newMessagesJson) {
             setMessages(extractMessages(activeSession));
          // }
          // const currentToolsJson = JSON.stringify(toolCalls);
          // const newToolsJson = JSON.stringify(extractToolCalls(activeSession));
          // if (currentToolsJson !== newToolsJson) {
             setToolCalls(extractToolCalls(activeSession));
          // }
        } else {
          // Sessão ativa não encontrada (ex: deletada ou ID inválido)
          // Só limpa e seleciona outra se não estivermos no meio da criação
          if (!isCreatingNewConversation) {
            setMessages([]);
            setToolCalls([]);
            // Seleciona a mais recente disponível, se houver
            if (formattedConversations.length > 0) {
              console.log("Sessão ativa não encontrada, selecionando a mais recente:", formattedConversations[0].session_id);
              setActiveSessionId(formattedConversations[0].session_id);
            } else {
              setActiveSessionId(null); // Nenhuma conversa restante
            }
          }
          // Se estiver criando (isCreatingNewConversation=true), não faz nada aqui,
          // pois o ID da nova sessão ainda não chegou ou setActiveSessionId(newId)
          // ainda não refletiu no estado ao entrar neste useEffect.
          // A lógica dentro do stream já definiu o activeSessionId correto.
        }
      } else {
        // Nenhuma sessão ativa selecionada (activeSessionId é null)
        if (isCreatingNewConversation) {
          // Estamos no modo de criação ativo. Limpa a interface para a nova conversa.
          // Não seleciona nenhuma sessão aqui, espera o ID chegar do stream.
          setMessages([]);
          setToolCalls([]);
          console.log("Modo de criação ativo, interface limpa, esperando ID da sessão.");
        } else {
           // Não estamos criando uma nova E não há sessão ativa.
           // Seleciona a mais recente se existir (ex: após deletar a última, ou no carregamento inicial sem seleção)
           if (formattedConversations.length > 0) {
             console.log("Nenhuma sessão ativa e não criando, selecionando a mais recente:", formattedConversations[0].session_id);
             setActiveSessionId(formattedConversations[0].session_id);
           } else {
             // Nenhuma conversa existe, limpa tudo
             setMessages([]);
             setToolCalls([]);
           }
        }
      }
    } else {
       // No session data, clear everything
       setConversations([]);
       setMessages([]);
       setToolCalls([]);
       setActiveSessionId(null);
    }
  // Dependências corretas: reage a mudanças nos dados, no ID ativo ou no estado de criação.
  }, [sessionData, activeSessionId, isCreatingNewConversation]);

  // Função para iniciar uma nova conversa
  const handleNewConversation = () => {
    setActiveSessionId(null);
    setMessages([]);
    setToolCalls([]); // Limpa o array de ferramentas
    setIsCreatingNewConversation(true);
  };

  // Função para selecionar uma sessão existente
  const handleSessionSelect = (sessionId: string) => {
    setIsCreatingNewConversation(false); // Garante que não estamos mais no modo de criação
    setActiveSessionId(sessionId);
  };

  // Função para enviar mensagem e processar stream
  const sendMessage = async (content: string) => {
    // Permite enviar mesmo se activeSessionId for null (caso de nova conversa)
    if (!activeSessionId && !isCreatingNewConversation) return;

    setIsStreaming(true);
    const userMessage: Message = {
      content,
      role: 'user',
      created_at: Date.now() / 1000,
    };
    // Adiciona a mensagem do usuário imediatamente
    setMessages((prev) => [...prev, userMessage]);
    setToolCalls([]); // Limpa tool calls anteriores

    const assistantMessagePlaceholder: Message = {
      content: '...',
      role: 'assistant',
      created_at: Date.now() / 1000 + 0.1, // Pequeno delay para ordenar
    };
    // Adiciona o placeholder da resposta do assistente
    setMessages((prev) => [...prev, assistantMessagePlaceholder]);

    let assistantResponse = '';

    try {
      const requestBody = isCreatingNewConversation
        ? { message: content } // Não envia session_id para nova conversa
        : { message: content, session_id: activeSessionId };

      // Use NEXT_PUBLIC_API_URL
      const response = await fetchWithAuth(`${API_URL}/stream_response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
      if (!response.body) throw new Error('A resposta da API não contém corpo (body).');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let doneStream = false;
      // Descreve o objeto recebido no stream, incluindo session_id opcional
      type StreamObj = { event?: string; content?: unknown; created_at?: number; session_id?: string };

      while (!doneStream) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let start = buffer.indexOf('{');
        while (start !== -1) {
          // ... (lógica de extração de JSON do buffer permanece a mesma) ...
          let braceCount = 0;
          let end = -1;
          for (let i = start; i < buffer.length; i++) {
            if (buffer[i] === '{') braceCount++;
            else if (buffer[i] === '}') braceCount--;
            if (braceCount === 0) {
              end = i;
              break;
            }
          }
          if (end === -1) break; // JSON incompleto

          const jsonStr = buffer.slice(start, end + 1);
          buffer = buffer.slice(end + 1);
          start = buffer.indexOf('{');
          let obj: StreamObj;
          try {
            obj = JSON.parse(jsonStr) as StreamObj;
          } catch (error) {
            console.warn('Erro ao parsear JSON do stream, ignorando:', jsonStr, error);
            continue;
          }

          // Captura o session_id se for uma nova conversa e ainda não o tivermos
          if (isCreatingNewConversation && obj.session_id && !newSessionIdRef.current) {
            // Armazena o novo session_id para seleção futura após refetch
            newSessionIdRef.current = obj.session_id;
            console.log("Nova session ID armazenada (aguardando fetch):", newSessionIdRef.current);
          }

          const evt = obj.event;
          const contentChunk = obj.content; // Renomeado para evitar conflito de nome

          // ... (lógica de tratamento de eventos ToolCallStarted, RunCompleted, etc. permanece a mesma) ...
          // Detect run completion and updating memory, scheduling fetch only on run completion
          if (evt === 'RunCompleted') {
            doneStream = true;
            // Após delay, refaz fetch e garante seleção pelo ID recebido
            setTimeout(() => {
              fetchConversationData(false)
                .then(() => {
                  const newId = newSessionIdRef.current;
                  if (newId) {
                    setActiveSessionId(newId);
                    setIsCreatingNewConversation(false);
                    // limpa ref
                    newSessionIdRef.current = null;
                  }
                })
                .catch(console.error);
            }, 500);
            break;
          }
          if (evt === 'UpdatingMemory') {
            continue;
          }

          if (evt === 'ToolCallStarted' && typeof contentChunk === 'string') {
            const name = parseToolCall(contentChunk);
            if (name) {
              setToolCalls(prevToolCalls => {
                const existingToolIndex = prevToolCalls.findIndex(tc => tc.name === name);
                if (existingToolIndex === -1) {
                  // Add new tool
                  return [...prevToolCalls, { name, parameters: null, result: null, status: "running" }];
                } else {
                  // Update existing tool status to running
                  const updatedTools = [...prevToolCalls];
                  updatedTools[existingToolIndex] = { ...updatedTools[existingToolIndex], status: "running" };
                  return updatedTools;
                }
              });
            }
            continue;
          }

          if (evt === 'ToolCallCompleted' && typeof contentChunk === 'string') {
            const name = parseToolCall(contentChunk);
            if (name) {
              setToolCalls(prevToolCalls => {
                const existingToolIndex = prevToolCalls.findIndex(tc => tc.name === name);
                if (existingToolIndex !== -1) {
                   // Update existing tool status to completed
                  const updatedTools = [...prevToolCalls];
                  updatedTools[existingToolIndex] = { ...updatedTools[existingToolIndex], status: "completed" };
                  return updatedTools;
                }
                // If tool not found (should be rare), return previous state
                return prevToolCalls; 
              });
            }
            continue;
          }
          
          if (evt === 'RunStarted' || evt === 'ReasoningStarted' || evt === 'MemoryUpdated') {
            continue;
          }

          // Atualiza resposta do assistente a partir de chunks de string
          if (typeof contentChunk === 'string') {
            assistantResponse += contentChunk;
            setMessages(prev => {
              const msgs = [...prev];
              const idx = msgs.length - 1; // Índice do placeholder/mensagem do assistente
              if (idx >= 0 && msgs[idx].role === 'assistant') {
                msgs[idx] = {
                  ...msgs[idx],
                  content: assistantResponse, // Atualiza o conteúdo
                  created_at: obj.created_at ?? msgs[idx].created_at // Atualiza timestamp se disponível
                };
                return msgs;
              }
              return prev; // Retorna estado anterior se algo estiver errado
            });
          }
        } // Fim do while (start !== -1)
      } // Fim do while (!doneStream)

      // Garante que o buffer restante seja processado se houver
      // (A lógica de extração de JSON já deve cuidar disso, mas é uma segurança)
      if (buffer.trim().length > 0) {
         console.warn("Buffer restante após o stream:", buffer);
      }

    } catch (err: unknown) {
      console.error('Erro durante o stream:', err);
      // Atualiza a mensagem do assistente com o erro
      setMessages(prev => {
        const msgs = [...prev];
        const idx = msgs.length - 1;
        if (idx >= 0 && msgs[idx].role === 'assistant') {
          msgs[idx] = {
            ...msgs[idx],
            content: `Erro: ${err instanceof Error ? err.message : 'Ocorreu um erro desconhecido'}`,
          };
          return msgs;
        }
        return prev;
      });
      setError(err instanceof Error ? err.message : 'Erro ao processar a resposta');
    } finally {
      setIsStreaming(false);
      // Garante que saiu do modo de criação, mesmo se houver erro antes de receber o ID
      // Isso já é feito dentro do stream quando o ID é recebido.
      // Se ocorrer um erro *antes* de receber o ID, isCreatingNewConversation permanecerá true,
      // o que é correto, pois a criação falhou. O próximo fetchConversationData ou
      // a tentativa de enviar outra mensagem lidará com isso.
      // setIsCreatingNewConversation(false); // Removido daqui
    }
  };

  // Renderização condicional para loading e erro inicial
  if (loading && !sessionData) {
    return <div className="flex items-center justify-center h-screen">Carregando conversas...</div>;
  }

  if (error && !sessionData) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <p className="text-red-500 mb-4">Erro: {error}</p>
        <Button onClick={() => fetchConversationData(true)}>Tentar Novamente</Button>
      </div>
    );
  }

  // Funções para controlar a visibilidade da barra lateral
  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  const closeSidebar = () => {
    setSidebarVisible(false);
  };

  return (
    <div className="relative flex h-screen bg-background overflow-hidden">
      {/* Overlay para fechar a barra lateral em dispositivos móveis */}
      {sidebarVisible && (
        <div 
          className="fixed inset-0 bg-black/20 z-10 md:hidden" 
          onClick={closeSidebar}
        />
      )}
      
      <ConversationSidebar
        conversations={conversations}
        activeSessionId={activeSessionId}
        onSessionSelect={handleSessionSelect}
        onNewConversation={handleNewConversation}
        visible={sidebarVisible}
        onClose={closeSidebar}
      />
      
      {/* Apply conditional padding/margin based on sidebar visibility */}
      <main className={cn(
        "flex-1 flex flex-col h-full overflow-hidden transition-all duration-300 ease-in-out"
      )}>
        <ChatInterface
          messages={messages}
          toolCalls={toolCalls}
          sessionId={activeSessionId}
          onSendMessage={sendMessage}
          isStreaming={isStreaming}
          sidebarVisible={sidebarVisible}
          onToggleSidebar={toggleSidebar}
          onNewConversation={handleNewConversation} // Pass handleNewConversation
        />
      </main>
    </div>
  );
}