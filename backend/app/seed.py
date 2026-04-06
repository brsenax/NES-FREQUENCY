"""
Seed inicial do NES.
Roda com: python -m app.seed
"""
import asyncio
from app.core.database import engine, Base, async_session
from app.core.security import hash_password
from app.models.user import User, PerfilEnum
from app.models.disciplina import Disciplina, DisciplinaProfessor, DisciplinaAluno, ModoEnum
from sqlalchemy import select


DISCIPLINAS = [
    {"nome": "Geometria Analítica",        "modo": "qr",      "cor": "#0ea5e9"},
    {"nome": "Programação Estruturada",     "modo": "qr",      "cor": "#8b5cf6"},
    {"nome": "Funções Elementares",         "modo": "hibrido", "cor": "#f59e0b"},
    {"nome": "Inteligência Artificial",     "modo": "qr",      "cor": "#10b981"},
    {"nome": "Ciência dos Dados",           "modo": "qr",      "cor": "#ec4899"},
    {"nome": "Probabilidade e Estatística", "modo": "hibrido", "cor": "#f97316"},
]

PROFESSORES = [
    {"nome": "Prof. Vitor Alves",  "email": "vitor@nes.edu.br",  "disciplinas": [0, 1, 2, 3, 4, 5]},
    {"nome": "Prof. Maria Santos", "email": "maria@nes.edu.br",  "disciplinas": [0, 2, 5]},
    {"nome": "Prof. João Lima",    "email": "joao@nes.edu.br",   "disciplinas": [1, 3, 4]},
]

ALUNOS = [
    "Ana Beatriz Silva", "Bruno Costa", "Camila Ferreira", "Daniel Oliveira",
    "Eduarda Santos", "Felipe Souza", "Gabriela Lima", "Henrique Almeida",
    "Isabela Rodrigues", "João Pedro Martins", "Karla Nascimento", "Lucas Pereira",
    "Mariana Barbosa", "Nathan Carvalho", "Olívia Ribeiro", "Pedro Henrique Gomes",
    "Rafaela Duarte", "Samuel Araújo", "Tatiana Mendes", "Vinícius Rocha",
]


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as db:
        # Check if already seeded
        result = await db.execute(select(User).limit(1))
        if result.scalar_one_or_none():
            print("Banco já tem dados. Pulando seed.")
            return

        senha = hash_password("nes2026")

        # Admin
        admin = User(
            nome="Administrador",
            email="admin@nes.edu.br",
            matricula="ADMIN001",
            senha_hash=senha,
            perfil=PerfilEnum.admin,
        )
        db.add(admin)

        # Disciplinas
        discs = []
        for d in DISCIPLINAS:
            disc = Disciplina(nome=d["nome"], modo=ModoEnum(d["modo"]), cor=d["cor"])
            db.add(disc)
            discs.append(disc)
        await db.flush()

        # Professores
        profs = []
        for p in PROFESSORES:
            prof = User(
                nome=p["nome"],
                email=p["email"],
                senha_hash=senha,
                perfil=PerfilEnum.professor,
            )
            db.add(prof)
            await db.flush()
            for idx in p["disciplinas"]:
                db.add(DisciplinaProfessor(disciplina_id=discs[idx].id, professor_id=prof.id))
            profs.append(prof)

        # Alunos
        for i, nome in enumerate(ALUNOS):
            mat = f"NES{str(i + 1).zfill(4)}"
            aluno = User(
                nome=nome,
                matricula=mat,
                senha_hash=senha,
                perfil=PerfilEnum.aluno,
            )
            db.add(aluno)
            await db.flush()

            # Matricular em disciplinas (todos nas 6)
            for disc in discs:
                db.add(DisciplinaAluno(disciplina_id=disc.id, aluno_id=aluno.id))

        await db.commit()

        print("=" * 50)
        print("SEED CONCLUÍDO COM SUCESSO")
        print("=" * 50)
        print()
        print("Credenciais (senha padrão: nes2026):")
        print()
        print("  ADMIN:      admin@nes.edu.br")
        print("  PROFESSOR:  vitor@nes.edu.br")
        print("  PROFESSOR:  maria@nes.edu.br")
        print("  PROFESSOR:  joao@nes.edu.br")
        print(f"  ALUNOS:     NES0001 a NES{str(len(ALUNOS)).zfill(4)}")
        print()


if __name__ == "__main__":
    asyncio.run(seed())
