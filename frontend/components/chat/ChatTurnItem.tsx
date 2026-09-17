import type { ChatTurn } from "@/lib/types/chat";
import MessageBubble from "./MessageBubble";
import CorrectionCard from "./CorrectionCard";

type ChatTurnItemProps = {
  turn: ChatTurn;
};

export default function ChatTurnItem({ turn }: ChatTurnItemProps) {
  return (
    <div>
      <MessageBubble message={turn.message} />
      {turn.correction && turn.message.role === "tutor" && (
        <CorrectionCard correction={turn.correction} />
      )}
    </div>
  );
}
