from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timezone
from typing import List, Optional

from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.user import User
from app.models.disciplina import Disciplina, DisciplinaProfessor
from app.models.sessao import Sessao, Presenca
from app.schemas.schemas import SessaoCreate, SessaoOut
from app.services.token_service import rotate_token, get_token_info

router = APIRouter()


def _sessao_out(s: Sessao, disc: Disciplina = None, checkin_count: int = 0) -> dict:
    return {
        "id": s.id,
        "disciplina_id": s.disciplina_id,
        "disciplina_nome": disc.nome if disc else None,
        "disciplina_modo": disc.modo.value if disc else None,
        "disciplina_cor": disc.cor if disc else None,
        "professor_id": s.professor_id,
        "descricao": s.descricao,
        "data": s.data,
        "token_atual": s.token_atual,
        "token_emitido_em": s.token_emitido_em,
        "ativa": s.ativa,
        "criado_em": s.criado_em,
        "encerrado_em": s.encerrado_em,
        "total_checkins": checkin_count,
    }


@router.post("/", response_model=SessaoOut)
async def create_sessao(
    body: SessaoCreate,
    db: AsyncSession = Depends(get_db),
    current: User = Depends(require_role("admin", "professor")),
):
    # Validate professor has access
    if current.perfil.value == "professor":
        check = await db.execute(
            select(DisciplinaProfessor).where(
                DisciplinaProfessor.disciplina_id == body.disciplina_id,
                DisciplinaProfessor.professor_id == current.id,
            )
        )
        if not check.scalar_one_or_none():
            raise HTTPException(403, "Sem acesso a esta disciplina")

    # Deactivate any active session for this professor
    active = await db.execute(
        select(Sessao).where(Sessao.professor_id == current.id, Sessao.ativa == True)
    )
    for s in active.scalars().all():
        s.ativa = False
        s.encerrado_em = datetime.now(timezone.utc)

    data = body.data or datetime.now(timezone.utc).strftime("%Y-%m-%d")
    sessao = Sessao(
        disciplina_id=body.disciplina_id,
        professor_id=current.id,
        descricao=body.descricao,
        data=data,
    )
    db.add(sessao)
    await db.flush()

    # Generate first token
    await rotate_token(sessao, db)

    disc = await db.get(Disciplina, body.disciplina_id)
    return SessaoOut(**_sessao_out(sessao, disc))


@router.post("/{sessao_id}/rotate-token")
async def rotate(
    sessao_id: int,
    db: AsyncSession = Depends(get_db),
    current: User = Depends(require_role("admin", "professor")),
):
    sessao = await db.get(Sessao, sessao_id)
    if not sessao or not sessao.ativa:
        raise HTTPException(404, "Sessão não encontrada ou encerrada")
    if sessao.professor_id != current.id and current.perfil.value != "admin":
        raise HTTPException(403, "Sem permissão")

    token = await rotate_token(sessao, db)
    return get_token_info(sessao)


@router.get("/{sessao_id}/token-info")
async def token_info(
    sessao_id: int,
    db: AsyncSession = Depends(get_db),
    current: User = Depends(require_role("admin", "professor")),
):
    sessao = await db.get(Sessao, sessao_id)
    if not sessao:
        raise HTTPException(404, "Sessão não encontrada")
    return get_token_info(sessao)


@router.post("/{sessao_id}/encerrar", response_model=SessaoOut)
async def encerrar_sessao(
    sessao_id: int,
    db: AsyncSession = Depends(get_db),
    current: User = Depends(require_role("admin", "professor")),
):
    sessao = await db.get(Sessao, sessao_id)
    if not sessao:
        raise HTTPException(404, "Sessão não encontrada")
    if sessao.professor_id != current.id and current.perfil.value != "admin":
        raise HTTPException(403, "Sem permissão")

    sessao.ativa = False
    sessao.encerrado_em = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(sessao)

    disc = await db.get(Disciplina, sessao.disciplina_id)
    count = await db.execute(
        select(func.count()).select_from(Presenca).where(
            Presenca.sessao_id == sessao.id, Presenca.presente == True
        )
    )
    return SessaoOut(**_sessao_out(sessao, disc, count.scalar()))


@router.get("/ativa")
async def get_active(
    db: AsyncSession = Depends(get_db),
    current: User = Depends(require_role("admin", "professor")),
):
    query = select(Sessao).where(Sessao.ativa == True)
    if current.perfil.value == "professor":
        query = query.where(Sessao.professor_id == current.id)

    result = await db.execute(query)
    sessao = result.scalar_one_or_none()
    if not sessao:
        return None

    disc = await db.get(Disciplina, sessao.disciplina_id)
    count_result = await db.execute(
        select(func.count()).select_from(Presenca).where(
            Presenca.sessao_id == sessao.id, Presenca.presente == True
        )
    )
    return SessaoOut(**_sessao_out(sessao, disc, count_result.scalar()))


@router.get("/historico", response_model=List[SessaoOut])
async def historico(
    disciplina_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    current: User = Depends(require_role("admin", "professor")),
):
    query = select(Sessao)
    if current.perfil.value == "professor":
        query = query.where(Sessao.professor_id == current.id)
    if disciplina_id:
        query = query.where(Sessao.disciplina_id == disciplina_id)
    query = query.order_by(Sessao.data.desc(), Sessao.criado_em.desc())

    result = await db.execute(query)
    sessoes = result.scalars().all()

    out = []
    for s in sessoes:
        disc = await db.get(Disciplina, s.disciplina_id)
        count_result = await db.execute(
            select(func.count()).select_from(Presenca).where(
                Presenca.sessao_id == s.id, Presenca.presente == True
            )
        )
        out.append(SessaoOut(**_sessao_out(s, disc, count_result.scalar())))
    return out


@router.get("/{sessao_id}/presencas")
async def get_presencas(
    sessao_id: int,
    db: AsyncSession = Depends(get_db),
    current: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Presenca, User.nome).join(User, User.id == Presenca.aluno_id).where(
            Presenca.sessao_id == sessao_id
        ).order_by(User.nome)
    )
    return [
        {
            "id": p.id,
            "sessao_id": p.sessao_id,
            "aluno_id": p.aluno_id,
            "aluno_nome": nome,
            "presente": p.presente,
            "modalidade": p.modalidade.value,
            "metodo": p.metodo.value,
            "checkin_em": p.checkin_em,
        }
        for p, nome in result.all()
    ]


@router.delete("/{sessao_id}")
async def delete_sessao(
    sessao_id: int,
    db: AsyncSession = Depends(get_db),
    current: User = Depends(require_role("admin")),
):
    sessao = await db.get(Sessao, sessao_id)
    if not sessao:
        raise HTTPException(404)
    # Delete presencas first
    await db.execute(
        Presenca.__table__.delete().where(Presenca.sessao_id == sessao_id)
    )
    await db.delete(sessao)
    await db.commit()
    return {"ok": True}
