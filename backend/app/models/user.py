import enum
from sqlalchemy import Column, Integer, String, Boolean, Enum, DateTime, func
from app.core.database import Base


class PerfilEnum(str, enum.Enum):
    admin = "admin"
    professor = "professor"
    aluno = "aluno"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(200), nullable=False)
    email = Column(String(200), unique=True, nullable=True)
    matricula = Column(String(50), unique=True, nullable=True)
    senha_hash = Column(String(200), nullable=False)
    perfil = Column(Enum(PerfilEnum), nullable=False, default=PerfilEnum.aluno)
    ativo = Column(Boolean, default=True)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())
    atualizado_em = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
