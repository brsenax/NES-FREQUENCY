from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# ── Auth ──
class LoginRequest(BaseModel):
    login: str  # email ou matrícula
    senha: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"


# ── User ──
class UserCreate(BaseModel):
    nome: str
    email: Optional[str] = None
    matricula: Optional[str] = None
    senha: str
    perfil: str = "aluno"


class UserUpdate(BaseModel):
    nome: Optional[str] = None
    email: Optional[str] = None
    matricula: Optional[str] = None
    senha: Optional[str] = None
    ativo: Optional[bool] = None


class UserOut(BaseModel):
    id: int
    nome: str
    email: Optional[str]
    matricula: Optional[str]
    perfil: str
    ativo: bool

    class Config:
        from_attributes = True


class UserBulkCreate(BaseModel):
    nomes: List[str]
    perfil: str = "aluno"
    disciplina_ids: List[int] = []
    senha_padrao: str = "nes2026"


# ── Disciplina ──
class DisciplinaOut(BaseModel):
    id: int
    nome: str
    modo: str
    cor: str
    ativa: bool

    class Config:
        from_attributes = True


class DisciplinaCreate(BaseModel):
    nome: str
    modo: str = "qr"
    cor: str = "#3b82f6"


# ── Sessão ──
class SessaoCreate(BaseModel):
    disciplina_id: int
    descricao: Optional[str] = None
    data: Optional[str] = None  # YYYY-MM-DD, default hoje


class SessaoOut(BaseModel):
    id: int
    disciplina_id: int
    disciplina_nome: Optional[str] = None
    disciplina_modo: Optional[str] = None
    disciplina_cor: Optional[str] = None
    professor_id: int
    descricao: Optional[str]
    data: str
    token_atual: Optional[str]
    token_emitido_em: Optional[datetime]
    ativa: bool
    criado_em: datetime
    encerrado_em: Optional[datetime]
    total_checkins: int = 0

    class Config:
        from_attributes = True


class TokenInfo(BaseModel):
    token: str
    sessao_id: int
    disciplina_id: int
    issued_at: datetime
    expires_at: datetime


# ── Checkin ──
class CheckinRequest(BaseModel):
    sessao_id: int
    token: str
    metodo: str = "token"  # "token" ou "qr"


class CheckinManualRequest(BaseModel):
    sessao_id: int
    aluno_id: int
    presente: bool = True
    modalidade: str = "presencial"


class CheckinManualBulk(BaseModel):
    sessao_id: int
    presencas: List[dict]  # [{aluno_id, presente, modalidade}]


class PresencaOut(BaseModel):
    id: int
    sessao_id: int
    aluno_id: int
    aluno_nome: Optional[str] = None
    presente: bool
    modalidade: str
    metodo: str
    checkin_em: datetime

    class Config:
        from_attributes = True


# ── Relatório ──
class FrequenciaAluno(BaseModel):
    aluno_id: int
    aluno_nome: str
    matricula: Optional[str]
    total_sessoes: int
    total_presencas: int
    presencas_presencial: int
    presencas_online: int
    frequencia: float  # percentual


class RelatorioDisciplina(BaseModel):
    disciplina_id: int
    disciplina_nome: str
    modo: str
    cor: str
    total_sessoes: int
    alunos: List[FrequenciaAluno]


class RelatorioGeral(BaseModel):
    aluno_id: int
    aluno_nome: str
    matricula: Optional[str]
    disciplinas: List[dict]  # [{disc_id, disc_nome, sessoes, presencas, freq}]
    total_sessoes: int
    total_presencas: int
    frequencia_geral: float


# Forward ref
TokenResponse.model_rebuild()
