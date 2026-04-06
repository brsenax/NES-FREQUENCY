import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const C = {
  card: { background: '#fff', borderRadius: 12, padding: 20, marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,.05)', border: '1px solid #f1f5f9' },
  title: { margin: 0, fontSize: 16, fontWeight: 600, color: '#0f172a' },
  muted: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10, marginTop: 12 },
  field: { display: 'flex', flexDirection: 'column', gap: 4 },
  label: { fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' },
  select: { padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 14 },
  input: { padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 14 },
  btnPri: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: 12, border: 'none', borderRadius: 9, background: '#1e40af', color: '#fff', fontSize: 14, fontWeight: 600, marginTop: 16 },
  btnDanger: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: 12, border: 'none', borderRadius: 9, background: '#dc2626', color: '#fff', fontSize: 14, fontWeight: 600, marginTop: 16 },
  btnSm: { padding: '6px 14px', border: '1px solid #e2e8f0', borderRadius: 7, background: '#fff', color: '#64748b', fontSize: 12, fontWeight: 500 },
  searchBox: { display: 'flex', alignItems: 'center', gap: 6, padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 7, background: '#f8fafc', marginBottom: 10 },
  searchInput: { border: 'none', outline: 'none', background: 'none', fontSize: 14, flex: 1 },
  row: { display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 7 },
  presBtn: { display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 7, border: 'none', fontSize: 12, fontWeight: 500, minWidth: 88, justifyContent: 'center' },
  badge: { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 99, fontSize: 11, fontWeight: 500, border: 'none' },
  info: { display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: 14, padding: '12px 14px', borderRadius: 8, border: '1px solid', fontSize: 13 },
};

