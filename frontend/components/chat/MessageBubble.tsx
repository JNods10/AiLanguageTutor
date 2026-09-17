import type { Message } from "@/lib/types/chat";
import { cn } from "@/lib/utils/cn";
import { formatTime } from "@/lib/utils/format";

type MessageBubbleProps = {
  message: Message;
};

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex flex-col gap-1",
        isUser ? "items-end" : "items-start",
      )}
    >
      <div
        className={cn(
          "max-w-[85%] rounded-[var(--bubble-radius)] px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "bg-surface-muted text-foreground"
            : "border border-border bg-background text-foreground",
        )}
      >
        {message.text}
      </div>
      <time
        dateTime={message.timestamp.toISOString()}
        className="px-1 text-xs text-text-subtle"
      >
        {formatTime(message.timestamp)}
      </time>
    </div>
  );
}
