"use client";

import type { VoiceErrorCode, VoiceProvider } from "../../types/voice";

// The Web Speech API still isn't in TypeScript's DOM lib - minimal shape for what we actually use.
interface SpeechRecognitionResultLike {
  isFinal: boolean;
  [index: number]: { transcript: string };
}
interface SpeechRecognitionEventLike extends Event {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}
interface SpeechRecognitionErrorEventLike extends Event {
  error: string;
}
interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
}
interface SpeechRecognitionConstructorLike {
  new (): SpeechRecognitionLike;
}

function getSpeechRecognitionCtor(): SpeechRecognitionConstructorLike | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructorLike;
    webkitSpeechRecognition?: SpeechRecognitionConstructorLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function mapRecognitionError(error: string): VoiceErrorCode {
  if (error === "no-speech") return "no-speech";
  if (error === "not-allowed" || error === "service-not-allowed") return "not-allowed";
  if (error === "network") return "network";
  if (error === "aborted") return "aborted";
  return "unknown";
}

// How long to wait after the candidate stops talking before treating the
// answer as done - the browser's own built-in endpointing (continuous:
// false) cuts off after well under a second of silence, which reads as the
// mic cutting a candidate off mid-thought the moment they pause to think.
// Running in continuous mode and owning this timer ourselves gives a real,
// generous thinking pause instead.
const SILENCE_TIMEOUT_MS = 3000;
// If nothing is heard at all before this, surface it as "no-speech" rather
// than listening forever.
const INITIAL_SILENCE_TIMEOUT_MS = 15000;
// Chrome has a long-standing bug where speechSynthesis silently pauses an
// utterance after ~15s of the tab being in the background/idle and never
// fires onend - calling resume() periodically is the standard workaround.
const SYNTHESIS_RESUME_INTERVAL_MS = 8000;

/** MVP voice implementation - browser SpeechRecognition (STT) + speechSynthesis (TTS). Client-only; never imported from a Server Component. */
// .abort()/.stop() tear down the browser's internal speech-recognition
// session asynchronously - starting a new instance immediately after,
// before that teardown actually finishes, can throw synchronously or fail
// silently with an "aborted"/"unknown" error, especially when retrying
// right after a stalled prior instance that never cleanly reached onend
// (exactly the "Still there? Tap to continue" recovery path). This delay
// gives the browser time to actually release the previous session first.
const RESTART_DELAY_MS = 150;

export class BrowserVoiceProvider implements VoiceProvider {
  private recognition: SpeechRecognitionLike | null = null;
  private startGeneration = 0;

  isSupported(): boolean {
    return getSpeechRecognitionCtor() !== null && typeof window !== "undefined" && "speechSynthesis" in window;
  }

  speak(text: string): Promise<void> {
    return new Promise((resolve) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        resolve();
        return;
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      utterance.pitch = 1;

      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        clearInterval(resumeNudge);
        clearTimeout(hardTimeout);
        resolve();
      };

      // A stuck/silently-failed utterance must never hang the interview
      // forever - fall back to just moving on once enough time has passed
      // for the text to have plausibly finished (~150ms/word, generous
      // floor and ceiling either side).
      const estimatedMs = Math.min(Math.max(text.split(/\s+/).length * 220, 4000), 20000) + 4000;
      const hardTimeout = setTimeout(finish, estimatedMs);
      const resumeNudge = setInterval(() => {
        if (window.speechSynthesis.speaking) window.speechSynthesis.resume();
      }, SYNTHESIS_RESUME_INTERVAL_MS);

      utterance.onend = finish;
      utterance.onerror = finish;
      window.speechSynthesis.speak(utterance);
    });
  }

  stopSpeaking(): void {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }

  startListening(onFinalResult: (transcript: string) => void, onError: (code: VoiceErrorCode) => void): void {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      onError("unsupported");
      return;
    }

    this.stopListening(); // bumps startGeneration, invalidating any pending delayed start below
    const generation = this.startGeneration;

    setTimeout(() => {
      // Superseded by a newer startListening()/stopListening() call while
      // this one was waiting out RESTART_DELAY_MS - don't start a
      // recognition instance nobody wants anymore.
      if (generation !== this.startGeneration) return;

      const recognition = new Ctor();
      // Continuous + interim results, with our own silence timer below,
      // instead of letting the browser's own (much shorter) endpointing
      // decide when the candidate is "done" - see SILENCE_TIMEOUT_MS.
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      let finalTranscript = "";
      let silenceTimer: ReturnType<typeof setTimeout> | null = null;
      let settled = false;

      const clearSilenceTimer = () => {
        if (silenceTimer) clearTimeout(silenceTimer);
        silenceTimer = null;
      };

      const resetSilenceTimer = () => {
        clearSilenceTimer();
        silenceTimer = setTimeout(() => {
          try {
            recognition.stop();
          } catch {
            // already stopped - onend below still fires
          }
        }, SILENCE_TIMEOUT_MS);
      };

      recognition.onresult = (event) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) finalTranscript += `${result[0].transcript} `;
        }
        resetSilenceTimer();
      };

      recognition.onerror = (event) => {
        if (settled) return;
        settled = true;
        clearSilenceTimer();
        onError(mapRecognitionError(event.error));
      };

      recognition.onend = () => {
        clearSilenceTimer();
        this.recognition = null;
        if (settled) return;
        settled = true;
        const transcript = finalTranscript.trim();
        if (transcript) {
          onFinalResult(transcript);
        } else {
          onError("no-speech");
        }
      };

      this.recognition = recognition;
      try {
        recognition.start();
      } catch {
        this.recognition = null;
        onError("unknown");
        return;
      }
      silenceTimer = setTimeout(() => {
        try {
          recognition.stop();
        } catch {
          // already stopped
        }
      }, INITIAL_SILENCE_TIMEOUT_MS);
    }, RESTART_DELAY_MS);
  }

  stopListening(): void {
    // Invalidates any pending delayed start from startListening() too -
    // an explicit stop should never be followed by a start nobody asked
    // for anymore once its RESTART_DELAY_MS timer fires.
    this.startGeneration += 1;
    this.recognition?.abort();
    this.recognition = null;
  }
}
