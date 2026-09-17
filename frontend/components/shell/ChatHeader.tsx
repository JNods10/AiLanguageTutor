"use client";

import type { ChatTab } from "@/lib/types/chat";
import Button from "@/components/ui/Button";
import LanguageBadge from "@/components/ui/LanguageBadge";
import { ChatIcon, MicIcon } from "@/components/ui/icons";

type ChatHeaderProps = {
  activeTab: ChatTab;
  onTabChange: (tab: ChatTab) => void;
};

const TABS: { id: ChatTab; label: string; icon: React.ReactNode }[] = [
  { id: "chat", label: "Chat", icon: <ChatIcon /> },
  { id: "voice", label: "Voice", icon: <MicIcon /> },
];

export default function ChatHeader({ activeTab, onTabChange }: ChatHeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-border px-6 py-3">
      <nav className="flex items-center gap-1" aria-label="Conversation mode">
        {TABS.map(({ id, label, icon }) => (
          <Button
            key={id}
            variant="tab"
            size="md"
            active={activeTab === id}
            onClick={() => onTabChange(id)}
          >
            {icon}
            {label}
          </Button>
        ))}
      </nav>

      <LanguageBadge />
    </header>
  );
}
