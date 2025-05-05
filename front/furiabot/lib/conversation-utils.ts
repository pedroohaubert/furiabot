import { Session, SessionData, ToolCall, ConversationListItem, Message } from './types';

// Retorna a última mensagem relevante de uma sessão
export function getLastMessage(session: Session): string {
  if (!session.memory.runs || session.memory.runs.length === 0) {
    return "No messages";
  }
  const lastRun = session.memory.runs[session.memory.runs.length - 1];
  if (!lastRun.messages || lastRun.messages.length === 0) {
    return "No messages";
  }
  const userMessages = lastRun.messages.filter(msg => 
    msg.role !== 'system' && 
    msg.content && 
    !isToolOutput(msg.content)
  );
  if (userMessages.length === 0) {
    return "No messages";
  }
  const lastMessage = userMessages[userMessages.length - 1];
  return lastMessage.content.substring(0, 50) + (lastMessage.content.length > 50 ? '...' : '');
}

export function formatConversationList(sessionData: SessionData): ConversationListItem[] {
  if (!sessionData.sessions) {
    return [];
  }
  return sessionData.sessions.map(session => ({
    session_id: session.session_id,
    lastMessage: getLastMessage(session),
    created_at: session.created_at
  })).sort((a, b) => b.created_at - a.created_at);
}

// Verifica se o conteúdo é saída de ferramenta ou etapa de raciocínio
function isToolOutput(content: string): boolean {
  const toolOutputPatterns = [
    /^Step \d+:/i,
    /^Title: .+\nReasoning:/i,
    /^# .+\n\n### Summary/i,
    /\nShare:\n\nComments\n/i,
    /^Analyzing the search results/i,
    /^Based on the search results/i,
    /^Let me analyze/i
  ];
  return toolOutputPatterns.some(pattern => pattern.test(content));
}

// Extrai mensagens relevantes do último run
export function extractMessages(session: Session): Message[] {
  if (!session.memory.runs || session.memory.runs.length === 0) {
    return [];
  }
  const lastRun = session.memory.runs[session.memory.runs.length - 1];
  const allMessages: Message[] = [];
  if (lastRun.messages && lastRun.messages.length > 0) {
    lastRun.messages.forEach(message => {
      if (
        message.role !== 'system' && 
        !message.tool_calls && 
        message.content && 
        !isToolOutput(message.content)
      ) {
        allMessages.push({
          content: message.content,
          role: message.role,
          created_at: message.created_at,
          from_history: message.from_history,
          stop_after_tool_call: message.stop_after_tool_call
        });
      }
    });
  }
  return allMessages;
}

// Extrai tool calls do último run
export function extractToolCalls(session: Session): ToolCall[] {
  const toolCalls: Map<string, ToolCall> = new Map();
  if (!session.memory.runs || session.memory.runs.length === 0) {
    return [];
  }
  const lastRun = session.memory.runs[session.memory.runs.length - 1];
  try {
    if (lastRun.event === "ToolCallStarted" || lastRun.event === "ToolCallCompleted") {
      const content = lastRun.content as string;
      const toolNameMatch = content.match(/^([a-zA-Z0-9_]+)\(/);
      if (toolNameMatch) {
        let toolName = toolNameMatch[1];
        if (toolName === "web_search_using_tavily") {
          toolName = "search";
        }
        const status = lastRun.event === "ToolCallStarted" ? "running" : "completed";
        toolCalls.set(toolName, {
          name: toolName,
          parameters: null,
          status,
          result: null
        });
      }
    }
    if (lastRun.messages) {
      for (let i = 0; i < lastRun.messages.length; i++) {
        const message = lastRun.messages[i];
        if (message.tool_calls && Array.isArray(message.tool_calls)) {
          message.tool_calls.forEach(toolCall => {
            if (toolCall.function && toolCall.function.name) {
              let toolName = toolCall.function.name;
              if (toolName === "web_search_using_tavily") {
                toolName = "search";
              }
              const existingTool = toolCalls.get(toolName);
              const status = existingTool?.status === "running" ? "running" : "completed";
              toolCalls.set(toolName, {
                name: toolName,
                parameters: null,
                status,
                result: null
              });
            }
          });
        }
      }
    }
  } catch (error) {
    console.error('Error extracting tool calls:', error);
  }
  return Array.from(toolCalls.values());
}

export function findSessionById(sessionData: SessionData, sessionId: string): Session | null {
  if (!sessionData.sessions) {
    return null;
  }
  return sessionData.sessions.find(session => session.session_id === sessionId) || null;
}