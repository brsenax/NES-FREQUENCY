import bcrypt from 'bcryptjs';
import { randomInt } from 'crypto';
import { tokenLength, tokenRotationSeconds } from '../config.js';

export function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(plain, hash) {
  return bcrypt.compareSync(plain, hash);
}

export function generateToken(length = tokenLength) {
  const digits = '0123456789';
  let value = '';
  for (let i = 0; i < length; i += 1) {
    value += digits[randomInt(0, digits.length)];
  }
  return value;
}

export async function rotateToken(session, prisma) {
  const token = generateToken();
  const updated = await prisma.sessao.update({
    where: { id: session.id },
    data: {
      tokenAtual: token,
      tokenEmitidoEm: new Date(),
    },
  });
  return updated;
}

export function isTokenValid(session, token) {
  if (!session?.ativa) return false;
  if (!session.tokenAtual || session.tokenAtual !== token) return false;
  if (!session.tokenEmitidoEm) return false;

  const now = new Date();
  const issued = new Date(session.tokenEmitidoEm);
  const expiry = new Date(issued.getTime() + tokenRotationSeconds * 2 * 1000);
  return now <= expiry;
}

export function getTokenInfo(session) {
  const issued = session.tokenEmitidoEm ? new Date(session.tokenEmitidoEm) : new Date();
  return {
    token: session.tokenAtual,
    sessao_id: session.id,
    disciplina_id: session.disciplinaId,
    issued_at: issued.toISOString(),
    expires_at: new Date(issued.getTime() + tokenRotationSeconds * 1000).toISOString(),
  };
}
