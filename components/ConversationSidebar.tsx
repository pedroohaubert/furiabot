'use client';

import { ChevronLeft, ChevronRight, MessageCircle, Plus, X } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { ConversationListItem } from '@/lib/types';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface ConversationSidebarProps {
  conversations: ConversationListItem[];
  activeSessionId: string | null;
  onSessionSelect: (sessionId: string) => void;
  onNewConversation: () => void;
  visible: boolean;
  onClose: () => void;
}

export default function ConversationSidebar({
  conversations,
  activeSessionId,
  onSessionSelect,
  onNewConversation,
  visible,
  onClose
}: ConversationSidebarProps) {
  // Formata timestamp para data legível (pt-BR)
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('pt-BR');
  };

  return (
    <motion.div 
      initial={{ x: "-110%", opacity: 0 }} // Start further left and faded out
      animate={{ 
        x: visible ? 0 : "-110%", 
        opacity: visible ? 1 : 0 
      }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className={cn(
        "fixed top-4 bottom-4 left-4 z-20 w-80 bg-card border border-border/50 flex flex-col shadow-xl rounded-xl overflow-hidden", // Changed positioning, background, added border, rounded corners, shadow, overflow
        // Animation handles visibility
      )}
    >
      <div className="flex items-center justify-between h-16 px-4 border-b border-border/50"> {/* Adjusted border */}
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
        <Button variant="ghost" size="icon" onClick={onClose} className="ml-auto">
          <X size={18} />
          <span className="sr-only">Fechar menu</span>
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-muted-foreground">
            <p className="text-center">Nenhuma conversa ainda</p>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {conversations.map((conversation) => (
              <Button
                key={conversation.session_id}
                variant={activeSessionId === conversation.session_id ? "secondary" : "ghost"}
                className="w-full justify-start text-left h-auto py-3 px-4 rounded-xl"
                onClick={() => {
                  onSessionSelect(conversation.session_id);
                  onClose();
                }}
              >
                <div className="truncate">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-muted-foreground">
                      {formatDate(conversation.created_at)}
                    </span>
                  </div>
                  <p className="truncate text-sm">{conversation.lastMessage}</p>
                </div>
              </Button>
            ))}
          </div>
        )}
      </div>
      
      <div className="p-4 border-t border-border/50"> {/* Adjusted border */}
        <Button 
          variant="outline" 
          className="w-full justify-start rounded-xl"
          onClick={onNewConversation}
        >
          <Plus size={16} className="mr-2" />
          Nova conversa
        </Button>
      </div>
    </motion.div>
  );
}