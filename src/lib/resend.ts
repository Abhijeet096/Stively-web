import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
  // Fails fast in any environment that actually tries to send email,
  // but doesn't block builds/dev where email isn't exercised yet.
  console.warn("RESEND_API_KEY is not set - email sending will fail.");
}

export const resend = new Resend(process.env.RESEND_API_KEY);

export const EMAIL_FROM = process.env.EMAIL_FROM ?? "Stively <hello@stively.com>";
