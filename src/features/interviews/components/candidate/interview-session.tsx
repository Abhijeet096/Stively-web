"use client";

import * as React from "react";
import { Loader2, Mic, Volume2, AlertTriangle, CheckCircle2 } from "lucide-react";

import { Logo } from "@/components/shared/logo";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { VoiceErrorCode } from "../../types/voice";
import { useVoiceProvider } from "../../lib/voice/use-voice-provider";
import { submitInterviewTurn, getSessionInterview } from "../../actions/session-actions";
import { OPENING_SCRIPT, CLOSING_SCRIPT } from "../../lib/scripts";

type Phase = "loading" | "speaking" | "listening" | "thinking" | "done" | "error" | "unsupported";

export interface InterviewSessionProps {
  interviewId: string;
}

function isBrowserVoiceSupported(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown };
  return (Boolean(w.SpeechRecognition) || Boolean(w.webkitSpeechRecognition)) && "speechSynthesis" in window;
}

function voiceErrorMessage(code: VoiceErrorCode): string {
  switch (code) {
    case "not-allowed":
      return "Microphone access was blocked. Allow microphone access in your browser and try again.";
    case "no-speech":
      return "We didn't catch that. Try answering again.";
    case "network":
      return "A network issue interrupted listening. Check your connection and try again.";
    case "unsupported":
      return "Voice input isn't supported in this browser.";
    default:
      return "Something interrupted listening. Try again.";
  }
}

/**
 * The core interview conversation loop - one continuously running state
 * machine per session: speak the AI's message, listen for the candidate's
 * spoken answer, submit it to the Interview Engine, repeat until the engine
 * reports done. Recovers from a page refresh mid-interview by resuming from
 * whatever the last persisted Response row actually is, never restarting.
 */
