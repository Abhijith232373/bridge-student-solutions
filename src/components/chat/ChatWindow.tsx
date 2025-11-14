import { useEffect, useRef, useState } from "react";
import { ChatHeader } from "./ChatHeader";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import { TypingIndicator } from "./TypingIndicator";
import { useChat } from "@/hooks/useChat";
import { useOnlinePresence } from "@/hooks/useOnlinePresence";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface ChatWindowProps {
  conversationId: string;
  userId: string;
  otherUserId: string;
  otherUserName: string;
  onClose: () => void;
  className?: string;
}

export const ChatWindow = ({
  conversationId,
  userId,
  otherUserId,
  otherUserName,
  onClose,
  className,
}: ChatWindowProps) => {
  const { messages, loading, sendMessage } = useChat(conversationId, userId);
  const { isOnline } = useOnlinePresence(userId);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleTyping = () => {
    setIsTyping(true);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 3000);
  };

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 w-[400px] h-[600px] bg-background border rounded-lg shadow-2xl flex flex-col z-40",
        "animate-slide-in-right sm:max-w-[400px] max-sm:w-[calc(100vw-3rem)] max-sm:h-[calc(100vh-3rem)]",
        className
      )}
    >
      <ChatHeader
        title={otherUserName}
        isOnline={isOnline(otherUserId)}
        onClose={onClose}
      />

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              content={msg.content}
              timestamp={msg.created_at}
              isSent={msg.sender_id === userId}
              isRead={msg.is_read}
            />
          ))
        )}
        {isTyping && <TypingIndicator />}
      </ScrollArea>

      <MessageInput onSend={sendMessage} onTyping={handleTyping} />
    </div>
  );
};
