"use client";

import { useState, useRef, type KeyboardEvent } from "react";
import { useLanguage } from "@/lib/context/LanguageContext";
import { useChat } from "@/lib/context/ChatContext";
import { CHAT_INPUT_HINT } from "@/lib/constants/app";
import ContentContainer from "@/components/ui/ContentContainer";
import Button from "@/components/ui/Button";
import HelpModal from "@/components/ui/HelpModal";
import { SendIcon } from "@/components/ui/icons";

export default function ChatInput() {
  const { language } = useLanguage();
  const { sendMessage, isTyping } = useChat();
  const [text, setText] = useState("");
  const [helpOpen, setHelpOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const canSend = text.trim().length > 0 && !isTyping;

  const handleSend = async () => {
    if (!canSend) return;
    const trimmed = text.trim();
    setText("");
    await sendMessage(trimmed);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  return (
    <>
      <div className="relative border-t border-border px-6 py-4">
        <ContentContainer>
          <div className="relative flex items-end rounded-xl border border-border bg-background focus-within:border-border-strong">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Write in ${language.name}...`}
              rows={1}
              disabled={isTyping}
              className="max-h-32 min-h-[48px] flex-1 resize-none bg-transparent px-4 py-3 text-sm outline-none placeholder:text-text-subtle disabled:opacity-60"
            />
            <Button
              variant="primary"
              size="icon"
              aria-label="Send message"
              className="mb-2 mr-2 shrink-0 rounded-lg"
              disabled={!canSend}
              onClick={() => void handleSend()}
            >
              <SendIcon />
            </Button>
          </div>
          <p className="mt-2 text-center text-xs text-text-subtle">
            {CHAT_INPUT_HINT}
          </p>
        </ContentContainer>
      </div>

      <Button
        variant="secondary"
        size="icon-lg"
        aria-label="Help"
        onClick={() => setHelpOpen(true)}
        className="fixed bottom-6 right-6 rounded-full shadow-sm"
      >
        ?
      </Button>

      <HelpModal isOpen={helpOpen} onClose={() => setHelpOpen(false)} />
    </>
  );
}