function InterviewSession({ interviewId }: InterviewSessionProps) {
  const voice = useVoiceProvider();
  const [phase, setPhase] = React.useState<Phase>("loading");
  const [displayMessage, setDisplayMessage] = React.useState("");
  const [errorMessage, setErrorMessage] = React.useState<string | undefined>();
  const [online, setOnline] = React.useState(true);
  const bootstrapped = React.useRef(false);
  const [pendingQuestion, setPendingQuestion] = React.useState<string | null>(null);
  const [showRecovery, setShowRecovery] = React.useState(false);
  const listenForAnswerRef = React.useRef<(question: string) => void>(() => {});

  // Browser speech APIs occasionally get stuck silently (a known Chrome
  // speechSynthesis quirk, or a mic that never restarts) with no error
  // event to react to - after a stretch with no progress, offer a manual
  // way to continue instead of leaving the candidate looking at a frozen
  // screen with no recourse but a refresh.
  React.useEffect(() => {
    queueMicrotask(() => setShowRecovery(false));
    if (phase !== "speaking" && phase !== "listening") return;
    const timer = setTimeout(() => setShowRecovery(true), 20000);
    return () => clearTimeout(timer);
  }, [phase]);

  React.useEffect(() => {
    queueMicrotask(() => setOnline(navigator.onLine));
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  const listenForAnswer = React.useCallback(
    (question: string) => {
      setPendingQuestion(question);
      setPhase("listening");
      voice.listen(async (answer) => {
        setPendingQuestion(null);
        setPhase("thinking");
        const result = await submitInterviewTurn(interviewId, answer);
        if (!result.success) {
          setErrorMessage(result.error);
          setPhase("error");
          return;
        }
        if (result.done) {
          setPhase("speaking");
          setDisplayMessage(CLOSING_SCRIPT);
          await voice.speak(CLOSING_SCRIPT);
          setPhase("done");
          return;
        }
        const message = result.message ?? "";
        setPhase("speaking");
        setDisplayMessage(message);
        await voice.speak(message);
        listenForAnswerRef.current(message);
      });
    },
    [interviewId, voice]
  );

  React.useEffect(() => {
    listenForAnswerRef.current = listenForAnswer;
  }, [listenForAnswer]);

  React.useEffect(() => {
    if (voice.status === "error" && voice.error) {
      const message = voiceErrorMessage(voice.error);
      queueMicrotask(() => {
        setErrorMessage(message);
        setPhase("error");
      });
    }
  }, [voice.status, voice.error]);

  React.useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;

    if (!isBrowserVoiceSupported()) {
      queueMicrotask(() => setPhase("unsupported"));
      return;
    }

    (async () => {
      const session = await getSessionInterview(interviewId);
      if (!session) {
        setErrorMessage("We couldn't load your interview. Please use your original interview link again.");
        setPhase("error");
        return;
      }
      if (session.status === "COMPLETED") {
        setDisplayMessage(CLOSING_SCRIPT);
        setPhase("done");
        return;
      }

      const last = session.responses[session.responses.length - 1];

      // No question asked yet - the very start of the interview.
      if (!last) {
        setPhase("speaking");
        setDisplayMessage(OPENING_SCRIPT);
        await voice.speak(OPENING_SCRIPT);
        setPhase("thinking");
        const result = await submitInterviewTurn(interviewId);
        if (!result.success) {
          setErrorMessage(result.error);
          setPhase("error");
          return;
        }
        const message = result.message ?? "";
        setPhase("speaking");
        setDisplayMessage(message);
        await voice.speak(message);
        listenForAnswer(message);
        return;
      }

      // A question was already asked but never answered - resume mid-question.
      if (last.answer === null) {
        setPhase("speaking");
        setDisplayMessage(last.question);
        await voice.speak(last.question);
        listenForAnswer(last.question);
        return;
      }

      // Answered, but the next turn was never generated - resume by advancing.
      setPhase("thinking");
      const result = await submitInterviewTurn(interviewId);
      if (!result.success) {
        setErrorMessage(result.error);
        setPhase("error");
        return;
      }
      if (result.done) {
        setPhase("speaking");
        setDisplayMessage(CLOSING_SCRIPT);
        await voice.speak(CLOSING_SCRIPT);
        setPhase("done");
        return;
      }
      const message = result.message ?? "";
      setPhase("speaking");
      setDisplayMessage(message);
      await voice.speak(message);
      listenForAnswer(message);
    })();
  }, [interviewId, listenForAnswer, voice]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-4 py-12">
      <Logo />

      {phase === "unsupported" && (
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-3 text-center">
            <AlertTriangle className="text-destructive size-8" aria-hidden="true" />
            <h1 className="font-display text-lg font-semibold">Your browser isn&apos;t supported</h1>
            <p className="text-muted-foreground text-sm text-pretty">
              This interview needs voice support. Please reopen your interview link in a recent version of Chrome or
              Edge.
            </p>
          </CardContent>
        </Card>
      )}

      {phase === "done" && (
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-3 text-center">
            <CheckCircle2 className="text-success size-8" aria-hidden="true" />
            <p className="text-foreground text-base text-pretty">{displayMessage}</p>
          </CardContent>
        </Card>
      )}

      {phase === "error" && (
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-3 text-center">
            <AlertTriangle className="text-destructive size-8" aria-hidden="true" />
            <p className="text-foreground text-sm text-pretty">{errorMessage ?? "Something went wrong."}</p>
            {pendingQuestion && <Button onClick={() => listenForAnswer(pendingQuestion)}>Try again</Button>}
          </CardContent>
        </Card>
      )}

      {(phase === "loading" || phase === "thinking" || phase === "speaking" || phase === "listening") && (
        <div className="flex w-full max-w-lg flex-col items-center gap-6">
          <div
            className={
              phase === "listening"
                ? "bg-primary/10 text-primary flex size-20 items-center justify-center rounded-full"
                : phase === "speaking"
                  ? "bg-primary text-primary-foreground flex size-20 items-center justify-center rounded-full"
                  : "bg-muted text-muted-foreground flex size-20 items-center justify-center rounded-full"
            }
          >
            {phase === "listening" && <Mic className="size-8" aria-hidden="true" />}
            {phase === "speaking" && <Volume2 className="size-8" aria-hidden="true" />}
            {(phase === "loading" || phase === "thinking") && (
              <Loader2 className="size-8 animate-spin" aria-hidden="true" />
            )}
          </div>

          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            {phase === "listening" ? "Listening..." : phase === "speaking" ? "Speaking" : "One moment..."}
          </p>

          {displayMessage && (
            <Card className="w-full">
              <CardContent>
                <p className="text-foreground text-center text-base text-pretty">{displayMessage}</p>
              </CardContent>
            </Card>
          )}

          {!online && <p className="text-destructive text-center text-sm">You&apos;re offline - reconnect to continue.</p>}

          {showRecovery && (
            <div className="flex flex-col items-center gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  voice.stopSpeaking();
                  voice.stopListening();
                  listenForAnswer(displayMessage);
                }}
              >
                Still there? Tap to continue
              </Button>
              <p className="text-muted-foreground text-center text-xs">
                If this keeps happening, refreshing the page will resume exactly where you left off.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export { InterviewSession };
