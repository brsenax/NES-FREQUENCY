import express from 'express';
import { prisma } from '../prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/disciplina/:discId', requireAuth, requireRole('admin', 'professor'), async (req, res) => {
  const { discId } = req.params;
  const current = req.user;

  const disc = await prisma.disciplina.findUnique({ where: { id: Number(discId) } });
  if (!disc) {
    return res.status(404).json({ detail: 'Disciplina não encontrada' });
  }

  if (current.perfil === 'professor') {
    const access = await prisma.disciplinaProfessor.findFirst({
      where: {
        disciplinaId: disc.id,
        professorId: current.id,
      },
    });
    if (!access) {
      return res.status(403).json({ detail: 'Sem acesso a esta disciplina' });
    }
  }

  const totalSessoes = await prisma.sessao.count({ where: { disciplinaId: disc.id } });
  const alunos = await prisma.user.findMany({
    where: {
      ativo: true,
      disciplinasAluno: { some: { disciplinaId: disc.id } },
    },
    orderBy: { nome: 'asc' },
  });

  const sessaoIds = (await prisma.sessao.findMany({
    where: { disciplinaId: disc.id },
    select: { id: true },
  })).map((s) => s.id);

  const alunosData = [];
  for (const aluno of alunos) {
    if (!sessaoIds.length) {
      alunosData.push({
        aluno_id: aluno.id,
        aluno_nome: aluno.nome,
        matricula: aluno.matricula,
        total_sessoes: 0,
        total_presencas: 0,
        presencas_presencial: 0,
        presencas_online: 0,
        frequencia: 0.0,
      });
      continue;
    }

    const presencas = await prisma.presenca.findMany({
      where: {
        alunoId: aluno.id,
        sessaoId: { in: sessaoIds },
        presente: true,
      },
    });
    const presCount = presencas.length;
    const presPresencial = presencas.filter((p) => p.modalidade === 'presencial').length;
    const presOnline = presencas.filter((p) => p.modalidade === 'online').length;
    const freq = totalSessoes > 0 ? (presCount / totalSessoes) * 100 : 0.0;

    alunosData.push({
      aluno_id: aluno.id,
      aluno_nome: aluno.nome,
      matricula: aluno.matricula,
      total_sessoes: totalSessoes,
      total_presencas: presCount,
      presencas_presencial: presPresencial,
      presencas_online: presOnline,
      frequencia: Number(freq.toFixed(1)),
    });
  }

  return res.json({
    disciplina_id: disc.id,
    disciplina_nome: disc.nome,
    modo: disc.modo,
    cor: disc.cor,
    total_sessoes: totalSessoes,
    alunos: alunosData,
  });
});

router.get('/geral', requireAuth, requireRole('admin'), async (req, res) => {
  const alunos = await prisma.user.findMany({
    where: { perfil: 'aluno', ativo: true },
    orderBy: { nome: 'asc' },
  });

  const result = [];
  for (const aluno of alunos) {
    const disciplinas = await prisma.disciplina.findMany({
      where: {
        alunos: { some: { alunoId: aluno.id } },
      },
    });

    let totalSessoesGeral = 0;
    let totalPresencasGeral = 0;
    const discData = [];

    for (const disc of disciplinas) {
      const nSessoes = await prisma.sessao.count({ where: { disciplinaId: disc.id } });
      let nPresencas = 0;
      if (nSessoes > 0) {
        nPresencas = await prisma.presenca.count({
          where: {
            alunoId: aluno.id,
            sessaoId: { in: await prisma.sessao.findMany({
              where: { disciplinaId: disc.id },
              select: { id: true },
            }).then((rows) => rows.map((row) => row.id)) },
            presente: true,
          },
        });
      }

      const freq = nSessoes > 0 ? (nPresencas / nSessoes) * 100 : 0.0;
      discData.push({
        disc_id: disc.id,
        disc_nome: disc.nome,
        cor: disc.cor,
        sessoes: nSessoes,
        presencas: nPresencas,
        freq: Number(freq.toFixed(1)),
      });
      totalSessoesGeral += nSessoes;
      totalPresencasGeral += nPresencas;
    }

    const freqGeral = totalSessoesGeral > 0 ? (totalPresencasGeral / totalSessoesGeral) * 100 : 0.0;
    result.push({
      aluno_id: aluno.id,
      aluno_nome: aluno.nome,
      matricula: aluno.matricula,
      disciplinas: discData,
      total_sessoes: totalSessoesGeral,
      total_presencas: totalPresencasGeral,
      frequencia_geral: Number(freqGeral.toFixed(1)),
    });
  }

  result.sort((a, b) => b.frequencia_geral - a.frequencia_geral);
  return res.json(result);
});

router.get('/minhas-frequencias', requireAuth, async (req, res) => {
  const current = req.user;
  if (current.perfil !== 'aluno') {
    return res.status(400).json({ detail: 'Endpoint exclusivo para alunos' });
  }

  const disciplinas = await prisma.disciplina.findMany({
    where: {
      alunos: { some: { alunoId: current.id } },
    },
  });

  const result = [];
  for (const disc of disciplinas) {
    const nSessoes = await prisma.sessao.count({ where: { disciplinaId: disc.id } });
    let nPresencas = 0;
    if (nSessoes > 0) {
      const sessaoIds = (await prisma.sessao.findMany({
        where: { disciplinaId: disc.id },
        select: { id: true },
      })).map((row) => row.id);
      nPresencas = await prisma.presenca.count({
        where: {
          alunoId: current.id,
          sessaoId: { in: sessaoIds },
          presente: true,
        },
      });
    }
    const freq = nSessoes > 0 ? (nPresencas / nSessoes) * 100 : 0.0;
    result.push({
      disc_id: disc.id,
      disc_nome: disc.nome,
      cor: disc.cor,
      sessoes: nSessoes,
      presencas: nPresencas,
      freq: Number(freq.toFixed(1)),
    });
  }

  return res.json(result);
});

export default router;
