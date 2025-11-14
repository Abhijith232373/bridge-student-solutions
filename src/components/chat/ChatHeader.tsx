import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatHeaderProps {
  title: string;
  isOnline?: boolean;
  onClose: () => void;
}

export const ChatHeader = ({ title, isOnline = false, onClose }: ChatHeaderProps) => {
  return (
    <div className="flex items-center justify-between p-4 border-b bg-background">
      <div className="flex flex-col">
        <h3 className="font-semibold text-foreground">{title}</h3>
        {isOnline !== undefined && (
          <div className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-muted-foreground'}`} />
            <span className="text-xs text-muted-foreground">{isOnline ? 'Online' : 'Offline'}</span>
          </div>
        )}
      </div>
      <Button variant="ghost" size="icon" onClick={onClose}>
        <X className="h-5 w-5" />
      </Button>
    </div>
  );
};
