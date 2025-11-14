export const TypingIndicator = () => {
  return (
    <div className="flex items-center gap-1 px-4 py-2 bg-muted rounded-2xl rounded-bl-md w-fit">
      <div className="flex gap-1">
        <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
        <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
        <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce"></span>
      </div>
    </div>
  );
};
