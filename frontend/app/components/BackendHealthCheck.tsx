"use client";

import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type Status = "idle" | "loading" | "success" | "error";

export default function BackendHealthCheck() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function checkConnection() {
    setStatus("loading");
    setMessage(null);

    try {
      const response = await fetch(`${API_URL}/api/health`);

      if (!response.ok) {
        throw new Error(`Backend responded with ${response.status}`);
      }

      const data = (await response.json()) as { status?: string };
      setStatus("success");
      setMessage(data.status ?? JSON.stringify(data));
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error ? error.message : "Could not reach the backend",
      );
    }
  }

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-4">
      <button
        type="button"
        onClick={checkConnection}
        disabled={status === "loading"}
        className="w-full border-2 border-black bg-black px-6 py-3 text-sm font-medium tracking-wide text-white transition-colors hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
      >
        {status === "loading" ? "Checking…" : "Test backend connection"}
      </button>

      {message && (
        <output
          aria-live="polite"
          className={`w-full border px-4 py-3 text-sm ${
            status === "success"
              ? "border-black bg-white text-black"
              : "border-black bg-black text-white"
          }`}
        >
          {status === "success" ? (
            <>
              Connected — backend status:{" "}
              <span className="font-mono font-semibold">{message}</span>
            </>
          ) : (
            <>Connection failed: {message}</>
          )}
        </output>
      )}
    </div>
  );
}
