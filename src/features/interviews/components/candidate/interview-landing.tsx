"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Camera, Mic, Wifi, WifiOff, CheckCircle2, XCircle, Loader2, Clock } from "lucide-react";

import { Logo } from "@/components/shared/logo";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { startInterview } from "../../actions/candidate-actions";

type PermissionState = "checking" | "granted" | "denied" | "idle";

export interface InterviewLandingProps {
  token: string;
  jobTitle: string;
  department: string;
  durationMinutes: number;
  candidateName: string;
}

function StatusRow({
  icon: Icon,
  label,
  state,
  detail,
}: {
  icon: React.ElementType;
  label: string;
  state: PermissionState | "online" | "offline";
  detail: string;
}) {
  const isGood = state === "granted" || state === "online";
  const isBad = state === "denied" || state === "offline";
  const isChecking = state === "checking" || state === "idle";

  return (
    <div className="border-border flex items-center gap-3 border-b py-3 last:border-b-0">
      <span
        className={
          isGood
            ? "bg-success/10 text-success flex size-9 items-center justify-center rounded-lg"
            : isBad
              ? "bg-destructive/10 text-destructive flex size-9 items-center justify-center rounded-lg"
              : "bg-muted text-muted-foreground flex size-9 items-center justify-center rounded-lg"
        }
      >
        <Icon className="size-4.5" aria-hidden="true" />
      </span>
      <div className="flex flex-1 flex-col">
        <span className="text-foreground text-sm font-medium">{label}</span>
        <span className="text-muted-foreground text-xs">{detail}</span>
      </div>
      {isChecking && <Loader2 className="text-muted-foreground size-4 animate-spin" aria-hidden="true" />}
      {isGood && <CheckCircle2 className="text-success size-5" aria-hidden="true" />}
      {isBad && <XCircle className="text-destructive size-5" aria-hidden="true" />}
    </div>
  );
}

/**
 * Requests camera+mic together (one getUserMedia call, not two) since a
 * candidate granting one but not the other still can't proceed - splitting
 * the request would just be two prompts for the same all-or-nothing gate.
 * The stream is stopped immediately after the permission check succeeds;
 * the real interview session (M3) requests its own stream when it actually
 * starts recording, rather than holding this one open across navigation.
 */
function InterviewLanding({ token, jobTitle, department, durationMinutes, candidateName }: InterviewLandingProps) {
  const router = useRouter();
  const [cameraState, setCameraState] = React.useState<PermissionState>("idle");
  const [micState, setMicState] = React.useState<PermissionState>("idle");
  const [online, setOnline] = React.useState(true);
  const [isStarting, setIsStarting] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();

  React.useEffect(() => {
    // Deferred a tick rather than called synchronously in the effect body,
    // per react-hooks/set-state-in-effect - same discipline as
    // src/components/shared/reveal.tsx's fallback path.
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

  async function requestPermissions() {
    setCameraState("checking");
    setMicState("checking");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setCameraState("granted");
      setMicState("granted");
    } catch {
      // getUserMedia rejects for the whole request if either is denied -
      // there's no way to tell from the error alone which one, so both
      // show denied and the candidate is asked to allow both and retry.
      setCameraState("denied");
      setMicState("denied");
    }
  }

  React.useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      queueMicrotask(() => {
        setCameraState("denied");
        setMicState("denied");
      });
      return;
    }
    queueMicrotask(() => requestPermissions());
  }, []);

  const canStart = cameraState === "granted" && micState === "granted" && online;

  async function handleStart() {
    setIsStarting(true);
    setError(undefined);

    // Requested synchronously within this click handler - the last
    // reliable user-gesture context before navigating to the session
    // route, since most browsers require fullscreen requests to originate
    // from a real user activation. Best-effort: if it's rejected (some
    // browsers, or a candidate declining a fullscreen permission prompt),
    // the interview still proceeds - useIntegrityGuard on the session page
    // requests it again as a fallback.
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      // Non-fatal - proceed without fullscreen, the session page will retry.
    }

    const result = await startInterview(token);
    if (!result.success || !result.interviewId) {
      setIsStarting(false);
      setError(result.success ? "Something went wrong." : result.error);
      return;
    }
    router.push(`/interview/${token}/session`);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="flex w-full max-w-lg flex-col gap-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <Logo />
          <div className="flex flex-col gap-1.5">
            <h1 className="font-display text-2xl font-semibold tracking-tight">Hi {candidateName.split(" ")[0]},</h1>
            <p className="text-muted-foreground text-sm text-pretty">
              You&apos;re about to start your AI interview for <strong className="text-foreground">{jobTitle}</strong>
              {department ? ` (${department})` : ""}.
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Clock className="text-primary size-4" aria-hidden="true" />
              <span className="text-foreground text-sm font-medium">Estimated time: {durationMinutes} minutes</span>
            </div>
            <p className="text-muted-foreground text-sm text-pretty">
              This is a conversational interview with Stively&apos;s AI Recruiter. Speak naturally, in a quiet
              place with a stable connection. Answer normally - a short pause to think is fine, it won&apos;t cut
              you off.
            </p>
            <p className="text-muted-foreground text-sm text-pretty">
              If the microphone ever doesn&apos;t respond after a question, a &quot;Still there?&quot; button will
              appear on screen - tap it to continue. If you ever need to refresh the page, it will pick up exactly
              where you left off.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <StatusRow
              icon={Camera}
              label="Camera"
              state={cameraState}
              detail={cameraState === "denied" ? "Permission denied - check your browser settings" : "Required to begin"}
            />
            <StatusRow
              icon={Mic}
              label="Microphone"
              state={micState}
              detail={micState === "denied" ? "Permission denied - check your browser settings" : "Required to begin"}
            />
            <StatusRow
              icon={online ? Wifi : WifiOff}
              label="Internet connection"
              state={online ? "online" : "offline"}
              detail={online ? "Connected" : "No connection detected"}
            />
          </CardContent>
        </Card>

        {(cameraState === "denied" || micState === "denied") && (
          <Button variant="outline" onClick={requestPermissions}>
            Try again
          </Button>
        )}

        {error && <p className="text-destructive text-center text-sm">{error}</p>}

        <Button size="lg" onClick={handleStart} disabled={!canStart} loading={isStarting} className="w-full">
          Start Interview
        </Button>
      </div>
    </div>
  );
}

export { InterviewLanding };
