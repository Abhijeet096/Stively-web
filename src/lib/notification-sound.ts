"use client";

let audioContext: AudioContext | null = null;

/**
 * A short two-tone chime synthesized via the Web Audio API - deliberately
 * not an external .mp3/.wav asset, so there's nothing to source, license,
 * or host. Silently no-ops on any failure (unsupported browser, audio
 * blocked before a user gesture) - a missed sound should never break the
 * notification UI itself.
 */
export function playNotificationSound(): void {
  if (typeof window === "undefined") return;

  try {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;

    audioContext ??= new Ctor();
    const ctx = audioContext;
    if (ctx.state === "suspended") void ctx.resume();

    const now = ctx.currentTime;
    const playTone = (frequency: number, startOffset: number, duration: number) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;

      // Quick fade in, exponential fade out - avoids the audible "click" a
      // hard on/off would produce, still short enough to read as a chime
      // rather than a tone.
      gain.gain.setValueAtTime(0, now + startOffset);
      gain.gain.linearRampToValueAtTime(0.2, now + startOffset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + startOffset + duration);

      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(now + startOffset);
      oscillator.stop(now + startOffset + duration);
    };

    // A5 -> D6, a plain two-note "ding-dong" - ~300ms total.
    playTone(880, 0, 0.12);
    playTone(1175, 0.1, 0.18);
  } catch {
    // Best-effort only.
  }
}
