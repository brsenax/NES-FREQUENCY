import express from 'express';
import { prisma } from '../prisma.js';
import { hashPassword } from '../services/tokenService.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

function formatUser(user) {
  return {
    id: user.id,
    nome: user.nome,
    email: user.email,
    matricula: user.matricula,
    perfil: user.perfil,
    ativo: user.ativo,
  };
}

router.get('/', requireAuth, requireRole('admin', 'professor'), async (req, res) => {
  const { perfil, disciplina_id } = req.query;
  const where = { ativo: true };

  if (perfil) {
    where.perfil = perfil;
  }

  if (disciplina_id) {
    const users = await prisma.user.findMany({
      where: {
        AND: [
          where,
          {
            disciplinasAluno: { some: { disciplinaId: Number(disciplina_id) } },
          },
        ],
      },
      orderBy: { nome: 'asc' },
    });
    return res.json(users.map(formatUser));
  }

  const users = await prisma.user.findMany({
    where,
    orderBy: { nome: 'asc' },
  });
  return res.json(users.map(formatUser));
});

router.post('/', requireAuth, requireRole('admin'), async (req, res) => {
  const { nome, email, matricula, senha, perfil = 'aluno' } = req.body;
  if (!nome || !senha) {
    return res.status(400).json({ detail: 'Nome e senha são obrigatórios' });
  }

  const user = await prisma.user.create({
    data: {
      nome,
      email: email || null,
      matricula: matricula || null,
      senhaHash: hashPassword(senha),
      perfil,
    },
  });
  return res.json(formatUser(user));
});

router.post('/bulk', requireAuth, requireRole('admin'), async (req, res) => {
  const { nomes, perfil = 'aluno', disciplina_ids = [], senha_padrao = 'nes2026' } = req.body;
  if (!Array.isArray(nomes) || nomes.length === 0) {
    return res.status(400).json({ detail: 'Lista de nomes é obrigatória' });
  }

  let created = 0;
  const senhaHash = hashPassword(senha_padrao);

  for (const rawName of nomes) {
    const nome = String(rawName || '').trim();
    if (!nome) continue;
    let mat = `NES${String(created + 1).padStart(4, '0')}${nome.slice(0, 2).toUpperCase()}`;
    const existing = await prisma.user.findFirst({ where: { matricula: mat } });
    if (existing) {
      mat = `NES${String(Math.floor(Math.random() * 9000) + 1000)}${nome.slice(0, 2).toUpperCase()}`;
    }

    const user = await prisma.user.create({
      data: {
        nome,
        matricula: mat,
        senhaHash,
        perfil,
      },
    });

    for (const discId of disciplina_ids) {
      await prisma.disciplinaAluno.create({
        data: {
          disciplinaId: Number(discId),
          alunoId: user.id,
        },
      }).catch(() => null);
    }
    created += 1;
  }

  return res.json({ criados: created });
});

router.put('/:userId', requireAuth, requireRole('admin'), async (req, res) => {
  const { userId } = req.params;
  const { nome, email, matricula, senha, ativo } = req.body;
  const user = await prisma.user.findUnique({ where: { id: Number(userId) } });
  if (!user) {
    return res.status(404).json({ detail: 'Usuário não encontrado' });
  }

  const updated = await prisma.user.update({
    where: { id: Number(userId) },
    data: {
      nome: nome ?? user.nome,
      email: email ?? user.email,
      matricula: matricula ?? user.matricula,
      senhaHash: senha ? hashPassword(senha) : user.senhaHash,
      ativo: ativo ?? user.ativo,
    },
  });

  return res.json(formatUser(updated));
});

router.delete('/:userId', requireAuth, requireRole('admin'), async (req, res) => {
  const { userId } = req.params;
  const user = await prisma.user.findUnique({ where: { id: Number(userId) } });
  if (!user) {
    return res.status(404).json({ detail: 'Usuário não encontrado' });
  }
  await prisma.user.update({ where: { id: Number(userId) }, data: { ativo: false } });
  return res.json({ ok: true });
});

export default router;
