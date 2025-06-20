import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: string;
  content: string;
  user?: {
    image: string;
    name: string;
  };
}

interface ChatProps {
  onClose: () => void;
  messages: Message[];
  onSendMessage: (message: string) => void;
  isAiResponding: boolean;
}

export function Chat({ onClose, messages, onSendMessage, isAiResponding }: ChatProps) {
  const [inputMessage, setInputMessage] = useState('');
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    onSendMessage(inputMessage);
    setInputMessage('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col border rounded-md bg-white p-4">
      <div className="relative">
        <div className="flex items-center justify-between mb-4 sticky top-0 left-0 right-0">
          <h3 className="font-semibold">Chat</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex flex-col justify-between">
        <div ref={messagesContainerRef} className="overflow-y-auto space-y-4 h-[35rem]">
          {messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                "flex items-start gap-2",
                message.role === 'user' ? "justify-end" : "justify-start"
              )}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xs font-medium">AI</span>
                </div>
              )}
              <div
                className={cn(
                  "rounded-lg p-3 max-w-[80%]",
                  message.role === 'user'
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                )}
              >
                <p className="text-sm">{message.content}</p>
              </div>
              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center overflow-hidden">
                  {message.user?.image ? (
                    <img 
                      src={message.user.image} 
                      alt={message.user.name || 'User'} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs font-medium text-primary-foreground">You</span>
                  )}
                </div>
              )}
            </div>
          ))}
          {isAiResponding && (
            <div className="flex items-start gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-medium">AI</span>
              </div>
              <div className="rounded-lg p-3 bg-muted">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-2 mt-4">
          <Input 
            placeholder="Type your message..." 
            className="flex-1"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isAiResponding}
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
} 