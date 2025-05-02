'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, MessageCircle, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { ConversationListItem } from '@/lib/types';
import Image from 'next/image';

interface ConversationSidebarProps {
  conversations: ConversationListItem[];
  activeSessionId: string | null;
  onSessionSelect: (sessionId: string) => void;
  onNewConversation: () => void; // Adicionada a nova prop
}

export default function ConversationSidebar({
  conversations,
  activeSessionId,
  onSessionSelect,
  onNewConversation // Adicionada a nova prop
}: ConversationSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  
  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  // Format timestamp to readable date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('pt-BR');
  };

  return (
    <div 
      className={cn(
        "h-full bg-secondary/30 border-r border-border transition-all duration-300 flex flex-col",
        collapsed ? "w-16" : "w-80"
      )}
    >
      <div className="flex items-center justify-between h-16 px-4 border-b border-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Image 
              src="/furia_sem_letras.png" 
              alt="FURIA Logo" 
              width={24} 
              height={24} 
              className="rounded-sm"
            />
            <h2 className="font-semibold">Conversas</h2>
          </div>
        )}
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className={collapsed ? "mx-auto" : "ml-auto"}>
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-muted-foreground">
            {!collapsed && <p className="text-center">Nenhuma conversa ainda</p>}
            {collapsed && <MessageCircle size={24} />}
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {conversations.map((conversation) => (
              <Button
                key={conversation.session_id}
                variant={activeSessionId === conversation.session_id ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start text-left h-auto py-3 px-4",
                  collapsed ? "px-2" : "px-4"
                )}
                onClick={() => onSessionSelect(conversation.session_id)}
              >
                {collapsed ? (
                  <MessageCircle size={20} />
                ) : (
                  <div className="truncate">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-muted-foreground">
                        {formatDate(conversation.created_at)}
                      </span>
                    </div>
                    <p className="truncate text-sm">{conversation.lastMessage}</p>
                  </div>
                )}
              </Button>
            ))}
          </div>
        )}
      </div>
      
      {/* Botão Nova conversa habilitado e funcional */}
      <div className="p-3 border-t border-border">
        <Button 
          variant="outline" 
          className="w-full justify-start"
          onClick={onNewConversation} // Chama a função passada por prop
        >
          <Plus size={16} className="mr-2" />
          {!collapsed && "Nova conversa"}
        </Button>
      </div>
    </div>
  );
}