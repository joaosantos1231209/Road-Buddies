import sgMail from '@sendgrid/mail';
import nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';
dotenv.config();

const EMAIL_SENDER = process.env.EMAIL_SENDER || 'smtp';
const FROM_EMAIL = process.env.EMAIL_FROM_ADDRESS || 'noreply@loba.com';
const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',')[0]?.trim() ?? 'http://localhost:5173';

sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

const smtpTransport = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

const sendViaSMTP = async (msg: { to: string; subject: string; html: string }, logLabel: string) => {
  await smtpTransport.sendMail({ from: FROM_EMAIL, to: msg.to, subject: msg.subject, html: msg.html });
  console.log(`[Email/SMTP] ${logLabel} sent to ${msg.to}`);
};

const sendViaSendGrid = async (msg: { to: string; subject: string; html: string }, logLabel: string) => {
  await sgMail.send({ ...msg, from: FROM_EMAIL });
  console.log(`[Email/SendGrid] ${logLabel} sent to ${msg.to}`);
};

const maybeSend = async (
  msg: { to: string; subject: string; html: string },
  logLabel: string
) => {
  if (EMAIL_SENDER === 'smtp') {
    try {
      await sendViaSMTP(msg, logLabel);
      return;
    } catch (smtpError) {
      console.error(`[Email/SMTP] Failed to send ${logLabel}, falling back to SendGrid:`, smtpError);
    }
    try {
      await sendViaSendGrid(msg, logLabel);
    } catch (sgError) {
      console.error(`[Email/SendGrid] Failed to send ${logLabel}:`, sgError);
    }
  } else if (EMAIL_SENDER === 'sendgrid') {
    try {
      await sendViaSendGrid(msg, logLabel);
    } catch (sgError) {
      console.error(`[Email/SendGrid] Failed to send ${logLabel}:`, sgError);
    }
  }
};

export const sendEmail = async (to: string, subject: string, html: string) => {
  await maybeSend({ to, subject, html }, subject);
};

export const sendVerificationEmail = async (email: string, token: string) => {
  const verifyLink = `${FRONTEND_URL}/verify?token=${token}`;
  await maybeSend({
    to: email,
    subject: 'Road Buddies - Verifique a sua conta',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #0f172a;">Bem-vindo ao Road Buddies!</h2>
        <p>Clique no botão abaixo para verificar a sua conta e desbloquear o acesso à plataforma da LOBA:</p>
        <a href="${verifyLink}" style="display: inline-block; padding: 12px 24px; background-color: #0f172a; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px;">Verificar Conta</a>
      </div>
    `,
  }, 'Verification');
};

export const sendMatchFoundEmail = async (targetEmail: string, _tripId: number) => {
  const matchLink = `${FRONTEND_URL}/dashboard`;
  await maybeSend({
    to: targetEmail,
    subject: 'Road Buddies - Novo Match Encontrado!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #0f172a;">Boas notícias! Encontrámos um Match para si.</h2>
        <p>Um condutor acabou de publicar uma oferta perfeitamente compatível com o seu pedido de boleia.</p>
        <p>Apresse-se para garantir o seu lugar antes que esgote!</p>
        <a href="${matchLink}" style="display: inline-block; padding: 12px 24px; background-color: #059669; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px;">Ver Oferta no Dashboard</a>
      </div>
    `,
  }, 'Match Found');
};

export const sendPassengerJoinedEmail = async (driverEmail: string, passengerName: string, tripInfo: string) => {
  await maybeSend({
    to: driverEmail,
    subject: 'Road Buddies - Novo passageiro na sua viagem!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #0f172a;">Alguém reservou lugar na sua viagem!</h2>
        <p><strong>${passengerName}</strong> acabou de se juntar à sua viagem: <strong>${tripInfo}</strong>.</p>
        <p>A partir de agora, podem trocar informações diretamente através do chat da viagem disponível na plataforma.</p>
        <a href="${FRONTEND_URL}/dashboard" style="display: inline-block; padding: 12px 24px; background-color: #0f172a; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px;">Aceder à Plataforma</a>
      </div>
    `,
  }, 'Passenger Joined');
};

export const sendTripCancelledEmail = async (passengerEmail: string, driverName: string, tripInfo: string) => {
  await maybeSend({
    to: passengerEmail,
    subject: 'Road Buddies - Viagem Cancelada',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #dc2626;">Aviso: Uma viagem foi cancelada</h2>
        <p>Lamentamos informar que o condutor <strong>${driverName}</strong> cancelou a viagem <strong>${tripInfo}</strong> na qual tinha reservado lugar.</p>
        <p>Se tinha um pedido de boleia associado, este voltará a estar ativo e visível no dashboard para outros condutores.</p>
        <a href="${FRONTEND_URL}/dashboard" style="display: inline-block; padding: 12px 24px; background-color: #0f172a; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px;">Ver Dashboard</a>
      </div>
    `,
  }, 'Trip Cancelled');
};
