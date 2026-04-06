from sqlalchemy import Column, Integer, String, Boolean, Enum, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
import enum
from app.core.database import Base


class ModoEnum(str, enum.Enum):
    qr = "qr"
    hibrido = "hibrido"


class Disciplina(Base):
    __tablename__ = "disciplinas"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(200), nullable=False)
    modo = Column(Enum(ModoEnum), nullable=False, default=ModoEnum.qr)
    cor = Column(String(20), default="#3b82f6")
    ativa = Column(Boolean, default=True)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())

    sessoes = relationship("Sessao", back_populates="disciplina")


class DisciplinaProfessor(Base):
    __tablename__ = "disciplina_professor"

    id = Column(Integer, primary_key=True)
    disciplina_id = Column(Integer, ForeignKey("disciplinas.id"), nullable=False)
    professor_id = Column(Integer, ForeignKey("users.id"), nullable=False)


class DisciplinaAluno(Base):
    __tablename__ = "disciplina_aluno"

    id = Column(Integer, primary_key=True)
    disciplina_id = Column(Integer, ForeignKey("disciplinas.id"), nullable=False)
    aluno_id = Column(Integer, ForeignKey("users.id"), nullable=False)
