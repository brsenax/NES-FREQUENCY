from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional

from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.user import User
from app.models.disciplina import Disciplina, DisciplinaProfessor, DisciplinaAluno
from app.models.sessao import Sessao, Presenca

router = APIRouter()


@router.get("/disciplina/{disc_id}")
async def relatorio_disciplina(
    disc_id: int,
    db: AsyncSession = Depends(get_db),
    current: User = Depends(require_role("admin", "professor")),
):
    """Relatório de frequência de uma disciplina específica."""
    disc = await db.get(Disciplina, disc_id)
    if not disc:
        raise HTTPException(404, "Disciplina não encontrada")

    if current.perfil.value == "professor":
        check = await db.execute(
            select(DisciplinaProfessor).where(
                DisciplinaProfessor.disciplina_id == disc_id,
                DisciplinaProfessor.professor_id == current.id,
            )
        )
        if not check.scalar_one_or_none():
            raise HTTPException(403, "Sem acesso a esta disciplina")

    # Total de sessões da disciplina
    sess_result = await db.execute(
        select(func.count()).select_from(Sessao).where(Sessao.disciplina_id == disc_id)
    )
    total_sessoes = sess_result.scalar()

    # Alunos matriculados
    alunos_result = await db.execute(
        select(User)
        .join(DisciplinaAluno, DisciplinaAluno.aluno_id == User.id)
        .where(DisciplinaAluno.disciplina_id == disc_id, User.ativo == True)
        .order_by(User.nome)
    )
    alunos = alunos_result.scalars().all()

    # Sessão IDs
    sess_ids_result = await db.execute(
        select(Sessao.id).where(Sessao.disciplina_id == disc_id)
    )
    sess_ids = [r[0] for r in sess_ids_result.all()]

    alunos_data = []
    for aluno in alunos:
        if not sess_ids:
            alunos_data.append({
                "aluno_id": aluno.id,
                "aluno_nome": aluno.nome,
                "matricula": aluno.matricula,
                "total_sessoes": 0,
                "total_presencas": 0,
                "presencas_presencial": 0,
                "presencas_online": 0,
                "frequencia": 0.0,
            })
            continue

        pres_result = await db.execute(
            select(Presenca).where(
                Presenca.aluno_id == aluno.id,
                Presenca.sessao_id.in_(sess_ids),
                Presenca.presente == True,
            )
        )
        presencas = pres_result.scalars().all()
        pres_count = len(presencas)
        pres_presencial = sum(1 for p in presencas if p.modalidade.value == "presencial")
        pres_online = sum(1 for p in presencas if p.modalidade.value == "online")
        freq = (pres_count / total_sessoes * 100) if total_sessoes > 0 else 0.0

        alunos_data.append({
            "aluno_id": aluno.id,
            "aluno_nome": aluno.nome,
            "matricula": aluno.matricula,
            "total_sessoes": total_sessoes,
            "total_presencas": pres_count,
            "presencas_presencial": pres_presencial,
            "presencas_online": pres_online,
            "frequencia": round(freq, 1),
        })

    return {
        "disciplina_id": disc.id,
        "disciplina_nome": disc.nome,
        "modo": disc.modo.value,
        "cor": disc.cor,
        "total_sessoes": total_sessoes,
        "alunos": alunos_data,
    }


@router.get("/geral")
async def relatorio_geral(
    db: AsyncSession = Depends(get_db),
    current: User = Depends(require_role("admin")),
):
    """Relatório geral consolidado — somente admin."""
    alunos_result = await db.execute(
        select(User).where(User.perfil == "aluno", User.ativo == True).order_by(User.nome)
    )
    alunos = alunos_result.scalars().all()

    result = []
    for aluno in alunos:
        # Disciplinas do aluno
        disc_result = await db.execute(
            select(Disciplina)
            .join(DisciplinaAluno, DisciplinaAluno.disciplina_id == Disciplina.id)
            .where(DisciplinaAluno.aluno_id == aluno.id)
        )
        disciplinas = disc_result.scalars().all()

        total_sessoes_geral = 0
        total_presencas_geral = 0
        disc_data = []

        for disc in disciplinas:
            sess_count = await db.execute(
                select(func.count()).select_from(Sessao).where(Sessao.disciplina_id == disc.id)
            )
            n_sessoes = sess_count.scalar()

            sess_ids_r = await db.execute(
                select(Sessao.id).where(Sessao.disciplina_id == disc.id)
            )
            sess_ids = [r[0] for r in sess_ids_r.all()]

            n_presencas = 0
            if sess_ids:
                pres_r = await db.execute(
                    select(func.count()).select_from(Presenca).where(
                        Presenca.aluno_id == aluno.id,
                        Presenca.sessao_id.in_(sess_ids),
                        Presenca.presente == True,
                    )
                )
                n_presencas = pres_r.scalar()

            freq = (n_presencas / n_sessoes * 100) if n_sessoes > 0 else 0.0
            disc_data.append({
                "disc_id": disc.id,
                "disc_nome": disc.nome,
                "cor": disc.cor,
                "sessoes": n_sessoes,
                "presencas": n_presencas,
                "freq": round(freq, 1),
            })
            total_sessoes_geral += n_sessoes
            total_presencas_geral += n_presencas

        freq_geral = (total_presencas_geral / total_sessoes_geral * 100) if total_sessoes_geral > 0 else 0.0

        result.append({
            "aluno_id": aluno.id,
            "aluno_nome": aluno.nome,
            "matricula": aluno.matricula,
            "disciplinas": disc_data,
            "total_sessoes": total_sessoes_geral,
            "total_presencas": total_presencas_geral,
            "frequencia_geral": round(freq_geral, 1),
        })

    # Sort by frequencia_geral desc
    result.sort(key=lambda x: x["frequencia_geral"], reverse=True)
    return result


@router.get("/minhas-frequencias")
async def minhas_frequencias(
    db: AsyncSession = Depends(get_db),
    current: User = Depends(get_current_user),
):
    """Aluno vê suas próprias frequências."""
    if current.perfil.value != "aluno":
        raise HTTPException(400, "Endpoint exclusivo para alunos")

    disc_result = await db.execute(
        select(Disciplina)
        .join(DisciplinaAluno, DisciplinaAluno.disciplina_id == Disciplina.id)
        .where(DisciplinaAluno.aluno_id == current.id)
    )
    disciplinas = disc_result.scalars().all()

    result = []
    for disc in disciplinas:
        sess_count = await db.execute(
            select(func.count()).select_from(Sessao).where(Sessao.disciplina_id == disc.id)
        )
        n_sessoes = sess_count.scalar()

        sess_ids_r = await db.execute(
            select(Sessao.id).where(Sessao.disciplina_id == disc.id)
        )
        sess_ids = [r[0] for r in sess_ids_r.all()]

        n_presencas = 0
        if sess_ids:
            pres_r = await db.execute(
                select(func.count()).select_from(Presenca).where(
                    Presenca.aluno_id == current.id,
                    Presenca.sessao_id.in_(sess_ids),
                    Presenca.presente == True,
                )
            )
            n_presencas = pres_r.scalar()

        freq = (n_presencas / n_sessoes * 100) if n_sessoes > 0 else 0.0
        result.append({
            "disc_id": disc.id,
            "disc_nome": disc.nome,
            "cor": disc.cor,
            "sessoes": n_sessoes,
            "presencas": n_presencas,
            "freq": round(freq, 1),
        })

    return result
