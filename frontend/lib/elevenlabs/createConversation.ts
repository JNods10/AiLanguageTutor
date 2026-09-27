import { apiConfig } from "@/lib/config";

import type {
  AgentSessionParams,
  CreateAgentConversationResponse,
} from "./types";

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { detail?: unknown };
    if (typeof data.detail === "string") {
      return data.detail;
    }
  } catch {
    // Response body was not JSON.
  }
  return `Request failed (${response.status})`;
}

export async function createAgentConversation(
  params: AgentSessionParams,
): Promise<CreateAgentConversationResponse> {
  const response = await fetch(`${apiConfig.baseUrl}/api/elevenlabs/conversation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      targetLanguage: params.targetLanguage,
      explanationLanguage: params.explanationLanguage ?? "en",
      level: params.level ?? "A1",
      scenario: params.scenario ?? null,
    }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return response.json() as Promise<CreateAgentConversationResponse>;
}
