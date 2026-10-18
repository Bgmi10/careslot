/** Sends a plain-text email through Brevo's transactional API. Without BREVO_API_KEY it logs to the console (handy in dev). */
export async function sendMail(to: string, subject: string, text: string) {
  const key = process.env.BREVO_API_KEY;
  if (!key) {
    console.log(`\n[mail disabled: no BREVO_API_KEY] To: ${to}\nSubject: ${subject}\n${text}\n`);
    return;
  }
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": key, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      sender: { email: process.env.BREVO_SENDER_EMAIL, name: "CareSlot" },
      to: [{ email: to }],
      subject,
      textContent: text,
    }),
  });
  if (!res.ok) throw new Error(`Brevo error ${res.status}: ${await res.text()}`);
}
