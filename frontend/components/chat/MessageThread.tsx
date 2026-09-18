"use client";

import { useEffect, useRef } from "react";
import { useChat } from "@/lib/context/ChatContext";
import ContentContainer from "@/components/ui/ContentContainer";
import ChatTurnItem from "./ChatTurnItem";
import TypingIndicator from "./TypingIndicator";

export default function MessageThread() {
  const { turns, isTyping } = useChat();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, isTyping]);

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6">
      <ContentContainer className="flex flex-col gap-5">
        {turns.map((turn) => (
          <ChatTurnItem key={turn.message.id} turn={turn} />
        ))}
        {isTyping && <TypingIndicator />}
        <div ref={bottomRef} />
      </ContentContainer>
    </div>
  );
}
