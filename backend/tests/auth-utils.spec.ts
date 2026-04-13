import { describe, it, expect } from 'vitest';
import { generateVerificationCode, isEmailAllowed, isCodeExpired } from '../src/lib/auth-utils.js';

describe('Auth Utils: Backend Logic', () => {
  it('deve gerar um código de 6 dígitos', () => {
    const code = generateVerificationCode();
    expect(code).toMatch(/^\d{6}$/);
  });

  it('deve permitir e-mails do domínio @loba.com', () => {
    expect(isEmailAllowed('joao@loba.com')).toBe(true);
    expect(isEmailAllowed('TESTE@LOBA.COM')).toBe(true);
  });

  it('deve permitir e-mails na whitelist', () => {
    const whitelist = ['user1@gmail.com', 'user2@outlook.com'];
    expect(isEmailAllowed('user1@gmail.com', whitelist)).toBe(true);
    expect(isEmailAllowed('USER2@OUTLOOK.COM', whitelist)).toBe(true);
  });

  it('deve bloquear e-mails fora do domínio ou whitelist', () => {
    expect(isEmailAllowed('hacker@gmail.com', ['friend@gmail.com'])).toBe(false);
  });

  it('deve validar a expiração do código corretamente', () => {
    const thirtyOneMinsAgo = new Date(Date.now() - 31 * 60 * 1000);
    const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000);
    
    expect(isCodeExpired(thirtyOneMinsAgo, 30)).toBe(true);
    expect(isCodeExpired(tenMinsAgo, 30)).toBe(false);
  });
});
