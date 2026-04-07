import { prisma } from './prisma.js';
import { hashPassword } from './services/tokenService.js';

const DISCIPLINAS = [
  { nome: 'Geometria Analítica', modo: 'qr', cor: '#0ea5e9' },
  { nome: 'Programação Estruturada', modo: 'qr', cor: '#8b5cf6' },
  { nome: 'Funções Elementares', modo: 'hibrido', cor: '#f59e0b' },
  { nome: 'Inteligência Artificial', modo: 'qr', cor: '#10b981' },
  { nome: 'Ciência dos Dados', modo: 'qr', cor: '#ec4899' },
  { nome: 'Probabilidade e Estatística', modo: 'hibrido', cor: '#f97316' },
];

const PROFESSORES = [
  { nome: 'Prof. Vitor Alves', email: 'vitor@nes.edu.br', disciplinas: [0, 1, 2, 3, 4, 5] },
  { nome: 'Prof. Maria Santos', email: 'maria@nes.edu.br', disciplinas: [0, 2, 5] },
  { nome: 'Prof. João Lima', email: 'joao@nes.edu.br', disciplinas: [1, 3, 4] },
];

const ALUNOS = [
  'Ana Beatriz Silva', 'Bruno Costa', 'Camila Ferreira', 'Daniel Oliveira',
  'Eduarda Santos', 'Felipe Souza', 'Gabriela Lima', 'Henrique Almeida',
  'Isabela Rodrigues', 'João Pedro Martins', 'Karla Nascimento', 'Lucas Pereira',
  'Mariana Barbosa', 'Nathan Carvalho', 'Olívia Ribeiro', 'Pedro Henrique Gomes',
  'Rafaela Duarte', 'Samuel Araújo', 'Tatiana Mendes', 'Vinícius Rocha',
];

async function seed() {
  const existing = await prisma.user.findFirst();
  if (existing) {
    console.log('Banco já tem dados. Pulando seed.');
    return;
  }

  const senha = hashPassword('nes2026');

  await prisma.user.create({
    data: {
      nome: 'Administrador',
      email: 'admin@nes.edu.br',
      matricula: 'ADMIN001',
      senhaHash: senha,
      perfil: 'admin',
    },
  });

  const disciplinas = [];
  for (const disc of DISCIPLINAS) {
    const created = await prisma.disciplina.create({ data: disc });
    disciplinas.push(created);
  }

  const professores = [];
  for (const prof of PROFESSORES) {
    const user = await prisma.user.create({
      data: {
        nome: prof.nome,
        email: prof.email,
        senhaHash: senha,
        perfil: 'professor',
      },
    });
    professores.push(user);
    for (const idx of prof.disciplinas) {
      await prisma.disciplinaProfessor.create({
        data: {
          disciplinaId: disciplinas[idx].id,
          professorId: user.id,
        },
      });
    }
  }

  for (let i = 0; i < ALUNOS.length; i += 1) {
    const nome = ALUNOS[i];
    const matricula = `NES${String(i + 1).padStart(4, '0')}`;
    const aluno = await prisma.user.create({
      data: {
        nome,
        matricula,
        senhaHash: senha,
        perfil: 'aluno',
      },
    });
    for (const disc of disciplinas) {
      await prisma.disciplinaAluno.create({
        data: {
          disciplinaId: disc.id,
          alunoId: aluno.id,
        },
      });
    }
  }

  console.log('='.repeat(50));
  console.log('SEED CONCLUÍDO COM SUCESSO');
  console.log('='.repeat(50));
  console.log();
  console.log('Credenciais (senha padrão: nes2026):');
  console.log();
  console.log('  ADMIN:      admin@nes.edu.br');
  console.log('  PROFESSOR:  vitor@nes.edu.br');
  console.log('  PROFESSOR:  maria@nes.edu.br');
  console.log('  PROFESSOR:  joao@nes.edu.br');
  console.log(`  ALUNOS:     NES0001 a NES${String(ALUNOS.length).padStart(4, '0')}`);
}

seed()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
