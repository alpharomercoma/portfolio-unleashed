import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SamplePrompts } from './SamplePrompts';

interface ChatInputProps {
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  onSamplePromptClick: (prompt: string) => Promise<void>;
  showSamplePrompts: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  onSamplePromptClick,
  showSamplePrompts
}) => {
  return (
    <div className="w-full space-y-4">
      <SamplePrompts onPromptClick={onSamplePromptClick} visible={showSamplePrompts} />
      <form onSubmit={handleSubmit} className="flex w-full space-x-2 items-center">
        <div className="relative flex-grow">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Type your message..."
            className="pr-10 py-6 text-sm"
          />
          <Button
            type="submit"
            disabled={isLoading}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 rounded-full w-8 h-8 p-0 flex items-center justify-center"
          >
            {isLoading ? (
              <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-send"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
