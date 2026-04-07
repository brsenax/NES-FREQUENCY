import express from 'express';
import { prisma } from '../prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { rotateToken, getTokenInfo } from '../services/tokenService.js';

const router = express.Router();

function sessionOutput(session, disciplina, checkinCount = 0) {
  return {
    id: session.id,
    disciplina_id: session.disciplinaId,
    disciplina_nome: disciplina?.nome,
    disciplina_modo: disciplina?.modo,
    disciplina_cor: disciplina?.cor,
    professor_id: session.professorId,
    descricao: session.descricao,
    data: session.data,
    token_atual: session.tokenAtual,
    token_emitido_em: session.tokenEmitidoEm,
    ativa: session.ativa,
    criado_em: session.criadoEm,
    encerrado_em: session.encerradoEm,
    total_checkins: checkinCount,
  };
}

router.post('/', requireAuth, requireRole('admin', 'professor'), async (req, res) => {
  const current = req.user;
  const { disciplina_id, descricao, data } = req.body;
  if (!disciplina_id) {
    return res.status(400).json({ detail: 'disciplina_id é obrigatório' });
  }

  if (current.perfil === 'professor') {
    const access = await prisma.disciplinaProfessor.findFirst({
      where: {
        disciplinaId: Number(disciplina_id),
        professorId: current.id,
      },
    });
    if (!access) {
      return res.status(403).json({ detail: 'Sem acesso a esta disciplina' });
    }
  }

  await prisma.sessao.updateMany({
    where: { professorId: current.id, ativa: true },
    data: { ativa: false, encerradoEm: new Date() },
  });

  const formattedDate = data || new Date().toISOString().slice(0, 10);
  const session = await prisma.sessao.create({
    data: {
      disciplinaId: Number(disciplina_id),
      professorId: current.id,
      descricao,
      data: formattedDate,
    },
  });

  const rotated = await rotateToken(session, prisma);
  const disciplina = await prisma.disciplina.findUnique({ where: { id: Number(disciplina_id) } });
  return res.json(sessionOutput(rotated, disciplina));
});

router.post('/:sessaoId/rotate-token', requireAuth, requireRole('admin', 'professor'), async (req, res) => {
  const { sessaoId } = req.params;
  const session = await prisma.sessao.findUnique({ where: { id: Number(sessaoId) } });
  if (!session || !session.ativa) {
    return res.status(404).json({ detail: 'Sessão não encontrada ou encerrada' });
  }
  if (session.professorId !== req.user.id && req.user.perfil !== 'admin') {
    return res.status(403).json({ detail: 'Sem permissão' });
  }

  const rotated = await rotateToken(session, prisma);
  return res.json(getTokenInfo(rotated));
});

router.get('/:sessaoId/token-info', requireAuth, requireRole('admin', 'professor'), async (req, res) => {
  const { sessaoId } = req.params;
  const session = await prisma.sessao.findUnique({ where: { id: Number(sessaoId) } });
  if (!session) {
    return res.status(404).json({ detail: 'Sessão não encontrada' });
  }
  return res.json(getTokenInfo(session));
});

router.post('/:sessaoId/encerrar', requireAuth, requireRole('admin', 'professor'), async (req, res) => {
  const { sessaoId } = req.params;
  const session = await prisma.sessao.findUnique({ where: { id: Number(sessaoId) } });
  if (!session) {
    return res.status(404).json({ detail: 'Sessão não encontrada' });
  }
  if (session.professorId !== req.user.id && req.user.perfil !== 'admin') {
    return res.status(403).json({ detail: 'Sem permissão' });
  }

  const updated = await prisma.sessao.update({
    where: { id: Number(sessaoId) },
    data: { ativa: false, encerradoEm: new Date() },
  });

  const disciplina = await prisma.disciplina.findUnique({ where: { id: updated.disciplinaId } });
  const checkinCount = await prisma.presenca.count({
    where: { sessaoId: updated.id, presente: true },
  });
  return res.json(sessionOutput(updated, disciplina, checkinCount));
});

router.get('/ativa', requireAuth, requireRole('admin', 'professor'), async (req, res) => {
  const query = { ativa: true };
  if (req.user.perfil === 'professor') {
    query.professorId = req.user.id;
  }

  const session = await prisma.sessao.findFirst({ where: query });
  if (!session) {
    return res.json(null);
  }

  const disciplina = await prisma.disciplina.findUnique({ where: { id: session.disciplinaId } });
  const count = await prisma.presenca.count({
    where: { sessaoId: session.id, presente: true },
  });
  return res.json(sessionOutput(session, disciplina, count));
});

router.get('/historico', requireAuth, requireRole('admin', 'professor'), async (req, res) => {
  const { disciplina_id } = req.query;
  const where = {};
  if (req.user.perfil === 'professor') {
    where.professorId = req.user.id;
  }
  if (disciplina_id) {
    where.disciplinaId = Number(disciplina_id);
  }

  const sessions = await prisma.sessao.findMany({
    where,
    orderBy: [
      { data: 'desc' },
      { criadoEm: 'desc' },
    ],
  });

  const output = [];
  for (const session of sessions) {
    const disciplina = await prisma.disciplina.findUnique({ where: { id: session.disciplinaId } });
    const count = await prisma.presenca.count({
      where: { sessaoId: session.id, presente: true },
    });
    output.push(sessionOutput(session, disciplina, count));
  }
  return res.json(output);
});

router.get('/:sessaoId/presencas', requireAuth, async (req, res) => {
  const { sessaoId } = req.params;
  const registros = await prisma.presenca.findMany({
    where: { sessaoId: Number(sessaoId) },
    include: { aluno: true },
    orderBy: { aluno: { nome: 'asc' } },
  });

  return res.json(registros.map((p) => ({
    id: p.id,
    sessao_id: p.sessaoId,
    aluno_id: p.alunoId,
    aluno_nome: p.aluno.nome,
    presente: p.presente,
    modalidade: p.modalidade,
    metodo: p.metodo,
    checkin_em: p.checkinEm,
  })));
});

router.delete('/:sessaoId', requireAuth, requireRole('admin'), async (req, res) => {
  const { sessaoId } = req.params;
  await prisma.presenca.deleteMany({ where: { sessaoId: Number(sessaoId) } });
  await prisma.sessao.delete({ where: { id: Number(sessaoId) } });
  return res.json({ ok: true });
});

export default router;
