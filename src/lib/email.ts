import "server-only";

type Mail = { to: string; subject: string; text: string; replyTo?: string };

/**
 * Sends a notification email through Resend when RESEND_API_KEY is configured.
 * Inquiries and messages are always stored in the database first, so email is best-effort.
 */
export async function sendMail(mail: Mail) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    console.info(`[email] Not configured; skipped "${mail.subject}" to ${mail.to}`);
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: mail.to, subject: mail.subject, text: mail.text, reply_to: mail.replyTo }),
    });
    if (!res.ok) console.error(`[email] Resend responded ${res.status}: ${await res.text()}`);
    return res.ok;
  } catch (err) {
    console.error("[email] Failed to send", err);
    return false;
  }
}

export function adminNotifyAddress() {
  return process.env.ADMIN_NOTIFY_EMAIL || null;
}
