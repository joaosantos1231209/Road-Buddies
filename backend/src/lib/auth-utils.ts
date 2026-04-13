/**
 * Utilitários de Autenticação para o Road Buddies.
 */

/**
 * Gera um código numérico de 6 dígitos.
 */
export const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Valida se um e-mail pertence ao domínio permitido ou à lista de exceções.
 */
export const isEmailAllowed = (email: string, allowedEmails: string[] = []): boolean => {
  if (!email) return false;
  const emailLower = email.toLowerCase();
  
  // Verifica domínio @loba.com
  if (emailLower.endsWith('@loba.com')) return true;
  
  // Verifica whitelist (exceções)
  return allowedEmails.map(e => e.toLowerCase()).includes(emailLower);
};

/**
 * Verifica se um código de verificação ainda é válido (ex: 30 minutos).
 */
export const isCodeExpired = (createdAt: Date, expiryMinutes: number = 30): boolean => {
  const now = new Date();
  const diffMs = now.getTime() - createdAt.getTime();
  const diffMins = diffMs / (1000 * 60);
  return diffMins > expiryMinutes;
};
