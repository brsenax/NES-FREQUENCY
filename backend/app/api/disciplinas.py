from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.user import User
from app.models.disciplina import Disciplina, DisciplinaProfessor, DisciplinaAluno, ModoEnum
from app.schemas.schemas import DisciplinaOut, DisciplinaCreate

router = APIRouter()


@router.get("/", response_model=List[DisciplinaOut])
async def list_disciplinas(
    db: AsyncSession = Depends(get_db),
    current: User = Depends(get_current_user),
):
    if current.perfil.value == "professor":
        query = (
            select(Disciplina)
            .join(DisciplinaProfessor, DisciplinaProfessor.disciplina_id == Disciplina.id)
            .where(DisciplinaProfessor.professor_id == current.id, Disciplina.ativa == True)
        )
    elif current.perfil.value == "aluno":
        query = (
            select(Disciplina)
            .join(DisciplinaAluno, DisciplinaAluno.disciplina_id == Disciplina.id)
            .where(DisciplinaAluno.aluno_id == current.id, Disciplina.ativa == True)
        )
    else:
        query = select(Disciplina).where(Disciplina.ativa == True)

    result = await db.execute(query.order_by(Disciplina.nome))
    return [DisciplinaOut.model_validate(d) for d in result.scalars().all()]


@router.post("/", response_model=DisciplinaOut)
async def create_disciplina(
    body: DisciplinaCreate,
    db: AsyncSession = Depends(get_db),
    current: User = Depends(require_role("admin")),
):
    disc = Disciplina(nome=body.nome, modo=ModoEnum(body.modo), cor=body.cor)
    db.add(disc)
    await db.commit()
    await db.refresh(disc)
    return DisciplinaOut.model_validate(disc)


@router.post("/{disc_id}/professores/{prof_id}")
async def assign_professor(
    disc_id: int, prof_id: int,
    db: AsyncSession = Depends(get_db),
    current: User = Depends(require_role("admin")),
):
    db.add(DisciplinaProfessor(disciplina_id=disc_id, professor_id=prof_id))
    await db.commit()
    return {"ok": True}


@router.post("/{disc_id}/alunos/{aluno_id}")
async def enroll_aluno(
    disc_id: int, aluno_id: int,
    db: AsyncSession = Depends(get_db),
    current: User = Depends(require_role("admin", "professor")),
):
    existing = await db.execute(
        select(DisciplinaAluno).where(
            DisciplinaAluno.disciplina_id == disc_id,
            DisciplinaAluno.aluno_id == aluno_id,
        )
    )
    if existing.scalar_one_or_none():
        return {"ok": True, "msg": "já matriculado"}
    db.add(DisciplinaAluno(disciplina_id=disc_id, aluno_id=aluno_id))
    await db.commit()
    return {"ok": True}


@router.delete("/{disc_id}/alunos/{aluno_id}")
async def unenroll_aluno(
    disc_id: int, aluno_id: int,
    db: AsyncSession = Depends(get_db),
    current: User = Depends(require_role("admin", "professor")),
):
    result = await db.execute(
        select(DisciplinaAluno).where(
            DisciplinaAluno.disciplina_id == disc_id,
            DisciplinaAluno.aluno_id == aluno_id,
        )
    )
    da = result.scalar_one_or_none()
    if da:
        await db.delete(da)
        await db.commit()
    return {"ok": True}


@router.get("/{disc_id}/alunos", response_model=List[dict])
async def list_alunos_disciplina(
    disc_id: int,
    db: AsyncSession = Depends(get_db),
    current: User = Depends(require_role("admin", "professor")),
):
    result = await db.execute(
        select(User)
        .join(DisciplinaAluno, DisciplinaAluno.aluno_id == User.id)
        .where(DisciplinaAluno.disciplina_id == disc_id, User.ativo == True)
        .order_by(User.nome)
    )
    return [{"id": u.id, "nome": u.nome, "matricula": u.matricula} for u in result.scalars().all()]
