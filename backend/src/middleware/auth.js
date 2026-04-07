import jwt from 'jsonwebtoken';
import { prisma } from '../prisma.js';
import { secretKey, algorithm } from '../config.js';

export async function requireAuth(req, res, next) {
  const authorization = req.headers.authorization;
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return res.status(401).json({ detail: 'Token inválido' });
  }

  const token = authorization.slice(7);
  try {
    const payload = jwt.verify(token, secretKey, { algorithms: [algorithm] });
    const userId = payload.sub;
    if (!userId) {
      return res.status(401).json({ detail: 'Token inválido' });
    }

    const user = await prisma.user.findUnique({
      where: { id: Number(userId) },
    });

    if (!user || !user.ativo) {
      return res.status(401).json({ detail: 'Token inválido' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ detail: 'Token inválido' });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ detail: 'Token inválido' });
    }
    if (!roles.includes(req.user.perfil)) {
      return res.status(403).json({ detail: 'Acesso negado' });
    }
    next();
  };
}
