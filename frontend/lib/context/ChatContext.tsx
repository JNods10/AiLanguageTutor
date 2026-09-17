"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
} from "react";
import type { ChatTurn, Message } from "@/lib/types/chat";
import { useLanguage } from "@/lib/context/LanguageContext";
import {
  getSeedConversation,
  simulateTutorReply,
} from "@/lib/mock/tutor";
import { createId } from "@/lib/utils/id";

type ChatState = {
  turns: ChatTurn[];
  isTyping: boolean;
};

type ChatAction =
  | { type: "RESET"; turns: ChatTurn[] }
  | { type: "ADD_TURN"; turn: ChatTurn }
  | { type: "SET_TYPING"; isTyping: boolean };

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "RESET":
      return { turns: action.turns, isTyping: false };
    case "ADD_TURN":
      return { ...state, turns: [...state.turns, action.turn] };
    case "SET_TYPING":
      return { ...state, isTyping: action.isTyping };
    default:
      return state;
  }
}

function createUserMessage(text: string): Message {
  return {
    id: createId(),
    role: "user",
    text,
    timestamp: new Date(),
  };
}

type ChatContextValue = {
  turns: ChatTurn[];
  isTyping: boolean;
  sendMessage: (text: string) => Promise<void>;
};

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { language } = useLanguage();
  const [state, dispatch] = useReducer(chatReducer, {
    turns: [],
    isTyping: false,
  });
  const isTypingRef = useRef(false);

  useEffect(() => {
    dispatch({ type: "RESET", turns: getSeedConversation(language) });
  }, [language]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isTypingRef.current) return;

      isTypingRef.current = true;
      dispatch({ type: "ADD_TURN", turn: { message: createUserMessage(trimmed) } });
      dispatch({ type: "SET_TYPING", isTyping: true });

      try {
        const reply = await simulateTutorReply(trimmed, language);
        dispatch({ type: "ADD_TURN", turn: reply });
      } finally {
        isTypingRef.current = false;
        dispatch({ type: "SET_TYPING", isTyping: false });
      }
    },
    [language],
  );

  return (
    <ChatContext.Provider
      value={{ turns: state.turns, isTyping: state.isTyping, sendMessage }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error("useChat must be used within ChatProvider");
  }
  return ctx;
}
