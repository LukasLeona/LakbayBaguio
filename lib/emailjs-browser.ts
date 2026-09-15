const EMAILJS_ENDPOINT = "https://api.emailjs.com/api/v1.0/email/send";
const EMAILJS_SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || "service_2ter3tn";
const EMAILJS_INQUIRY_TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_INQUIRY_TEMPLATE_ID || "template_mga5tzd";
const EMAILJS_PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || "96_UPP64ognZ8mIif";

export type BusinessInquiryEmail = {
  businessType: string;
  restaurantName: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  socialUrl: string;
  message: string;
};

export async function sendBusinessInquiryEmail(input: BusinessInquiryEmail) {
  const response = await fetch(EMAILJS_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      service_id: EMAILJS_SERVICE_ID,
      template_id: EMAILJS_INQUIRY_TEMPLATE_ID,
      user_id: EMAILJS_PUBLIC_KEY,
      template_params: {
        name: `${input.contactName} — ${input.restaurantName}`,
        email: input.email,
        reply_to: input.email,
        subject: input.phone || `Baguio Buddy ${input.businessType} inquiry`,
        comments: [
          `New Baguio Buddy business inquiry`,
          `Business: ${input.restaurantName}`,
          `Type: ${input.businessType}`,
          `Contact: ${input.contactName}`,
          `Email: ${input.email}`,
          `Phone: ${input.phone || "Not provided"}`,
          `Address: ${input.address}`,
          `Website / social: ${input.socialUrl || "Not provided"}`,
          "",
          input.message,
        ].join("\n"),
      },
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const reason = (await response.text()).slice(0, 240);
    throw new Error(`Email notification failed (${response.status}): ${reason}`);
  }
}
