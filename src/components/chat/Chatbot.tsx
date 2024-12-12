'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChat } from 'ai/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { ChatInput } from './ChatInput';
import { ChatMessage } from './ChatMessage';
import { SkeletonLoader } from './SkeletonLoader';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [showSamplePrompts, setShowSamplePrompts] = useState(true);
  const { messages, input, handleInputChange, handleSubmit, isLoading, append } = useChat({
    api: '/api/chat',
    initialMessages: [
      {
        id: 'welcome',
        role: 'assistant',
        content: "Hi! I'm Yuka, Mr. Coma's AI assistant. Ask me anything about his projects, skills, or experience—I'm here to help!"
      }
    ]
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (window.innerWidth < 640) return;
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (messages.length > 1) {
      setShowSamplePrompts(false);
    }
  }, [messages]);

  const handleSamplePromptClick = async (prompt: string) => {
    setShowSamplePrompts(false);
    await append({
      content: prompt,
      role: 'user',
    });
  };

  const chatVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20
      }
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      y: 20,
      transition: {
        duration: 0.2
      }
    }
  };

  const buttonVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20
      }
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      transition: {
        duration: 0.2
      }
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <AnimatePresence mode="wait">
        {isOpen ? (
          <motion.div
            key="chat"
            variants={chatVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="w-full sm:w-96 h-[500px] max-h-[80vh]"
          >
            <Card className="flex flex-col h-full shadow-lg border-2 border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 border-b">
                <div className="flex items-center space-x-2">
                  <Avatar>
                    <AvatarImage src="/chat/yuka.png" alt="Yuka" />
                    <AvatarFallback>Z</AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-lg font-semibold">Yuka</h2>
                    <p className="text-sm text-muted-foreground">AI Assistant</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                </Button>
              </CardHeader>
              <CardContent className="flex-grow p-4 overflow-hidden">
                <ScrollArea className="h-full pr-4">
                  {messages.map((message) => (
                    <ChatMessage key={message.id} role={message.role} content={message.content} />
                  ))}
                  {isLoading && <SkeletonLoader />}
                  <div ref={messagesEndRef} />
                </ScrollArea>
              </CardContent>
              <CardFooter className="p-4 border-t">
                <ChatInput
                  input={input}
                  handleInputChange={handleInputChange}
                  handleSubmit={handleSubmit}
                  isLoading={isLoading}
                  onSamplePromptClick={handleSamplePromptClick}
                  showSamplePrompts={showSamplePrompts}
                />
              </CardFooter>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="button"
            variants={buttonVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <Button
              onClick={() => setIsOpen(true)}
              className="rounded-full w-14 h-14 flex items-center justify-center shadow-lg bg-primary hover:bg-primary/90"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-circle"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z" /></svg>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
