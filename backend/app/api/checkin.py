from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone

from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.user import User
from app.models.disciplina import DisciplinaAluno
from app.models.sessao import Sessao, Presenca, MetodoCheckin, ModalidadeEnum
from app.schemas.schemas import CheckinRequest, CheckinManualBulk
from app.services.token_service import is_token_valid

router = APIRouter()


@router.post("/token")
async def checkin_by_token(
    body: CheckinRequest,
    db: AsyncSession = Depends(get_db),
    current: User = Depends(get_current_user),
):
    """Aluno faz check-in usando o token/QR code."""
    if current.perfil.value != "aluno":
        raise HTTPException(400, "Apenas alunos podem fazer check-in por token")

    # Get sessão
    sessao = await db.get(Sessao, body.sessao_id)
    if not sessao or not sessao.ativa:
        raise HTTPException(400, "Sessão não encontrada ou encerrada")

    # Validate token
    if not is_token_valid(sessao, body.token):
        raise HTTPException(400, "Token inválido ou expirado. Peça um novo ao professor.")

    # Check enrollment
    enrolled = await db.execute(
        select(DisciplinaAluno).where(
            DisciplinaAluno.disciplina_id == sessao.disciplina_id,
            DisciplinaAluno.aluno_id == current.id,
        )
    )
    if not enrolled.scalar_one_or_none():
        raise HTTPException(400, "Você não está matriculado nesta disciplina")

    # Check duplicate
    existing = await db.execute(
        select(Presenca).where(
            Presenca.sessao_id == sessao.id,
            Presenca.aluno_id == current.id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(400, "Você já marcou presença nesta sessão")

    # Create presença
    metodo = MetodoCheckin.qr if body.metodo == "qr" else MetodoCheckin.token
    presenca = Presenca(
        sessao_id=sessao.id,
        aluno_id=current.id,
        presente=True,
        modalidade=ModalidadeEnum.online,  # Online students use token
        metodo=metodo,
        checkin_em=datetime.now(timezone.utc),
    )
    db.add(presenca)
    await db.commit()

    return {"ok": True, "msg": "Presença registrada com sucesso"}


@router.post("/manual")
async def checkin_manual_bulk(
    body: CheckinManualBulk,
    db: AsyncSession = Depends(get_db),
    current: User = Depends(require_role("admin", "professor")),
):
    """Professor marca presença manual (presencial) em lote."""
    sessao = await db.get(Sessao, body.sessao_id)
    if not sessao:
        raise HTTPException(404, "Sessão não encontrada")

    created = 0
    updated = 0

    for item in body.presencas:
        aluno_id = item.get("aluno_id")
        presente = item.get("presente", True)
        modalidade = item.get("modalidade", "presencial")

        # Check if already exists
        result = await db.execute(
            select(Presenca).where(
                Presenca.sessao_id == sessao.id,
                Presenca.aluno_id == aluno_id,
            )
        )
        existing = result.scalar_one_or_none()

        if existing:
            # Only update if it was manual (don't overwrite online checkins)
            if existing.metodo == MetodoCheckin.manual:
                existing.presente = presente
                existing.modalidade = ModalidadeEnum(modalidade)
                updated += 1
        else:
            p = Presenca(
                sessao_id=sessao.id,
                aluno_id=aluno_id,
                presente=presente,
                modalidade=ModalidadeEnum(modalidade),
                metodo=MetodoCheckin.manual,
                checkin_em=datetime.now(timezone.utc),
            )
            db.add(p)
            created += 1

    await db.commit()
    return {"ok": True, "created": created, "updated": updated}
