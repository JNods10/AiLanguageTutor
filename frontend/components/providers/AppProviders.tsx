"use client";

import { LanguageProvider } from "@/lib/context/LanguageContext";
import { ChatProvider } from "@/lib/context/ChatContext";

export default function AppProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LanguageProvider>
      <ChatProvider>{children}</ChatProvider>
    </LanguageProvider>
  );
}
