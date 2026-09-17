export type MessageRole = "user" | "tutor";

export type Message = {
  id: string;
  role: MessageRole;
  text: string;
  timestamp: Date;
};

export type Correction = {
  original: string;
  corrected: string;
  explanation: string;
  tags: string[];
};

export type ChatTurn = {
  message: Message;
  correction?: Correction;
};

export type ChatTab = "chat" | "voice";
