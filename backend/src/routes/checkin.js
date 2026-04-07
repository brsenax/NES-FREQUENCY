import express from 'express';
import { prisma } from '../prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { isTokenValid } from '../services/tokenService.js';

const router = express.Router();

router.post('/token', requireAuth, async (req, res) => {
  const current = req.user;
  if (current.perfil !== 'aluno') {
    return res.status(400).json({ detail: 'Apenas alunos podem fazer check-in por token' });
  }

  const { sessao_id, token, metodo = 'token' } = req.body;
  const session = await prisma.sessao.findUnique({ where: { id: Number(sessao_id) } });
  if (!session || !session.ativa) {
    return res.status(400).json({ detail: 'Sessão não encontrada ou encerrada' });
  }

  if (!isTokenValid(session, token)) {
    return res.status(400).json({ detail: 'Token inválido ou expirado. Peça um novo ao professor.' });
  }

  const enrolled = await prisma.disciplinaAluno.findFirst({
    where: {
      disciplinaId: session.disciplinaId,
      alunoId: current.id,
    },
  });
  if (!enrolled) {
    return res.status(400).json({ detail: 'Você não está matriculado nesta disciplina' });
  }

  const existing = await prisma.presenca.findFirst({
    where: {
      sessaoId: session.id,
      alunoId: current.id,
    },
  });
  if (existing) {
    return res.status(400).json({ detail: 'Você já marcou presença nesta sessão' });
  }

  const metodoEnum = metodo === 'qr' ? 'qr' : 'token';
  await prisma.presenca.create({
    data: {
      sessaoId: session.id,
      alunoId: current.id,
      presente: true,
      modalidade: 'online',
      metodo: metodoEnum,
      checkinEm: new Date(),
    },
  });

  return res.json({ ok: true, msg: 'Presença registrada com sucesso' });
});

router.post('/manual', requireAuth, requireRole('admin', 'professor'), async (req, res) => {
  const { sessao_id, presencas } = req.body;
  const session = await prisma.sessao.findUnique({ where: { id: Number(sessao_id) } });
  if (!session) {
    return res.status(404).json({ detail: 'Sessão não encontrada' });
  }

  let created = 0;
  let updated = 0;

  if (!Array.isArray(presencas)) {
    return res.status(400).json({ detail: 'Presenças devem ser um array' });
  }

  for (const item of presencas) {
    const alunoId = Number(item.aluno_id);
    const presente = item.presente !== false;
    const modalidade = item.modalidade || 'presencial';

    const existing = await prisma.presenca.findFirst({
      where: {
        sessaoId: session.id,
        alunoId,
      },
    });

    if (existing) {
      if (existing.metodo === 'manual') {
        await prisma.presenca.update({
          where: { id: existing.id },
          data: {
            presente,
            modalidade,
          },
        });
        updated += 1;
      }
    } else {
      await prisma.presenca.create({
        data: {
          sessaoId: session.id,
          alunoId,
          presente,
          modalidade,
          metodo: 'manual',
          checkinEm: new Date(),
        },
      });
      created += 1;
    }
  }

  return res.json({ ok: true, created, updated });
});

export default router;
