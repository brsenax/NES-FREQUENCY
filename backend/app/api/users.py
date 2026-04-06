from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional

from app.core.database import get_db
from app.core.security import get_current_user, require_role, hash_password
from app.models.user import User, PerfilEnum
from app.models.disciplina import DisciplinaAluno
from app.schemas.schemas import UserCreate, UserUpdate, UserOut, UserBulkCreate

router = APIRouter()


@router.get("/", response_model=List[UserOut])
async def list_users(
    perfil: Optional[str] = None,
    disciplina_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    current: User = Depends(require_role("admin", "professor")),
):
    query = select(User).where(User.ativo == True)
    if perfil:
        query = query.where(User.perfil == perfil)
    if disciplina_id:
        query = query.join(DisciplinaAluno, DisciplinaAluno.aluno_id == User.id).where(
            DisciplinaAluno.disciplina_id == disciplina_id
        )
    query = query.order_by(User.nome)
    result = await db.execute(query)
    return [UserOut.model_validate(u) for u in result.scalars().all()]


@router.post("/", response_model=UserOut)
async def create_user(
    body: UserCreate,
    db: AsyncSession = Depends(get_db),
    current: User = Depends(require_role("admin")),
):
    user = User(
        nome=body.nome,
        email=body.email,
        matricula=body.matricula,
        senha_hash=hash_password(body.senha),
        perfil=PerfilEnum(body.perfil),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return UserOut.model_validate(user)


@router.post("/bulk", response_model=dict)
async def bulk_create(
    body: UserBulkCreate,
    db: AsyncSession = Depends(get_db),
    current: User = Depends(require_role("admin")),
):
    created = 0
    senha_hash = hash_password(body.senha_padrao)
    for nome in body.nomes:
        nome = nome.strip()
        if not nome:
            continue
        # Generate matrícula
        mat = f"NES{str(created + 1).zfill(4)}{nome[:2].upper()}"
        # Check uniqueness
        existing = await db.execute(select(User).where(User.matricula == mat))
        if existing.scalar_one_or_none():
            import random
            mat = f"NES{random.randint(1000,9999)}{nome[:2].upper()}"

        user = User(
            nome=nome,
            matricula=mat,
            senha_hash=senha_hash,
            perfil=PerfilEnum(body.perfil),
        )
        db.add(user)
        await db.flush()

        for disc_id in body.disciplina_ids:
            db.add(DisciplinaAluno(disciplina_id=disc_id, aluno_id=user.id))

        created += 1

    await db.commit()
    return {"criados": created}


@router.put("/{user_id}", response_model=UserOut)
async def update_user(
    user_id: int,
    body: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current: User = Depends(require_role("admin")),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "Usuário não encontrado")

    if body.nome is not None:
        user.nome = body.nome
    if body.email is not None:
        user.email = body.email
    if body.matricula is not None:
        user.matricula = body.matricula
    if body.senha is not None:
        user.senha_hash = hash_password(body.senha)
    if body.ativo is not None:
        user.ativo = body.ativo

    await db.commit()
    await db.refresh(user)
    return UserOut.model_validate(user)


@router.delete("/{user_id}")
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current: User = Depends(require_role("admin")),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "Usuário não encontrado")
    user.ativo = False
    await db.commit()
    return {"ok": True}
