import sgMail from '@sendgrid/mail';
import * as dotenv from 'dotenv';
dotenv.config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY || 'SG.mock.key');

export const sendVerificationEmail = async (email: string, token: string) => {
  const verifyLink = `http://localhost:5173/verify?token=${token}`;
  
  const msg = {
    to: email,
    from: 'joaosantos@loba.com',
    subject: 'Road Buddies - Verifique a sua conta',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #0f172a;">Bem-vindo ao Road Buddies!</h2>
        <p>Clique no botão abaixo para verificar a sua conta e desbloquear o acesso à plataforma da GLOBAZ:</p>
        <a href="${verifyLink}" style="display: inline-block; padding: 12px 24px; background-color: #0f172a; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px;">Verificar Conta</a>
      </div>
    `,
  };

  try {
    if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY !== 'SG.mock.key') {
      await sgMail.send(msg);
      console.log(`[Email] Verification sent to ${email}`);
    } else {
      console.log(`[Mock Email] Verification sent to ${email}. Link: ${verifyLink}`);
    }
  } catch (error) {
    console.error("Error sending verification email:", error);
  }
};

export const sendMatchFoundEmail = async (targetEmail: string, tripId: number) => {
  const matchLink = `http://localhost:5173/dashboard`;
  
  const msg = {
    to: targetEmail,
    from: 'joaosantos@loba.com',
    subject: 'Road Buddies - Novo Match Encontrado!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #0f172a;">Boas notícias! Encontrámos um Match para si.</h2>
        <p>Um condutor acabou de publicar uma oferta perfeitamente compatível com o seu pedido de boleia.</p>
        <p>Apresse-se para garantir o seu lugar antes que esgote!</p>
        <a href="${matchLink}" style="display: inline-block; padding: 12px 24px; background-color: #059669; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px;">Ver Oferta no Dashboard</a>
      </div>
    `,
  };

  try {
    if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY !== 'SG.mock.key') {
      await sgMail.send(msg);
      console.log(`[Email] Match Found sent to ${targetEmail}`);
    } else {
      console.log(`[Mock Email] Match Found sent to ${targetEmail}.`);
    }
  } catch (error) {
    console.error("Error sending match email:", error);
  }
};

export const sendPassengerJoinedEmail = async (driverEmail: string, passengerName: string, tripInfo: string) => {
  const msg = {
    to: driverEmail,
    from: 'joaosantos@loba.com',
    subject: 'Road Buddies - Novo passageiro na sua viagem!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #0f172a;">Alguém reservou lugar na sua viagem!</h2>
        <p><strong>${passengerName}</strong> acabou de se juntar à sua viagem: <strong>${tripInfo}</strong>.</p>
        <p>A partir de agora, podem trocar informações diretamente através do chat da viagem disponível na plataforma.</p>
        <a href="http://localhost:5173/dashboard" style="display: inline-block; padding: 12px 24px; background-color: #0f172a; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px;">Aceder à Plataforma</a>
      </div>
    `,
  };

  try {
    if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY !== 'SG.mock.key') {
      await sgMail.send(msg);
      console.log(`[Email] Passenger Joined sent to ${driverEmail}`);
    } else {
      console.log(`[Mock Email] Passenger Joined sent to ${driverEmail}.`);
    }
  } catch (error) {
    console.error("Error sending passenger joined email:", error);
  }
};
export const sendTripCancelledEmail = async (passengerEmail: string, driverName: string, tripInfo: string) => {
  const msg = {
    to: passengerEmail,
    from: 'joaosantos@loba.com',
    subject: 'Road Buddies - Viagem Cancelada',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #dc2626;">Aviso: Uma viagem foi cancelada</h2>
        <p>Lamentamos informar que o condutor <strong>${driverName}</strong> cancelou a viagem <strong>${tripInfo}</strong> na qual tinha reservado lugar.</p>
        <p>Se tinha um pedido de boleia associado, este voltará a estar ativo e visível no dashboard para outros condutores.</p>
        <a href="http://localhost:5173/dashboard" style="display: inline-block; padding: 12px 24px; background-color: #0f172a; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px;">Ver Dashboard</a>
      </div>
    `,
  };

  try {
    if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY !== 'SG.mock.key') {
      await sgMail.send(msg);
      console.log(`[Email] Trip Cancelled sent to ${passengerEmail}`);
    } else {
      console.log(`[Mock Email] Trip Cancelled sent to ${passengerEmail}. Driver: ${driverName}, Trip: ${tripInfo}`);
    }
  } catch (error) {
    console.error("Error sending trip cancelled email:", error);
  }
};
