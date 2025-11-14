import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Check, CheckCheck } from "lucide-react";

interface MessageBubbleProps {
  content: string;
  timestamp: string;
  isSent: boolean;
  isRead?: boolean;
  senderName?: string;
}

export const MessageBubble = ({
  content,
  timestamp,
  isSent,
  isRead = false,
  senderName
}: MessageBubbleProps) => {
  return (
    <div className={cn("flex flex-col gap-1 mb-2 animate-fade-in", isSent ? "items-end" : "items-start")}>
      {!isSent && senderName && (
        <span className="text-xs text-muted-foreground px-2">{senderName}</span>
      )}
      <div
        className={cn(
          "px-4 py-2 rounded-2xl max-w-[75%] break-words",
          isSent
            ? "bg-primary text-primary-foreground rounded-br-md ml-auto"
            : "bg-muted text-foreground rounded-bl-md mr-auto"
        )}
      >
        <p className="text-sm whitespace-pre-wrap">{content}</p>
        <div className={cn("flex items-center gap-1 mt-1", isSent ? "justify-end" : "justify-start")}>
          <span className={cn("text-xs", isSent ? "text-primary-foreground/70" : "text-muted-foreground")}>
            {format(new Date(timestamp), "p")}
          </span>
          {isSent && (
            <span className="text-primary-foreground/70">
              {isRead ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
