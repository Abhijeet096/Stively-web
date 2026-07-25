"use client";

import { useCallback, useEffect, useState } from "react";

import type { VoiceErrorCode } from "../../types/voice";
import { BrowserVoiceProvider } from "./browser-voice-provider";

export type VoiceStatus = "idle" | "speaking" | "listening" | "error";

/** React-facing wrapper around VoiceProvider - the only thing InterviewSession talks to. Swapping the underlying provider later is a one-line change here. */
export function useVoiceProvider() {
  const [provider] = useState<BrowserVoiceProvider | null>(() =>
    typeof window !== "undefined" ? new BrowserVoiceProvider() : null
  );
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [error, setError] = useState<VoiceErrorCode | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    queueMicrotask(() => setIsSupported(provider?.isSupported() ?? false));
    return () => provider?.stopListening();
  }, [provider]);

  const speak = useCallback(async (text: string) => {
    setStatus("speaking");
    setError(null);
    try {
      await provider?.speak(text);
    } catch {
      // Non-fatal - the question is already shown on screen, the interview can continue without audio.
    } finally {
      setStatus((s) => (s === "speaking" ? "idle" : s));
    }
  }, [provider]);

  const listen = useCallback((onFinalResult: (transcript: string) => void) => {
    setStatus("listening");
    setError(null);
    provider?.startListening(
      (transcript) => {
        setStatus("idle");
        onFinalResult(transcript);
      },
      (code) => {
        setStatus("error");
        setError(code);
      }
    );
  }, [provider]);

  const stopListening = useCallback(() => {
    provider?.stopListening();
    setStatus((s) => (s === "listening" ? "idle" : s));
  }, [provider]);

  const stopSpeaking = useCallback(() => {
    provider?.stopSpeaking();
    setStatus((s) => (s === "speaking" ? "idle" : s));
  }, [provider]);

  return { status, error, isSupported, speak, listen, stopListening, stopSpeaking };
}
