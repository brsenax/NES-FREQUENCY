import enum
from sqlalchemy import Column, Integer, String, Boolean, Enum, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class Sessao(Base):
    __tablename__ = "sessoes"

    id = Column(Integer, primary_key=True, index=True)
    disciplina_id = Column(Integer, ForeignKey("disciplinas.id"), nullable=False)
    professor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    descricao = Column(String(300), nullable=True)
    data = Column(String(10), nullable=False)  # YYYY-MM-DD
    token_atual = Column(String(10), nullable=True)
    token_emitido_em = Column(DateTime(timezone=True), nullable=True)
    ativa = Column(Boolean, default=True)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())
    encerrado_em = Column(DateTime(timezone=True), nullable=True)

    disciplina = relationship("Disciplina", back_populates="sessoes")
    presencas = relationship("Presenca", back_populates="sessao")


class MetodoCheckin(str, enum.Enum):
    qr = "qr"
    token = "token"
    manual = "manual"


class ModalidadeEnum(str, enum.Enum):
    presencial = "presencial"
    online = "online"


class Presenca(Base):
    __tablename__ = "presencas"

    id = Column(Integer, primary_key=True, index=True)
    sessao_id = Column(Integer, ForeignKey("sessoes.id"), nullable=False)
    aluno_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    presente = Column(Boolean, default=True)
    modalidade = Column(Enum(ModalidadeEnum), default=ModalidadeEnum.presencial)
    metodo = Column(Enum(MetodoCheckin), default=MetodoCheckin.token)
    checkin_em = Column(DateTime(timezone=True), server_default=func.now())

    sessao = relationship("Sessao", back_populates="presencas")
