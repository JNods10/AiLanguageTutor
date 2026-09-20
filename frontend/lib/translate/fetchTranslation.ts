import { apiConfig } from "@/lib/config";

export type TranslateParams = {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
};

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { detail?: unknown };
    if (typeof data.detail === "string") {
      return data.detail;
    }
  } catch {
    // ignore
  }
  return `Translation failed (${response.status})`;
}

export async function fetchTranslation(
  params: TranslateParams,
): Promise<string> {
  const response = await fetch(`${apiConfig.baseUrl}/api/translate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: params.text,
      source_language: params.sourceLanguage,
      target_language: params.targetLanguage,
    }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const data = (await response.json()) as { translation?: string };
  const translation = data.translation?.trim();
  if (!translation) {
    throw new Error("Empty translation response.");
  }
  return translation;
}
