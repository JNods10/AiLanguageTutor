"use client";

import { useState } from "react";
import type { ChatTab } from "@/lib/types/chat";
import AppShell from "@/components/shell/AppShell";
import LanguageSidebar from "@/components/sidebar/LanguageSidebar";
import ChatHeader from "@/components/shell/ChatHeader";
import AppProviders from "@/components/providers/AppProviders";
import MessageThread from "./MessageThread";
import ChatInput from "./ChatInput";
import VoicePanel from "./VoicePanel";

function ChatContent() {
  const [activeTab, setActiveTab] = useState<ChatTab>("chat");

  return (
    <AppShell sidebar={<LanguageSidebar />}>
      <ChatHeader activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === "chat" ? (
        <>
          <MessageThread />
          <ChatInput />
        </>
      ) : (
        <VoicePanel />
      )}
    </AppShell>
  );
}

export default function ChatPage() {
  return (
    <AppProviders>
      <ChatContent />
    </AppProviders>
  );
}
