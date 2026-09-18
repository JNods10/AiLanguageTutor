"use client";

import { LanguageProvider } from "@/lib/context/LanguageContext";
import { LevelProvider } from "@/lib/context/LevelContext";
import { ChatProvider } from "@/lib/context/ChatContext";

export default function AppProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LanguageProvider>
      <LevelProvider>
        <ChatProvider>{children}</ChatProvider>
      </LevelProvider>
    </LanguageProvider>
  );
}
