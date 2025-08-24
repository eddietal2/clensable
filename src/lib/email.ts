import postmark from "postmark";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

const client = new postmark.ServerClient("pm_8b7fc98e-b11f-4c28-8b0b-9c52a711ff71");

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  console.log(`Sending email to ${to}: ${subject}\n${html}`);
  return;
  // try {
  //     console.log(`Sending email to ${to}: ${subject}\n${html}`);
  //   await client.sendEmail({
  //     From: "eddie@finalbossxr.com",
  //     To: to,
  //     Subject: subject,
  //     HtmlBody: html,
  //   });
  //   console.log(`Email sent to ${to}`);
  // } catch (err) {
  //   console.error("Failed to send email:", err);
  //   throw err;
  // }
}
