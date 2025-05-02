/* eslint-disable @typescript-eslint/no-explicit-any */
export interface Message {
  content: string;
  role: string;
  created_at: number;
  from_history?: boolean;
  stop_after_tool_call?: boolean;
  tool_calls?: Array<{
    id: string;
    type: string;
    function: {
      name: string;
      arguments: string;
    };
  }>;
}

export interface Run {
  content: string;
  content_type?: string;
  event?: string;
  model: string;
  run_id: string;
  agent_id: string;
  session_id: string;
  created_at: number;
  messages: Message[];
  metrics?: {
    input_tokens: number[];
    output_tokens: number[];
    total_tokens: number[];
    time: number[];
    time_to_first_token: number[];
  };
}

export interface Session {
  session_id: string;
  user_id: string;
  team_session_id: string | null;
  memory: {
    summaries?: any;
    memories?: any;
    runs: Run[];
  };
  session_data: {
    session_metrics: any;
  };
  extra_data: any;
  created_at: number;
  updated_at: number | null;
  agent_id: string;
  agent_data: {
    agent_id: string;
    model: {
      name: string;
      provider: string;
      id: string;
      functions: Record<string, {
        name: string;
        description: string;
        parameters: any;
      }>;
    };
  };
}

export interface SessionData {
  sessions: Session[];
}

export interface ConversationListItem {
  session_id: string;
  lastMessage: string;
  created_at: number;
}

export interface ToolCall {
  name: string;
  parameters?: any;
  status: "running" | "completed"; // status é obrigatório
  result?: any;
} 