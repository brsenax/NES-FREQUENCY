import express from 'express';
import { prisma } from '../prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

function formatDisciplina(disc) {
  return {
    id: disc.id,
    nome: disc.nome,
    modo: disc.modo,
    cor: disc.cor,
    ativa: disc.ativa,
  };
}

router.get('/', requireAuth, async (req, res) => {
  const current = req.user;
  const perfil = current.perfil;

  if (perfil === 'professor') {
    const disciplinas = await prisma.disciplina.findMany({
      where: {
        ativa: true,
        professores: { some: { professorId: current.id } },
      },
      orderBy: { nome: 'asc' },
    });
    return res.json(disciplinas.map(formatDisciplina));
  }

  if (perfil === 'aluno') {
    const disciplinas = await prisma.disciplina.findMany({
      where: {
        ativa: true,
        alunos: { some: { alunoId: current.id } },
      },
      orderBy: { nome: 'asc' },
    });
    return res.json(disciplinas.map(formatDisciplina));
  }

  const disciplinas = await prisma.disciplina.findMany({
    where: { ativa: true },
    orderBy: { nome: 'asc' },
  });
  return res.json(disciplinas.map(formatDisciplina));
});

router.post('/', requireAuth, requireRole('admin'), async (req, res) => {
  const { nome, modo = 'qr', cor = '#3b82f6' } = req.body;
  if (!nome) {
    return res.status(400).json({ detail: 'Nome da disciplina é obrigatório' });
  }

  const disciplina = await prisma.disciplina.create({
    data: { nome, modo, cor },
  });
  return res.json(formatDisciplina(disciplina));
});

router.post('/:discId/professores/:profId', requireAuth, requireRole('admin'), async (req, res) => {
  const { discId, profId } = req.params;
  await prisma.disciplinaProfessor.create({
    data: {
      disciplinaId: Number(discId),
      professorId: Number(profId),
    },
  }).catch(() => null);
  return res.json({ ok: true });
});

router.post('/:discId/alunos/:alunoId', requireAuth, requireRole('admin', 'professor'), async (req, res) => {
  const { discId, alunoId } = req.params;
  const existing = await prisma.disciplinaAluno.findFirst({
    where: {
      disciplinaId: Number(discId),
      alunoId: Number(alunoId),
    },
  });
  if (existing) {
    return res.json({ ok: true, msg: 'já matriculado' });
  }
  await prisma.disciplinaAluno.create({
    data: {
      disciplinaId: Number(discId),
      alunoId: Number(alunoId),
    },
  });
  return res.json({ ok: true });
});

router.delete('/:discId/alunos/:alunoId', requireAuth, requireRole('admin', 'professor'), async (req, res) => {
  const { discId, alunoId } = req.params;
  await prisma.disciplinaAluno.deleteMany({
    where: {
      disciplinaId: Number(discId),
      alunoId: Number(alunoId),
    },
  });
  return res.json({ ok: true });
});

router.get('/:discId/alunos', requireAuth, requireRole('admin', 'professor'), async (req, res) => {
  const { discId } = req.params;
  const alunos = await prisma.user.findMany({
    where: {
      ativo: true,
      disciplinasAluno: { some: { disciplinaId: Number(discId) } },
    },
    orderBy: { nome: 'asc' },
  });
  return res.json(alunos.map((u) => ({ id: u.id, nome: u.nome, matricula: u.matricula })));
});

export default router;
