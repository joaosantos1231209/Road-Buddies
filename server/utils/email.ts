import { MailService } from '@sendgrid/mail';
import { APP_NAME } from '../lib/constants';

// URL base da aplicação para links nos e-mails
const DEFAULT_APP_URL = 'https://roadbuddies.replit.app';

// Check for required environment variables
if (!process.env.SENDGRID_API_KEY) {
  console.warn("SENDGRID_API_KEY environment variable is not set. Email functionality will be disabled.");
}

if (!process.env.SENDGRID_VERIFIED_SENDER) {
  console.warn("SENDGRID_VERIFIED_SENDER environment variable is not set. Email functionality will be disabled.");
}

// Initialize mail service
const mailService = new MailService();
if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
  console.log("SendGrid API initialized with API key");
}

interface EmailParams {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

/**
 * Send an email using SendGrid
 * @param params Email parameters
 * @returns Promise resolving to true if email was sent successfully, false otherwise
 */
export async function sendEmail(params: EmailParams): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn("Cannot send email: SENDGRID_API_KEY is not set");
    return false;
  }

  try {
    if (!process.env.SENDGRID_VERIFIED_SENDER) {
      console.warn("Cannot send email: SENDGRID_VERIFIED_SENDER is not set");
      return false;
    }
    
    await mailService.send({
      to: params.to,
      from: process.env.SENDGRID_VERIFIED_SENDER, // Using the verified sender from environment
      subject: params.subject,
      text: params.text || '',
      html: params.html || '',
    });
    console.log(`Email sent successfully to ${params.to}`);
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

/**
 * Generate a random verification token
 * @returns Random token string
 */
export function generateVerificationToken(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

/**
 * Send an email verification email to a new user
 * @param params Parameters for the verification email
 */
export async function sendVerificationEmail({
  recipientEmail,
  recipientName,
  verificationToken,
  verificationUrl
}: {
  recipientEmail: string;
  recipientName: string;
  verificationToken: string;
  verificationUrl: string;
}): Promise<boolean> {
  const subject = `Verifique o seu email para a ${APP_NAME}`;
  
  // A URL completa já foi construída no server/routes.ts
  const fullVerificationUrl = verificationUrl;
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h2 style="color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px;">Verificação de Email</h2>
      
      <p>Olá ${recipientName},</p>
      
      <p>Obrigado por se registar na ${APP_NAME}! Para completar o seu registo e ter acesso à plataforma, por favor verifique o seu email clicando no botão abaixo:</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${fullVerificationUrl}" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Verificar meu e-mail</a>
      </div>
      
      <p>Se o botão acima não funcionar, pode copiar e colar o seguinte link no seu navegador:</p>
      <p style="word-break: break-all; background-color: #f8f8f8; padding: 10px; border-radius: 4px;">${fullVerificationUrl}</p>
      
      <p>Este link expirará em 24 horas por motivos de segurança.</p>
      
      <p>Bem-vindo à nossa comunidade de partilha de viagens!</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #777;">
        <p>Este é um email automático, por favor não responda.</p>
        <p>© 2025 ${APP_NAME}. Todos os direitos reservados.</p>
      </div>
    </div>
  `;
  
  const textContent = `
    Verificação de E-mail
    
    Olá ${recipientName},
    
    Obrigado por se registar na ${APP_NAME}! Para completar o seu registo e ter acesso à plataforma, por favor verifique o seu email visitando o link abaixo:
    
    ${fullVerificationUrl}
    
    Este link expirará em 24 horas por motivos de segurança.
    
    Bem-vindo à nossa comunidade de partilha de viagens!
    
    Este é um email automático, por favor não responda.
    © 2025 ${APP_NAME}. Todos os direitos reservados.
  `;
  
  return sendEmail({
    to: recipientEmail,
    subject,
    html: htmlContent,
    text: textContent
  });
}

export async function sendTripCancellationEmail({
  recipientEmail,
  recipientName,
  tripOrigin,
  tripDestination,
  tripDate,
  ownerName
}: {
  recipientEmail: string;
  recipientName: string;
  tripOrigin: string;
  tripDestination: string;
  tripDate: string;
  ownerName: string;
}): Promise<boolean> {
  const subject = `Viagem ${tripOrigin} → ${tripDestination} foi cancelada`;
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h2 style="color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px;">Notificação de Cancelamento de Viagem</h2>
      
      <p>Olá ${recipientName},</p>
      
      <p>Lamentamos informar que a viagem que estava a participar foi cancelada pelo condutor.</p>
      
      <div style="background-color: #f8f8f8; border-left: 4px solid #e74c3c; padding: 15px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #e74c3c;">Detalhes da Viagem Cancelada:</h3>
        <p><strong>Origem:</strong> ${tripOrigin}</p>
        <p><strong>Destino:</strong> ${tripDestination}</p>
        <p><strong>Data:</strong> ${tripDate}</p>
        <p><strong>Cancelada por:</strong> ${ownerName}</p>
      </div>
      
      <p>Se você tiver dúvidas, entre em contato diretamente com o condutor da viagem.</p>
      
      <p>Esperamos que encontre outra opção de viagem em breve!</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #777;">
        <p>Este é um email automático, por favor não responda.</p>
        <p>© 2025 ${APP_NAME}. Todos os direitos reservados.</p>
      </div>
    </div>
  `;
  
  const textContent = `
    Notificação de Cancelamento de Viagem
    
    Olá ${recipientName},
    
    Lamentamos informar que a viagem que estava a participar foi cancelada pelo condutor.
    
    Detalhes da Viagem Cancelada:
    - Origem: ${tripOrigin}
    - Destino: ${tripDestination}
    - Data: ${tripDate}
    - Cancelada por: ${ownerName}
    
    Se você tiver dúvidas, entre em contato diretamente com o condutor da viagem.
    
    Esperamos que encontre outra opção de viagem em breve!
    
    Este é um email automático, por favor não responda.
    © 2025 ${APP_NAME}. Todos os direitos reservados.
  `;
  
  return sendEmail({
    to: recipientEmail,
    subject,
    html: htmlContent,
    text: textContent
  });
}

/**
 * Enviar e-mail para o condutor quando alguém se junta à viagem
 */
export async function sendPassengerJoinedEmail({
  recipientEmail,
  recipientName,
  passengerName,
  tripOrigin,
  tripDestination,
  tripDate
}: {
  recipientEmail: string;
  recipientName: string;
  passengerName: string;
  tripOrigin: string;
  tripDestination: string;
  tripDate: string;
}): Promise<boolean> {
  const subject = `Novo passageiro na sua viagem ${tripOrigin} → ${tripDestination}`;
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h2 style="color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px;">Novo Passageiro Juntou-se à Sua Viagem</h2>
      
      <p>Olá ${recipientName},</p>
      
      <p>Boas notícias! <strong>${passengerName}</strong> juntou-se à sua viagem como passageiro.</p>
      
      <div style="background-color: #f8f8f8; border-left: 4px solid #4CAF50; padding: 15px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #4CAF50;">Detalhes da Viagem:</h3>
        <p><strong>Origem:</strong> ${tripOrigin}</p>
        <p><strong>Destino:</strong> ${tripDestination}</p>
        <p><strong>Data:</strong> ${tripDate}</p>
        <p><strong>Novo passageiro:</strong> ${passengerName}</p>
      </div>
      
      <p>Pode verificar os detalhes da viagem e conversar com o passageiro através da plataforma ${APP_NAME}.</p>
      
      <p>Obrigado por disponibilizar esta viagem!</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #777;">
        <p>Este é um email automático, por favor não responda.</p>
        <p>© 2025 ${APP_NAME}. Todos os direitos reservados.</p>
      </div>
    </div>
  `;
  
  const textContent = `
    Novo Passageiro Juntou-se à Sua Viagem
    
    Olá ${recipientName},
    
    Boas notícias! ${passengerName} juntou-se à sua viagem como passageiro.
    
    Detalhes da Viagem:
    - Origem: ${tripOrigin}
    - Destino: ${tripDestination}
    - Data: ${tripDate}
    - Novo passageiro: ${passengerName}
    
    Pode verificar os detalhes da viagem e conversar com o passageiro através da plataforma ${APP_NAME}.
    
    Obrigado por disponibilizar esta viagem!
    
    Este é um email automático, por favor não responda.
    © 2025 ${APP_NAME}. Todos os direitos reservados.
  `;
  
  return sendEmail({
    to: recipientEmail,
    subject,
    html: htmlContent,
    text: textContent
  });
}

/**
 * Enviar e-mail de confirmação para quem se junta à viagem
 */
export async function sendTripJoinConfirmationEmail({
  recipientEmail,
  recipientName,
  driverName,
  tripOrigin,
  tripDestination,
  tripDate,
  seatCount
}: {
  recipientEmail: string;
  recipientName: string;
  driverName: string;
  tripOrigin: string;
  tripDestination: string;
  tripDate: string;
  seatCount: number;
}): Promise<boolean> {
  const subject = `Confirmação: Viagem ${tripOrigin} → ${tripDestination}`;
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h2 style="color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px;">Confirmação de Participação na Viagem</h2>
      
      <p>Olá ${recipientName},</p>
      
      <p>A sua participação na viagem foi confirmada com sucesso!</p>
      
      <div style="background-color: #f8f8f8; border-left: 4px solid #3498db; padding: 15px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #3498db;">Detalhes da Viagem:</h3>
        <p><strong>Origem:</strong> ${tripOrigin}</p>
        <p><strong>Destino:</strong> ${tripDestination}</p>
        <p><strong>Data:</strong> ${tripDate}</p>
        <p><strong>Condutor:</strong> ${driverName}</p>
        <p><strong>Lugares disponíveis:</strong> ${seatCount}</p>
      </div>
      
      <p>Pode verificar os detalhes da viagem e comunicar com o condutor através da plataforma ${APP_NAME}.</p>
      
      <p>Desejamos-lhe uma excelente viagem!</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #777;">
        <p>Este é um email automático, por favor não responda.</p>
        <p>© 2025 ${APP_NAME}. Todos os direitos reservados.</p>
      </div>
    </div>
  `;
  
  const textContent = `
    Confirmação de Participação na Viagem
    
    Olá ${recipientName},
    
    A sua participação na viagem foi confirmada com sucesso!
    
    Detalhes da Viagem:
    - Origem: ${tripOrigin}
    - Destino: ${tripDestination}
    - Data: ${tripDate}
    - Condutor: ${driverName}
    - Lugares disponíveis: ${seatCount}
    
    Pode verificar os detalhes da viagem e comunicar com o condutor através da plataforma ${APP_NAME}.
    
    Desejamos-lhe uma excelente viagem!
    
    Este é um email automático, por favor não responda.
    © 2025 ${APP_NAME}. Todos os direitos reservados.
  `;
  
  return sendEmail({
    to: recipientEmail,
    subject,
    html: htmlContent,
    text: textContent
  });
}

/**
 * Enviar e-mail de notificação de nova viagem compatível
 */
export async function sendNewMatchEmail({
  recipientEmail,
  recipientName,
  tripOrigin,
  tripDestination,
  tripDate,
  matchCount,
  userTripId, // ID da viagem do usuário que está recebendo o email
  matchingTripId, // ID da viagem compatível
  appUrl = DEFAULT_APP_URL // URL base da aplicação
}: {
  recipientEmail: string;
  recipientName: string;
  tripOrigin: string;
  tripDestination: string;
  tripDate: string;
  matchCount: number;
  userTripId?: number; // Opcional para compatibilidade com código existente
  matchingTripId?: number; // Opcional para compatibilidade com código existente
  appUrl?: string; // Opcional, permite substituir a URL padrão se necessário
}): Promise<boolean> {
  const subject = `Nova viagem compatível: ${tripOrigin} → ${tripDestination}`;
  
  // Criar URLs para as viagens, se os IDs forem fornecidos
  const userTripUrl = userTripId ? `${appUrl}/trips/${userTripId}` : '';
  const matchingTripUrl = matchingTripId ? `${appUrl}/trips/${matchingTripId}` : '';
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h2 style="color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px;">Novas Viagens Compatíveis Encontradas</h2>
      
      <p>Olá ${recipientName},</p>
      
      <p>Encontrámos ${matchCount} ${matchCount === 1 ? 'nova viagem compatível' : 'novas viagens compatíveis'} com a sua necessidade de deslocação!</p>
      
      <div style="background-color: #f8f8f8; border-left: 4px solid #9b59b6; padding: 15px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #9b59b6;">Detalhes da Sua Viagem:</h3>
        <p><strong>Origem:</strong> ${tripOrigin}</p>
        <p><strong>Destino:</strong> ${tripDestination}</p>
        <p><strong>Data:</strong> ${tripDate}</p>
        ${userTripUrl ? `<p><a href="${userTripUrl}" style="display: inline-block; background-color: #9b59b6; color: white; padding: 8px 15px; text-decoration: none; border-radius: 4px; margin-top: 10px;">Ver Sua Viagem</a></p>` : ''}
      </div>
      
      ${matchingTripUrl ? `
      <div style="background-color: #f4f9ff; border-left: 4px solid #3498db; padding: 15px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #3498db;">Viagem Compatível Encontrada!</h3>
        <p>Foi encontrada uma viagem que combina com a sua necessidade de deslocação.</p>
        <p><a href="${matchingTripUrl}" style="display: inline-block; background-color: #3498db; color: white; padding: 8px 15px; text-decoration: none; border-radius: 4px; margin-top: 10px;">Ver Viagem Compatível</a></p>
      </div>
      ` : ''}
      
      <p>Aceda à plataforma ${APP_NAME} para verificar as opções disponíveis e confirmar a sua participação.</p>
      
      <p>Não perca esta oportunidade de encontrar uma boleia para o seu destino!</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #777;">
        <p>Este é um email automático, por favor não responda.</p>
        <p>© 2025 ${APP_NAME}. Todos os direitos reservados.</p>
      </div>
    </div>
  `;
  
  const textContent = `
    Novas Viagens Compatíveis Encontradas
    
    Olá ${recipientName},
    
    Encontrámos ${matchCount} ${matchCount === 1 ? 'nova viagem compatível' : 'novas viagens compatíveis'} com a sua necessidade de deslocação!
    
    Detalhes da Sua Viagem:
    - Origem: ${tripOrigin}
    - Destino: ${tripDestination}
    - Data: ${tripDate}
    ${userTripUrl ? `- Ver sua viagem: ${userTripUrl}` : ''}
    
    ${matchingTripUrl ? `Viagem Compatível Encontrada:
    - Ver viagem compatível: ${matchingTripUrl}` : ''}
    
    Aceda à plataforma ${APP_NAME} para verificar as opções disponíveis e confirmar a sua participação.
    
    Não perca esta oportunidade de encontrar uma boleia para o seu destino!
    
    Este é um email automático, por favor não responda.
    © 2025 ${APP_NAME}. Todos os direitos reservados.
  `;
  
  return sendEmail({
    to: recipientEmail,
    subject,
    html: htmlContent,
    text: textContent
  });
}