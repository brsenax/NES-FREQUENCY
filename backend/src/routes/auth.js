import express from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma.js';
import { secretKey, algorithm, accessTokenExpireMinutes } from '../config.js';
import { verifyPassword } from '../services/tokenService.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', async (req, res) => {
  const { login, senha } = req.body;
  if (!login || !senha) {
    return res.status(400).json({ detail: 'Login e senha são obrigatórios' });
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: login },
        { matricula: login },
      ],
      ativo: true,
    },
  });

  if (!user || !verifyPassword(senha, user.senhaHash)) {
    return res.status(401).json({ detail: 'Credenciais inválidas' });
  }

  const token = jwt.sign({ sub: user.id, perfil: user.perfil }, secretKey, {
    algorithm,
    expiresIn: `${accessTokenExpireMinutes}m`,
  });

  return res.json({
    access_token: token,
    token_type: 'bearer',
    user: {
      id: user.id,
      nome: user.nome,
      email: user.email,
      matricula: user.matricula,
      perfil: user.perfil,
      ativo: user.ativo,
    },
  });
});

router.get('/me', requireAuth, async (req, res) => {
  const { user } = req;
  return res.json({
    id: user.id,
    nome: user.nome,
    email: user.email,
    matricula: user.matricula,
    perfil: user.perfil,
    ativo: user.ativo,
  });
});

export default router;
