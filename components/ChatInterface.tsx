/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Message, ToolCall } from '@/lib/types';
import { Code, ArrowUp, Loader2, Home as HomeIcon } from 'lucide-react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import Link from 'next/link';

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
  onSendMessage: (content: string) => Promise<void>; // Nova prop
  isStreaming: boolean; // Nova prop para indicar se está recebendo stream
}

export default function ChatInterface({
  messages,
  toolCalls,
  sessionId,
  onSendMessage, // Nova prop
  isStreaming // Nova prop
}: ChatInterfaceProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState(''); // Estado para o input

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Format timestamp to readable time
  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleSend = async () => {
    const content = draft.trim();
    if (!content || isStreaming) return; // Permite enviar mesmo sem sessionId (nova conversa)
    setDraft(''); // Limpa o input imediatamente
    try {
      await onSendMessage(content);
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      setDraft(content); // Restaura o rascunho em caso de erro
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Não precisamos mais verificar sessionId, pois agora sempre renderizamos a interface
  // mesmo quando estamos criando uma nova conversa

  // Custom renderers for Markdown components with Tailwind classes
  const markdownComponents: Components = {
    // Tables
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
    <div className="h-full flex flex-col">
      <div className="h-16 px-4 border-b border-border flex items-center justify-between"> {/* Use justify-between */}
        <div>
          <h2 className="font-semibold">Conversa</h2>
            <p className="text-xs text-muted-foreground">
            {sessionId ? `ID da Sessão: ${sessionId}` : 'Nova conversa'}
            </p>
        </div>
        {/* Add Back to Home Button */}
        <Button variant="ghost" size="icon" asChild>
          <Link href="/">
            <HomeIcon size={18} />
            <span className="sr-only">Voltar para Home</span>
          </Link>
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Messages and Tool Calls in a unified timeline */}
        <div className="space-y-3">
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
                  "max-w-[80%] px-3 py-2",
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

          {/* Tool Call Pills - Mostra as ferramentas sendo usadas pela IA 
              Com base no status:
              - "running": mostra ícone de carregamento girando
              - "completed": mostra ícone padrão de código
              Cada ferramenta aparece apenas uma vez, mesmo se chamada várias vezes.
              web_search_using_tavily é renomeado para "search" para melhor experiência do usuário.
          */}
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
      <div className="w-full px-4 py-3 border-t border-border bg-background flex items-center gap-2">
        <div className="flex-1">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming} // Só desabilita durante stream
            placeholder={isStreaming ? "Aguardando resposta..." : "Digite sua mensagem..."}
            className="bg-muted/40"
          />
        </div>
        <Button
          size="icon"
          onClick={handleSend}
          disabled={isStreaming || draft.trim().length === 0} // Só desabilita se streamando ou input vazio
          className="bg-black text-white hover:bg-black/80"
        >
          <ArrowUp size={18} />
        </Button>
      </div>
    </div>
  );
}