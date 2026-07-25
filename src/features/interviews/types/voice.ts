/**
 * The seam between the interview session UI and whatever actually turns
 * speech into text and text into speech. The MVP implementation
 * (browser-voice-provider.ts) uses the browser's built-in SpeechRecognition
 * and speechSynthesis - free, zero-latency-to-integrate, but browser-quality.
 * Swapping to OpenAI's Realtime API later means writing one new file that
 * implements this interface; nothing in the session UI or interview engine
 * needs to change.
 */
export type VoiceErrorCode = "no-speech" | "not-allowed" | "network" | "aborted" | "unsupported" | "unknown";

export interface VoiceProvider {
  isSupported(): boolean;
  speak(text: string): Promise<void>;
  stopSpeaking(): void;
  startListening(onFinalResult: (transcript: string) => void, onError: (code: VoiceErrorCode) => void): void;
  stopListening(): void;
}
