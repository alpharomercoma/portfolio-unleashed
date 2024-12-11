import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from 'framer-motion';
import React from 'react';

interface ChatMessageProps {
  content: string;
  role: 'user' | 'assistant' | 'system' | 'data';
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ content, role }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'} mb-4 items-end`}
    >
      {role === 'assistant' && (
        <Avatar className="mr-2 mb-1">
          <AvatarImage src="/zea-avatar.png" alt="Zea" />
          <AvatarFallback>Z</AvatarFallback>
        </Avatar>
      )}
      <div
        className={`max-w-[80%] p-3 rounded-2xl ${role === 'user'
          ? 'bg-primary text-primary-foreground rounded-br-none'
          : 'bg-muted rounded-bl-none'
          } shadow-md`}
      >
        <p className="text-sm leading-relaxed">{content}</p>
      </div>
      {role === 'user' && (
        <Avatar className="ml-2 mb-1">
          <AvatarImage src="/user-avatar.png" alt="User" />
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
      )}
    </motion.div>
  );
};
