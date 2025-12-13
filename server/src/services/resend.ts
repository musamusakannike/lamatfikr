import { Resend } from "resend";

import { env } from "../config/env";

export function getResendClient() {
  if (!env.RESEND_API_KEY) {
    throw new Error("Resend is not configured");
  }

  return new Resend(env.RESEND_API_KEY);
}

export async function sendEmail(args: { to: string; subject: string; html: string }) {
  if (!env.EMAIL_FROM) {
    throw new Error("EMAIL_FROM is not configured");
  }

  const resend = getResendClient();

  return resend.emails.send({
    from: env.EMAIL_FROM,
    to: args.to,
    subject: args.subject,
    html: args.html,
  });
}
