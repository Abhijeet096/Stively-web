"use client";

import * as React from "react";
import { Loader2, Mic, Volume2, AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";

import { Logo } from "@/components/shared/logo";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { VoiceErrorCode } from "../../types/voice";
import { useVoiceProvider } from "../../lib/voice/use-voice-provider";
import { useIntegrityGuard, type IntegrityViolationOutcome } from "../../lib/use-integrity-guard";
import { submitInterviewTurn, getSessionInterview } from "../../actions/session-actions";
import { uploadInterviewRecording, logRecordingUnavailable } from "../../actions/integrity-actions";
import { OPENING_SCRIPT, CLOSING_SCRIPT } from "../../lib/scripts";
import { IntegrityWarningModal } from "./integrity-warning-modal";

type Phase = "loading" | "speaking" | "listening" | "thinking" | "done" | "error" | "unsupported" | "terminated";

const RECORDING_MIME_TYPE_CANDIDATES = ["video/webm;codecs=vp8", "video/webm"];
// Safety cap: stops recording early rather than let an unusually long
// custom-duration interview silently exceed the server action body-size
// limit configured in next.config.ts.
const MAX_RECORDING_MS = 35 * 60 * 1000;

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
  const [violationWarning, setViolationWarning] = React.useState<{ count: number } | null>(null);

  const mediaStreamRef = React.useRef<MediaStream | null>(null);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const recordingChunksRef = React.useRef<Blob[]>([]);
  const recordingFinalizedRef = React.useRef(false);
  const recordingStopTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Recording keeps rolling through a warning - only stops on actual
  // termination or normal completion, since a candidate scrambling to
  // switch back mid-warning is exactly what should stay on tape.
  const finalizeRecording = React.useCallback(async () => {
    if (recordingFinalizedRef.current) return;
    recordingFinalizedRef.current = true;

    if (recordingStopTimerRef.current) clearTimeout(recordingStopTimerRef.current);

    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      return;
    }

    await new Promise<void>((resolve) => {
      recorder.addEventListener("stop", () => resolve(), { once: true });
      recorder.stop();
    });
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());

    const blob = new Blob(recordingChunksRef.current, { type: "video/webm" });
    if (blob.size === 0) return;

    try {
      const formData = new FormData();
      formData.set("file", blob, `interview-${interviewId}.webm`);
      await uploadInterviewRecording(interviewId, formData);
    } catch (error) {
      console.error("Recording upload failed:", error);
    }
  }, [interviewId]);

  const startRecording = React.useCallback(async () => {
    try {
      // Video only, deliberately no audio track. SpeechRecognition needs
      // exclusive-ish access to the mic for the entire interview - the
      // landing page's own permission check grabs and immediately releases
      // audio+video (see interview-landing.tsx), which never conflicts,
      // but keeping an audio track open here via MediaRecorder for the
      // whole session competed with SpeechRecognition for the mic and
      // caused it to fail with an "aborted" error on every listen attempt.
      // The transcript already has everything said in text; video-only
      // keeps the recording's core purpose (visual proof someone real is
      // present and attentive) without that conflict.
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      });
      mediaStreamRef.current = stream;

      const mimeType = RECORDING_MIME_TYPE_CANDIDATES.find((t) => MediaRecorder.isTypeSupported(t));
      const recorder = new MediaRecorder(stream, {
        ...(mimeType ? { mimeType } : {}),
        videoBitsPerSecond: 200_000,
      });
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) recordingChunksRef.current.push(event.data);
      };
      recorder.start(5000);
      mediaRecorderRef.current = recorder;

      recordingStopTimerRef.current = setTimeout(() => {
        finalizeRecording();
      }, MAX_RECORDING_MS);
    } catch (error) {
      // Non-blocking - the interview proceeds unrecorded. Logged so the
      // recruiter report can show why no recording exists for this candidate.
      logRecordingUnavailable(interviewId, error instanceof Error ? error.message : "unknown").catch(() => {});
    }
  }, [interviewId, finalizeRecording]);

  const integrityEnabled =
    phase !== "loading" && phase !== "unsupported" && phase !== "error" && phase !== "done" && phase !== "terminated";

  const handleViolation = React.useCallback(
    (outcome: IntegrityViolationOutcome) => {
      voice.stopSpeaking();
      voice.stopListening();

      if (outcome.terminated) {
        finalizeRecording();
        setViolationWarning(null);
        setPhase("terminated");
        return;
      }

      setViolationWarning({ count: outcome.violationCount });
    },
    [voice, finalizeRecording]
  );

  const integrityGuard = useIntegrityGuard({
    interviewId,
    enabled: integrityEnabled,
    onViolation: handleViolation,
  });

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
          finalizeRecording();
          return;
        }
        const message = result.message ?? "";
        setPhase("speaking");
        setDisplayMessage(message);
        await voice.speak(message);
        listenForAnswerRef.current(message);
      });
    },
    [interviewId, voice, finalizeRecording]
  );

  React.useEffect(() => {
    listenForAnswerRef.current = listenForAnswer;
  }, [listenForAnswer]);

  function handleResumeFromWarning() {
    setViolationWarning(null);
    integrityGuard.requestFullscreen();
    const question = pendingQuestion ?? displayMessage;
    if (question) listenForAnswer(question);
  }

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

      // A genuinely active session - arm fullscreen (fallback in case the
      // landing page's own request didn't stick) and start the webcam
      // recording before anything else happens.
      integrityGuard.requestFullscreen();
      startRecording();

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
        finalizeRecording();
        return;
      }
      const message = result.message ?? "";
      setPhase("speaking");
      setDisplayMessage(message);
      await voice.speak(message);
      listenForAnswer(message);
    })();
  }, [interviewId, listenForAnswer, voice, integrityGuard, startRecording, finalizeRecording]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-4 py-12">
      <Logo />

      {violationWarning && (
        <IntegrityWarningModal violationCount={violationWarning.count} onResume={handleResumeFromWarning} />
      )}

      {phase === "terminated" && (
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-3 text-center">
            <ShieldAlert className="text-destructive size-8" aria-hidden="true" />
            <h1 className="font-display text-lg font-semibold">This interview has ended</h1>
            <p className="text-muted-foreground text-sm text-pretty">
              This interview was ended due to repeated integrity violations. Our recruitment team will review the
              recording.
            </p>
          </CardContent>
        </Card>
      )}

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