export default function SessaoPage() {
  const { user } = useAuth();
  const [disciplinas, setDisciplinas] = useState([]);
  const [discId, setDiscId] = useState('');
  const [descricao, setDescricao] = useState('');
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [sessao, setSessao] = useState(null);
  const [tokenInfo, setTokenInfo] = useState(null);
  const [presencas, setPresencas] = useState([]);
  const [alunosDisc, setAlunosDisc] = useState([]);
  const [presenciais, setPresenciais] = useState({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const timerRef = useRef(null);
  const pollRef = useRef(null);

  const disc = disciplinas.find(d => d.id === Number(discId));
  const isHibrido = disc?.modo === 'hibrido';

  // Load disciplinas
  useEffect(() => {
    api.listDisciplinas().then(setDisciplinas).catch(() => {});
  }, []);

  // Check for active session on load
  useEffect(() => {
    api.getActiveSessao().then(s => {
      if (s) {
        setSessao(s);
        setDiscId(String(s.disciplina_id));
        loadPresencas(s.id);
        if (s.disciplina_modo === 'hibrido') loadAlunosDisc(s.disciplina_id);
      }
    }).catch(() => {});
  }, []);

  const loadPresencas = async (sessaoId) => {
    try { const p = await api.getPresencas(sessaoId); setPresencas(p); } catch {}
  };

  const loadAlunosDisc = async (dId) => {
    try { const a = await api.listAlunosDisciplina(dId); setAlunosDisc(a); } catch {}
  };

  // Token rotation
  useEffect(() => {
    if (!sessao?.ativa) { clearInterval(timerRef.current); return; }
    const rotate = async () => {
      try {
        const info = await api.rotateToken(sessao.id);
        setTokenInfo(info);
      } catch {}
    };
    rotate(); // initial
    timerRef.current = setInterval(rotate, 20000);
    return () => clearInterval(timerRef.current);
  }, [sessao?.id, sessao?.ativa]);

  // Poll presencas
  useEffect(() => {
    if (!sessao?.ativa) { clearInterval(pollRef.current); return; }
    pollRef.current = setInterval(() => loadPresencas(sessao.id), 4000);
    return () => clearInterval(pollRef.current);
  }, [sessao?.id, sessao?.ativa]);

  const iniciar = async () => {
    if (!discId) return;
    setLoading(true);
    setError('');
    try {
      const s = await api.createSessao({ disciplina_id: Number(discId), descricao, data });
      setSessao(s);
      if (s.disciplina_modo === 'hibrido') loadAlunosDisc(s.disciplina_id);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const encerrar = async () => {
    if (!sessao) return;
    // Save manual presenciais first if hybrid
    if (isHibrido) {
      const bulk = alunosDisc.map(a => ({
        aluno_id: a.id,
        presente: !!presenciais[a.id],
        modalidade: 'presencial',
      }));
      await api.checkinManual({ sessao_id: sessao.id, presencas: bulk }).catch(() => {});
    }
    setLoading(true);
    try {
      await api.encerrarSessao(sessao.id);
      setSessao(null);
      setTokenInfo(null);
      setPresencas([]);
      setPresenciais({});
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const salvarPresenciais = async () => {
    if (!sessao) return;
    const bulk = alunosDisc.map(a => ({
      aluno_id: a.id,
      presente: !!presenciais[a.id],
      modalidade: 'presencial',
    }));
    try {
      await api.checkinManual({ sessao_id: sessao.id, presencas: bulk });
      await loadPresencas(sessao.id);
    } catch {}
  };

  const onlineCheckins = presencas.filter(p => p.presente && p.modalidade === 'online');
  const manualCheckins = presencas.filter(p => p.presente && p.modalidade === 'presencial');
  const totalPresentes = presencas.filter(p => p.presente).length;

  const onlineAlunoIds = new Set(onlineCheckins.map(p => p.aluno_id));

  const filteredAlunos = search
    ? alunosDisc.filter(a => a.nome.toLowerCase().includes(search.toLowerCase()))
    : alunosDisc;

  // ── No active session ──
  if (!sessao) return (
    <div>
      <div style={C.card}>
        <h2 style={C.title}>Iniciar Sessão de Presença</h2>
        <p style={C.muted}>Selecione a disciplina. O sistema determina o modo automaticamente.</p>

        <div style={C.grid}>
          <div style={C.field}>
            <label style={C.label}>Disciplina</label>
            <select style={C.select} value={discId} onChange={e => setDiscId(e.target.value)}>
              <option value="">Selecione...</option>
              {disciplinas.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
            </select>
          </div>
          <div style={C.field}>
            <label style={C.label}>Data</label>
            <input type="date" style={C.select} value={data} onChange={e => setData(e.target.value)} />
          </div>
          <div style={C.field}>
            <label style={C.label}>Descrição (opcional)</label>
            <input style={C.input} value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Ex: Aula 5" />
          </div>
        </div>

        {disc && (
          <div style={{ ...C.info, borderColor: disc.cor + '44', background: disc.cor + '08' }}>
            <strong style={{ color: disc.cor }}>{disc.modo === 'hibrido' ? 'Modo Híbrido' : 'Modo Código'}</strong>
            <span style={{ fontSize: 12, color: '#64748b', marginLeft: 8 }}>
              {disc.modo === 'hibrido' ? 'Código para online + chamada manual presencial' : 'Todos marcam presença pelo código na tela'}
            </span>
          </div>
        )}

        {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: 10, borderRadius: 8, marginTop: 12, fontSize: 13 }}>{error}</div>}

        <button style={C.btnPri} onClick={iniciar} disabled={!discId || loading}>
          {loading ? 'Criando...' : 'Iniciar Sessão'}
        </button>
      </div>
    </div>
  );

  // ── Active session ──
  return (
    <div>
      {/* QR Panel */}
      <div style={{ ...C.card, border: `2px solid ${sessao.disciplina_cor || '#3b82f6'}`, textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 99, background: '#dcfce7', color: '#16a34a', fontWeight: 600, fontSize: 13, marginBottom: 16, animation: 'pulse 2s infinite' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
          Sessão ativa
        </div>

        <h2 style={{ ...C.title, textAlign: 'center', fontSize: 18 }}>
          {sessao.disciplina_nome}
        </h2>
        {sessao.descricao && <p style={{ ...C.muted, textAlign: 'center' }}>{sessao.descricao}</p>}

        {isHibrido && (
          <div style={{ display: 'inline-flex', gap: 6, margin: '8px 0', padding: '4px 12px', borderRadius: 99, background: '#fef3c7', color: '#92400e', fontSize: 12, fontWeight: 600 }}>
            Modo Híbrido
          </div>
        )}

        {/* Código grande na tela */}
        <div style={{ margin: '24px 0 16px' }}>
          <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 4px', fontWeight: 500 }}>
            {isHibrido ? 'Código para alunos ONLINE:' : 'Código de presença:'}
          </p>
          <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 12px' }}>Sessão #{sessao.id}</p>
          <div style={{ display: 'inline-block', padding: '20px 40px', background: '#f8fafc', borderRadius: 16, border: `2px dashed ${sessao.disciplina_cor || '#3b82f6'}44` }}>
            <span style={{ fontSize: 64, fontWeight: 800, letterSpacing: '.2em', color: sessao.disciplina_cor || '#0f172a', fontFamily: "'Courier New',monospace", textShadow: '0 2px 8px rgba(0,0,0,.08)' }}>
              {tokenInfo?.token || '------'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b', animation: 'pulse 1s infinite' }} />
            <span style={{ fontSize: 12, color: '#94a3b8' }}>Muda a cada 20 segundos</span>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, margin: '16px 0', flexWrap: 'wrap' }}>
          {isHibrido ? (
            <>
              <StatBox value={onlineCheckins.length} label="Online" color="#0ea5e9" bg="#f0f9ff" />
              <StatBox value={manualCheckins.length} label="Presencial" color="#d97706" bg="#fef3c7" />
              <StatBox value={totalPresentes} label="Total" color="#16a34a" bg="#f0fdf4" />
            </>
          ) : (
            <StatBox value={totalPresentes} label="Check-ins" color="#16a34a" bg="#f0fdf4" />
          )}
        </div>

        {/* Online checkin list */}
        {onlineCheckins.length > 0 && (
          <details style={{ textAlign: 'left', marginTop: 8 }}>
            <summary style={{ cursor: 'pointer', fontSize: 13, color: '#3b82f6', fontWeight: 500 }}>
              Ver {onlineCheckins.length} check-in(s) online
            </summary>
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {onlineCheckins.map(p => (
                <div key={p.id} style={{ display: 'flex', gap: 8, fontSize: 13, color: '#475569' }}>
                  <span style={{ color: '#0ea5e9' }}>●</span>
                  <span style={{ fontWeight: 500 }}>{p.aluno_nome}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: '#94a3b8' }}>
                    {new Date(p.checkin_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </details>
        )}

        <button style={C.btnDanger} onClick={encerrar} disabled={loading}>
          {loading ? 'Encerrando...' : 'Encerrar e Salvar Chamada'}
        </button>
      </div>

      {/* Hybrid: manual presencial */}
      {isHibrido && (
        <div style={C.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
            <div>
              <h2 style={C.title}>Presença Presencial</h2>
              <p style={C.muted}>Marque quem está na sala. Alunos online usam o código acima.</p>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button style={C.btnSm} onClick={() => {
                const u = {}; filteredAlunos.forEach(a => { if (!onlineAlunoIds.has(a.id)) u[a.id] = true; });
                setPresenciais(prev => ({ ...prev, ...u }));
              }}>Todos presentes</button>
              <button style={{ ...C.btnSm }} onClick={() => {
                const u = {}; filteredAlunos.forEach(a => { u[a.id] = false; });
                setPresenciais(prev => ({ ...prev, ...u }));
              }}>Limpar</button>
            </div>
          </div>

          <div style={C.searchBox}>
            <input style={C.searchInput} placeholder="Buscar aluno..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {filteredAlunos.map((a, i) => {
              const isOnline = onlineAlunoIds.has(a.id);
              const isPres = presenciais[a.id];
              return (
                <div key={a.id} style={{
                  ...C.row,
                  borderLeft: `4px solid ${isOnline ? '#0ea5e9' : isPres ? '#22c55e' : '#e2e8f0'}`,
                  background: isOnline ? '#f0f9ff' : isPres ? '#f0fdf4' : '#fff',
                  animation: `fadeIn .12s ease ${i * .012}s both`,
                }}>
                  <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, color: '#94a3b8' }}>{i + 1}</span>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{a.nome}</span>
                  {isOnline ? (
                    <span style={{ ...C.badge, background: '#eff6ff', color: '#2563eb' }}>Online ✓</span>
                  ) : (
                    <button onClick={() => setPresenciais(p => ({ ...p, [a.id]: !p[a.id] }))} style={{
                      ...C.presBtn,
                      background: isPres ? '#22c55e' : '#f1f5f9',
                      color: isPres ? '#fff' : '#64748b',
                    }}>
                      {isPres ? '✓ Presente' : 'Falta'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <button style={{ ...C.btnPri, background: '#d97706' }} onClick={salvarPresenciais}>
            Salvar Presenciais
          </button>
        </div>
      )}
    </div>
  );
}

function StatBox({ value, label, color, bg }) {
  return (
    <div style={{ padding: '10px 20px', background: bg, borderRadius: 10, textAlign: 'center' }}>
      <div style={{ fontSize: 24, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 11, color: '#64748b' }}>{label}</div>
    </div>
  );
}
