import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Conversation {
  id: string;
  student_id: string;
  student_name: string;
  last_message: string | null;
  last_message_at: string;
  unread_by_admin: number;
}

interface ConversationListProps {
  conversations: Conversation[];
  onSelectConversation: (conversationId: string, studentName: string) => void;
  selectedId?: string;
}

export const ConversationList = ({
  conversations,
  onSelectConversation,
  selectedId
}: ConversationListProps) => {
  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-1">
        {conversations.map((conv) => (
          <button
            key={conv.id}
            onClick={() => onSelectConversation(conv.id, conv.student_name)}
            className={cn(
              "w-full p-3 rounded-lg text-left transition-colors hover:bg-accent",
              selectedId === conv.id && "bg-accent"
            )}
          >
            <div className="flex justify-between items-start mb-1">
              <span className="font-semibold text-sm text-foreground">{conv.student_name}</span>
              {conv.unread_by_admin > 0 && (
                <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                  {conv.unread_by_admin}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate mb-1">
              {conv.last_message || "No messages yet"}
            </p>
            <span className="text-xs text-muted-foreground">
              {conv.last_message_at && formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true })}
            </span>
          </button>
        ))}
        {conversations.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>No conversations yet</p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
};
