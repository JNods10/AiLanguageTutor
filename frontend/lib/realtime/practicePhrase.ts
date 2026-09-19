import { apiConfig } from "@/lib/config";

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

export async function playPracticePhrase(
  phrase: string,
  tutorAudio: HTMLAudioElement,
): Promise<void> {
  const blob = await fetchPracticePhraseAudio(phrase);
  const url = URL.createObjectURL(blob);
  const clip = new Audio(url);

  const previousVolume = tutorAudio.volume;
  tutorAudio.volume = 0;

  try {
    await clip.play();
    await new Promise<void>((resolve, reject) => {
      clip.onended = () => resolve();
      clip.onerror = () => reject(new Error("Could not play practice phrase audio."));
    });
  } finally {
    tutorAudio.volume = previousVolume;
    URL.revokeObjectURL(url);
  }
}
