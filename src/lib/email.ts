import postmark from "postmark";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

const client = new postmark.ServerClient(`${process.env.PUBLIC_POSTMARK_API_KEY}`);

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  console.log(`Sending email to ${to}: ${subject}\n${html}`);
  // return;
  try {
      console.log(`Sending email to ${to}: ${subject}\n${html}`);
    await client.sendEmail({
      From: `${process.env.POSTMARK_SENDER_EMAIL}`,
      To: to,
      Subject: subject,
      HtmlBody: html,
    });
    console.log(`Email sent to ${to}`);
  } catch (err) {
    console.error("Failed to send email:", err);
    throw err;
  }
}
