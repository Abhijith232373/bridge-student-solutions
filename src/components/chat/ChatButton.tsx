import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChatButtonProps {
  onClick: () => void;
  unreadCount?: number;
  className?: string;
}

export const ChatButton = ({ onClick, unreadCount = 0, className }: ChatButtonProps) => {
  return (
    <Button
      onClick={onClick}
      size="icon"
      className={cn(
        "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50",
        "bg-primary hover:bg-primary/90 text-primary-foreground",
        "transition-all duration-300 hover:scale-110",
        className
      )}
    >
      <MessageCircle className="h-6 w-6" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-destructive text-destructive-foreground text-xs font-bold flex items-center justify-center animate-pulse">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Button>
  );
};
