import { sendEmail } from "../lib/email.js";

export async function sendVerificationCode(email: string, code: string): Promise<void> {
  await sendEmail(email, "Road Buddies — Código de Verificação", `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #0F172A;">
      <div style="background: #1E3A5F; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
        <h2 style="color: white; margin: 0; font-size: 20px;">🚗 Road Buddies</h2>
        <p style="color: rgba(255,255,255,0.7); margin: 4px 0 0; font-size: 13px;">Carsharing LOBA</p>
      </div>
      <div style="background: #fff; border: 1px solid #E2E8F0; border-top: none; padding: 32px; border-radius: 0 0 8px 8px; text-align: center;">
        <p style="font-size: 15px; color: #475569; margin: 0 0 24px;">O teu código de verificação é:</p>
        <div style="background: #EBF2FA; border: 2px dashed #2563A8; border-radius: 8px; padding: 20px; display: inline-block; margin-bottom: 24px;">
          <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #1E3A5F;">${code}</span>
        </div>
        <p style="font-size: 13px; color: #94A3B8; margin: 0;">Este código expira em 30 minutos.</p>
      </div>
    </div>
  `);
  console.log(`[Email] Verification code sent to ${email}`);
}
