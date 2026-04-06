import random
import string
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.models.sessao import Sessao


def generate_token(length: int = 6) -> str:
    return "".join(random.choices(string.digits, k=length))


async def rotate_token(sessao: Sessao, db: AsyncSession) -> str:
    """Generate new token and persist it."""
    token = generate_token(settings.TOKEN_LENGTH)
    sessao.token_atual = token
    sessao.token_emitido_em = datetime.now(timezone.utc)
    db.add(sessao)
    await db.commit()
    await db.refresh(sessao)
    return token


def is_token_valid(sessao: Sessao, token: str) -> bool:
    """Check if the provided token matches and hasn't expired."""
    if not sessao.ativa:
        return False
    if sessao.token_atual != token:
        return False
    if sessao.token_emitido_em is None:
        return False

    now = datetime.now(timezone.utc)
    emitido = sessao.token_emitido_em
    if emitido.tzinfo is None:
        emitido = emitido.replace(tzinfo=timezone.utc)

    # Allow a grace period of 2x the rotation interval
    expiry = emitido + timedelta(seconds=settings.TOKEN_ROTATION_SECONDS * 2)
    return now <= expiry


def get_token_info(sessao: Sessao) -> dict:
    emitido = sessao.token_emitido_em or datetime.now(timezone.utc)
    if emitido.tzinfo is None:
        emitido = emitido.replace(tzinfo=timezone.utc)
    return {
        "token": sessao.token_atual,
        "sessao_id": sessao.id,
        "disciplina_id": sessao.disciplina_id,
        "issued_at": emitido.isoformat(),
        "expires_at": (emitido + timedelta(seconds=settings.TOKEN_ROTATION_SECONDS)).isoformat(),
    }
