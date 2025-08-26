// src/lib/email.ts
import * as postmark from "postmark";

const client = new postmark.ServerClient(`${process.env.PUBLIC_POSTMARK_API_KEY}`);

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  try {
    await client.sendEmail({
      From: `${process.env.POSTMARK_SENDER_EMAIL}`,
      To: to,
      Subject: subject,
      HtmlBody: html,
    });
  } catch (err) {
    console.error("Failed to send email:", err);
    throw err;
  }
}
