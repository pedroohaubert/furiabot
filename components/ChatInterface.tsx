/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Message, ToolCall } from '@/lib/types';
import { Code, ArrowUp, Loader2, Home as HomeIcon, Menu, Plus } from 'lucide-react'; // Import Plus
import Image from 'next/image';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

// Componente para os pontos animados
const AnimatedDots = () => (
  <span className="inline-flex items-center">
    <span className="animate-bounce delay-0">.</span>
    <span className="animate-bounce delay-150">.</span>
    <span className="animate-bounce delay-300">.</span>
  </span>
);

interface ChatInterfaceProps {
  messages: Message[];
  toolCalls: ToolCall[];
  sessionId: string | null;
  onSendMessage: (content: string) => Promise<void>;
  isStreaming: boolean;
  sidebarVisible: boolean;
  onToggleSidebar: () => void;
  onNewConversation: () => void; // Add onNewConversation prop
}

// Componente de interface de chat principal. Recebe mensagens, toolCalls, sessionId, funções de envio e controle de UI.
export default function ChatInterface({
  messages,
  toolCalls,
  sessionId,
  onSendMessage,
  isStreaming,
  sidebarVisible,
  onToggleSidebar,
  onNewConversation
}: ChatInterfaceProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState('');

  // Faz scroll automático para o final da lista de mensagens ao atualizar mensagens.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Formata timestamp para horário legível.
  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Envia a mensagem digitada pelo usuário. Recebe o texto do input.
  const handleSend = async () => {
    const content = draft.trim();
    if (!content || isStreaming) return;
    setDraft('');
    try {
      await onSendMessage(content);
    } catch (error) {
      setDraft(content);
    }
  };

  // Captura Enter para enviar mensagem e Shift+Enter para nova linha.
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Renderização customizada de componentes Markdown.
  const markdownComponents: Components = {
    table: ({...props}) => <table className="table-auto w-full border-collapse border border-border my-4" {...props} />,
    thead: ({...props}) => <thead className="bg-muted" {...props} />,
    th: ({...props}) => <th className="border border-border px-4 py-2 text-left font-medium text-muted-foreground" {...props} />,
    td: ({...props}) => <td className="border border-border px-4 py-2 text-left" {...props} />,
    tr: ({...props}) => <tr className="border-b border-border" {...props} />,
    // Links
    a: ({...props}) => <a className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />, // Added target and rel for external links
    // Headings
    h1: ({...props}) => <h1 className="text-2xl font-bold my-4" {...props} />,
    h2: ({...props}) => <h2 className="text-xl font-semibold my-3" {...props} />,
    h3: ({...props}) => <h3 className="text-lg font-semibold my-3" {...props} />,
    h4: ({...props}) => <h4 className="text-base font-semibold my-2" {...props} />,
    h5: ({...props}) => <h5 className="text-sm font-semibold my-2" {...props} />,
    h6: ({...props}) => <h6 className="text-xs font-semibold my-2" {...props} />,
    // Lists
    ul: ({...props}) => <ul className="list-disc pl-6 my-2" {...props} />,
    ol: ({...props}) => <ol className="list-decimal pl-6 my-2" {...props} />,
    li: ({...props}) => <li className="my-1" {...props} />,
    // Blockquote
    blockquote: ({...props}) => <blockquote className="border-l-4 border-border pl-4 italic my-4 text-muted-foreground" {...props} />,
    // Code
    pre: ({...props}) => <pre className="bg-muted p-3 rounded-md overflow-x-auto my-2 text-sm" {...props} />,
    code: ({node, className, children, ...props}) => {
      // Use node.inline to determine if it's inline code
      const isInline = (node as any)?.inline;
      return !isInline ? (
        // Code block (already handled by pre, but rehype-highlight adds className)
        <code className={cn(className, "text-sm")} {...props}>
          {children}
        </code>
      ) : (
        // Inline code
        <code className="bg-muted/50 px-1 py-0.5 rounded text-sm font-mono" {...props}>
          {children}
        </code>
      );
    },
    // Horizontal Rule
    hr: ({...props}) => <hr className="border-t border-border my-4" {...props} />,
    // Paragraph (optional, prose handles it, but can customize)
    // p: ({...props}) => <p className="my-2" {...props} />,
  };

  return (
    <div className="h-full flex flex-col w-full bg-background rounded-xl"> {/* Removed max-w-4xl, mx-auto, shadow-lg */}
      <div className="h-16 px-4 border-b border-border flex items-center relative">
        {/* Left Group (Menu Button & New Conversation Button) */}
        <div className="flex items-center z-10">
          <Button variant="ghost" size="icon" onClick={onToggleSidebar} className="md:flex">
            <Menu size={18} />
            <span className="sr-only">{sidebarVisible ? 'Fechar menu' : 'Abrir menu'}</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={onNewConversation} className="ml-2">
            <Plus size={18} />
            <span className="sr-only">Nova conversa</span>
          </Button>
        </div>

        {/* Center Group (Title) - absolutamente centralizado */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center">
          <Image 
            src="/furia_sem_letras.png" 
            alt="FURIA Logo" 
            width={24} 
            height={24} 
            className="rounded-sm mr-1"
          />
          <h2 className="font-semibold">FuriaBot3000</h2>
        </div>

        {/* Right Group (Home Button) */}
        <div className="flex items-center ml-auto z-10">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/">
              <HomeIcon size={18} />
              <span className="sr-only">Voltar para Home</span>
            </Link>
          </Button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Added max-w-3xl mx-auto for message centering on larger screens */}
        <div className="space-y-3 max-w-3xl mx-auto flex flex-col h-full"> {/* Added flex flex-col h-full */}
          {/* Conditional Placeholder */}
          {messages.length === 0 && (
            <div className="flex-1 flex items-center justify-center text-center text-muted-foreground px-4">
              Converse sobre qualquer assunto relacionado à FURIA, desde histórico de partidas a movimentações nas lineups. <br /> <br/> Sugestão: Mudanças recentes na line de CS:GO 2.
            </div>
          )}

          {/* User and Assistant Messages */}
          {messages.map((message, index) => {
            if (typeof message.content === 'object') return null;
            return (
              <div key={`msg-${index}`}>
                <div 
                  className={cn(
                    "flex",
                    message.role === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  <div 
                    className={cn(
                      "max-w-[80%] px-4 py-3",
                      message.role === 'user' 
                        ? "bg-muted rounded-2xl text-foreground" 
                        : "bg-transparent"
                    )}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex justify-start mb-1">
                        <Image 
                          src="/furia_sem_letras.png" 
                          alt="FURIA Bot" 
                          width={20} 
                          height={20}
                        />
                      </div>
                    )}
                    <div className="space-y-1">
                      <div className="text-sm whitespace-pre-wrap prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-headings:my-2 prose-blockquote:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-table:my-2 prose-th:px-3 prose-th:py-1 prose-td:px-3 prose-td:py-1">
                        {message.content === '...' ? (
                          <AnimatedDots />
                        ) : (
                          <ReactMarkdown 
                            remarkPlugins={[remarkGfm]} 
                            rehypePlugins={[rehypeHighlight]}
                            components={markdownComponents}
                          >
                            {message.content.toString()}
                          </ReactMarkdown>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{formatTime(message.created_at)}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Tool Call Pills */}
          {toolCalls.length > 0 && (
            <div className="flex flex-wrap gap-2 my-2">
              {toolCalls.map((tool, index) => (
                <div 
                  key={`tool-${index}`} 
                  className="inline-flex items-center bg-muted/60 text-xs px-2 py-1 rounded-full"
                >
                  {tool.status === "running" ? (
                    <Loader2 size={12} className="mr-1 text-primary animate-spin" />
                  ) : (
                    <Code size={12} className="mr-1 text-primary" />
                  )}
                  <span>{tool.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div ref={messagesEndRef} />
      </div>

      <div className="w-full px-4 py-4 bg-background"> {/* Removed border-t */}
        <div className="max-w-3xl mx-auto relative">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
            placeholder={isStreaming ? "Aguardando resposta..." : "Digite sua mensagem..."}
            className="min-h-[80px] pr-12 py-3 resize-none bg-muted/40 rounded-2xl"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={isStreaming || draft.trim().length === 0}
            className="absolute right-3 bottom-3 bg-black text-white hover:bg-black/80 rounded-xl"
          >
            <ArrowUp size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
}