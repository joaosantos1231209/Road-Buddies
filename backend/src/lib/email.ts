import sgMail from "@sendgrid/mail";
import * as dotenv from "dotenv";
dotenv.config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY || "SG.mock.key");

/**
 * Envia um e-mail simples.
 */
export const sendEmail = async (to: string, subject: string, text: string, html?: string) => {
  const msg = {
    to,
    from: "rode-buddies@loba.com",
    subject,
    text,
    html: html || text,
  };

  try {
    await sgMail.send(msg);
    console.log(`[Email] Sent to ${to}: ${subject}`);
  } catch (error) {
    console.error("[Email] Error sending email:", error);
    throw error;
  }
};

export default sendEmail;
