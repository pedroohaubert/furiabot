import { Session, SessionData, ToolCall, ConversationListItem, Message } from './types';

/**
 * Extract the last message from a session
 */
export function getLastMessage(session: Session): string {
  if (!session.memory.runs || session.memory.runs.length === 0) {
    return "No messages";
  }

  const lastRun = session.memory.runs[session.memory.runs.length - 1];
  if (!lastRun.messages || lastRun.messages.length === 0) {
    return "No messages";
  }

  // Get last non-system message that appears to be a genuine conversation message
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

/**
 * Convert session data to conversation list format
 */
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

/**
 * Check if content appears to be a tool output or reasoning step
 */
function isToolOutput(content: string): boolean {
  // Check for common patterns in tool outputs
  const toolOutputPatterns = [
    /^Step \d+:/i,                         // Step patterns
    /^Title: .+\nReasoning:/i,             // Think or analyze tool output
    /^# .+\n\n### Summary/i,               // Web search results
    /\nShare:\n\nComments\n/i,             // Search result footers
    /^Analyzing the search results/i,      // Analysis patterns
    /^Based on the search results/i,
    /^Let me analyze/i
  ];
  
  return toolOutputPatterns.some(pattern => pattern.test(content));
}

/**
 * Extract all messages from a session (only from the latest run)
 */
export function extractMessages(session: Session): Message[] {
  if (!session.memory.runs || session.memory.runs.length === 0) {
    return [];
  }

  // Only use the latest run
  const lastRun = session.memory.runs[session.memory.runs.length - 1];
  const allMessages: Message[] = [];

  if (lastRun.messages && lastRun.messages.length > 0) {
    lastRun.messages.forEach(message => {
      // Skip system messages, messages with tool_calls, and content that looks like tool output
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

/**
 * Extract tool calls from a session
 */
export function extractToolCalls(session: Session): ToolCall[] {
  const toolCalls: Map<string, ToolCall> = new Map();
  
  if (!session.memory.runs || session.memory.runs.length === 0) {
    return [];
  }

  // Only use the latest run
  const lastRun = session.memory.runs[session.memory.runs.length - 1];
  
  try {
    // Primeiro, processa mensagens com eventos de ToolCallStarted e ToolCallCompleted
    if (lastRun.event === "ToolCallStarted" || lastRun.event === "ToolCallCompleted") {
      // Extrai o nome da ferramenta do conteúdo
      const content = lastRun.content as string;
      const toolNameMatch = content.match(/^([a-zA-Z0-9_]+)\(/);
      
      if (toolNameMatch) {
        let toolName = toolNameMatch[1];
        
        // Renomear web_search_using_tavily para search
        if (toolName === "web_search_using_tavily") {
          toolName = "search";
        }
        
        // Define o status com base no tipo de evento
        const status = lastRun.event === "ToolCallStarted" ? "running" : "completed";
        
        // Adiciona ou atualiza a ferramenta sem duplicação
        toolCalls.set(toolName, {
          name: toolName,
          parameters: null,
          status,
          result: null
        });
      }
    }
    
    // Também capturamos tool_calls das mensagens
    if (lastRun.messages) {
      for (let i = 0; i < lastRun.messages.length; i++) {
        const message = lastRun.messages[i];
        
        // Check if this message has tool_calls
        if (message.tool_calls && Array.isArray(message.tool_calls)) {
          message.tool_calls.forEach(toolCall => {
            // Extract only the tool name
            if (toolCall.function && toolCall.function.name) {
              let toolName = toolCall.function.name;
              
              // Renomear web_search_using_tavily para search
              if (toolName === "web_search_using_tavily") {
                toolName = "search";
              }
              
              // Se não temos informação específica sobre o status, assumimos completed
              // se já não tivermos essa ferramenta no Map com status running
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

/**
 * Find a session by ID in the session data
 */
export function findSessionById(sessionData: SessionData, sessionId: string): Session | null {
  if (!sessionData.sessions) {
    return null;
  }
  
  return sessionData.sessions.find(session => session.session_id === sessionId) || null;
} 