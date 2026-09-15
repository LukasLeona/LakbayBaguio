import "server-only";

const EMAILJS_ENDPOINT = "https://api.emailjs.com/api/v1.0/email/send";
const EMAILJS_SERVICE_ID = process.env.EMAILJS_SERVICE_ID || "service_2ter3tn";
const EMAILJS_TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID || "template_52y6bwx";
const EMAILJS_PUBLIC_KEY = process.env.EMAILJS_PUBLIC_KEY || "96_UPP64ognZ8mIif";

type NotificationInput = {
  name: string;
  email: string;
  subject: string;
  comments: string;
};

export async function sendEmailNotification(input: NotificationInput) {
  const response = await fetch(EMAILJS_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      service_id: EMAILJS_SERVICE_ID,
      template_id: EMAILJS_TEMPLATE_ID,
      user_id: EMAILJS_PUBLIC_KEY,
      template_params: {
        name: input.name,
        email: input.email,
        subject: input.subject,
        comments: input.comments,
        reply_to: input.email,
      },
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const reason = (await response.text()).slice(0, 240);
    throw new Error(`Email notification failed (${response.status}): ${reason}`);
  }
}
