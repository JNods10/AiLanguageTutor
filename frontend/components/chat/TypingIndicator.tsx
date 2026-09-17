export default function TypingIndicator() {
  return (
    <div className="flex items-start">
      <div className="flex gap-1 rounded-[var(--bubble-radius)] border border-border bg-background px-4 py-3">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="h-2 w-2 animate-bounce rounded-full bg-text-subtle"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
