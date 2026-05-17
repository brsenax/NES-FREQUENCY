const BASE = import.meta.env.VITE_API_URL || '';

function getToken() {
  return localStorage.getItem('nes_token');
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    localStorage.removeItem('nes_token');
    localStorage.removeItem('nes_user');
    window.location.href = '/login';
    throw new Error('Não autorizado');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Erro desconhecido' }));
    throw new Error(err.detail || `Erro ${res.status}`);
  }

  if (res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

const api = {
  // Auth
  login: (login, senha) => request('/api/auth/login', { method: 'POST', body: JSON.stringify({ login, senha }) }),
  me: () => request('/api/auth/me'),

  // Users
  listUsers: (params = '') => request(`/api/users/${params ? '?' + params : ''}`),
  createUser: (data) => request('/api/users/', { method: 'POST', body: JSON.stringify(data) }),
  bulkCreateUsers: (data) => request('/api/users/bulk', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id, data) => request(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteUser: (id) => request(`/api/users/${id}`, { method: 'DELETE' }),

  // Disciplinas
  listDisciplinas: () => request('/api/disciplinas/'),
  createDisciplina: (data) => request('/api/disciplinas/', { method: 'POST', body: JSON.stringify(data) }),
  deleteDisciplina: (id) => request(`/api/disciplinas/${id}`, { method: 'DELETE' }),
  assignProfessor: (discId, profId) => request(`/api/disciplinas/${discId}/professores/${profId}`, { method: 'POST' }),
  enrollAluno: (discId, alunoId) => request(`/api/disciplinas/${discId}/alunos/${alunoId}`, { method: 'POST' }),
  unenrollAluno: (discId, alunoId) => request(`/api/disciplinas/${discId}/alunos/${alunoId}`, { method: 'DELETE' }),
  listAlunosDisciplina: (discId) => request(`/api/disciplinas/${discId}/alunos`),

  // Sessões
  createSessao: (data) => request('/api/sessoes/', { method: 'POST', body: JSON.stringify(data) }),
  getActiveSessao: () => request('/api/sessoes/ativa'),
  rotateToken: (sessaoId) => request(`/api/sessoes/${sessaoId}/rotate-token`, { method: 'POST' }),
  getTokenInfo: (sessaoId) => request(`/api/sessoes/${sessaoId}/token-info`),
  encerrarSessao: (sessaoId) => request(`/api/sessoes/${sessaoId}/encerrar`, { method: 'POST' }),
  getHistorico: (discId) => request(`/api/sessoes/historico${discId ? '?disciplina_id=' + discId : ''}`),
  getPresencas: (sessaoId) => request(`/api/sessoes/${sessaoId}/presencas`),
  deleteSessao: (sessaoId) => request(`/api/sessoes/${sessaoId}`, { method: 'DELETE' }),

  // Checkin
  checkinToken: (data) => request('/api/checkin/token', { method: 'POST', body: JSON.stringify(data) }),
  checkinManual: (data) => request('/api/checkin/manual', { method: 'POST', body: JSON.stringify(data) }),

  // Relatórios
  relatorioDisciplina: (discId) => request(`/api/relatorios/disciplina/${discId}`),
  relatorioGeral: () => request('/api/relatorios/geral'),
  minhasFrequencias: () => request('/api/relatorios/minhas-frequencias'),
};

export default api;
