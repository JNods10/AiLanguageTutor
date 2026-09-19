import { apiConfig } from "@/lib/config";

export function normalizePracticePhrase(text: string): string {
  return text.trim().replace(/\s+/g, " ").toLowerCase();
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { detail?: unknown };
    if (typeof data.detail === "string") {
      return data.detail;
    }
  } catch {
    // ignore
  }
  return `TTS request failed (${response.status})`;
}

export async function fetchPracticePhraseAudio(text: string): Promise<Blob> {
  const response = await fetch(`${apiConfig.baseUrl}/api/tts/phrase`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return response.blob();
}

const inFlightByPhrase = new Map<string, Promise<void>>();

async function playPracticePhraseOnce(
  phrase: string,
  tutorAudio: HTMLAudioElement,
): Promise<void> {
  tutorAudio.volume = 0;

  const blob = await fetchPracticePhraseAudio(phrase);
  const url = URL.createObjectURL(blob);
  const clip = new Audio(url);

  try {
    await clip.play();
    await new Promise<void>((resolve, reject) => {
      clip.onended = () => resolve();
      clip.onerror = () => reject(new Error("Could not play practice phrase audio."));
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function playPracticePhrase(
  phrase: string,
  tutorAudio: HTMLAudioElement,
): Promise<void> {
  const key = normalizePracticePhrase(phrase);
  const existing = inFlightByPhrase.get(key);
  if (existing) {
    return existing;
  }

  const playback = playPracticePhraseOnce(phrase, tutorAudio).finally(() => {
    if (inFlightByPhrase.get(key) === playback) {
      inFlightByPhrase.delete(key);
    }
  });

  inFlightByPhrase.set(key, playback);
  return playback;
}
