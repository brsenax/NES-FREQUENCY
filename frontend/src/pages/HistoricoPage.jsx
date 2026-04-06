import { useState, useEffect } from 'react';
import api from '../services/api';

const C = {
  card: { background: '#fff', borderRadius: 12, padding: 20, marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,.05)', border: '1px solid #f1f5f9' },
  title: { margin: 0, fontSize: 16, fontWeight: 600, color: '#0f172a' },
  muted: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
  select: { padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 14 },
  row: { display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 7, cursor: 'pointer' },
  dot: { width: 8, height: 8, borderRadius: '50%', display: 'inline-block' },
  badge: { display: 'inline-flex', padding: '3px 9px', borderRadius: 99, fontSize: 10, fontWeight: 500 },
  expBox: { padding: '8px 14px 14px 40px', display: 'flex', flexDirection: 'column', gap: 4, background: '#f8fafc', borderRadius: '0 0 7px 7px', marginTop: -3 },
};

export default function HistoricoPage() {
  const [disciplinas, setDisciplinas] = useState([]);
  const [sessoes, setSessoes] = useState([]);
  const [filterDisc, setFilterDisc] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [presencas, setPresencas] = useState({});

  useEffect(() => {
    api.listDisciplinas().then(setDisciplinas).catch(() => {});
  }, []);

  useEffect(() => { loadSessoes(); }, [filterDisc]);

  const loadSessoes = async () => {
    try { setSessoes(await api.getHistorico(filterDisc || null)); } catch {}
  };

  const toggleExpand = async (id) => {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    if (!presencas[id]) {
      try {
        const p = await api.getPresencas(id);
        setPresencas(prev => ({ ...prev, [id]: p }));
      } catch {}
    }
  };

  const fmtDate = d => { try { return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR'); } catch { return d; } };

  return (
    <div>
      <div style={C.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div><h2 style={C.title}>Histórico de Chamadas</h2><p style={C.muted}>{sessoes.length} sessões</p></div>
          <select style={{ ...C.select, width: 200 }} value={filterDisc} onChange={e => setFilterDisc(e.target.value)}>
            <option value="">Todas</option>
            {disciplinas.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
          </select>
        </div>

        {sessoes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 28, color: '#94a3b8', fontSize: 13 }}>Sem registros.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 12 }}>
            {sessoes.map(s => {
              const isExp = expanded === s.id;
              const pList = presencas[s.id] || [];
              const presentes = pList.filter(p => p.presente);
              const online = presentes.filter(p => p.modalidade === 'online');

              return (
                <div key={s.id}>
                  <div onClick={() => toggleExpand(s.id)}
                    style={{ ...C.row, borderLeft: `4px solid ${s.disciplina_cor || '#94a3b8'}` }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ ...C.dot, background: s.disciplina_cor }} />
                        {s.disciplina_nome}
                        {s.disciplina_modo === 'hibrido' && <span style={{ ...C.badge, background: '#fef3c7', color: '#92400e' }}>Híbrido</span>}
                      </div>
                      <div style={C.muted}>
                        {fmtDate(s.data)}{s.descricao && ` · ${s.descricao}`} · {s.total_checkins} presenças
                      </div>
                    </div>
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>{isExp ? '▲' : '▼'}</span>
                  </div>

                  {isExp && (
                    <div style={C.expBox}>
                      {pList.length === 0 ? (
                        <div style={{ fontSize: 12, color: '#94a3b8' }}>Carregando...</div>
                      ) : (
                        pList.map(p => (
                          <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: '#475569', padding: '3px 0' }}>
                            <span style={{ color: p.presente ? '#22c55e' : '#ef4444' }}>{p.presente ? '✓' : '✗'}</span>
                            <span style={{ flex: 1 }}>{p.aluno_nome}</span>
                            {p.presente && s.disciplina_modo === 'hibrido' && (
                              <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4,
                                background: p.modalidade === 'online' ? '#eff6ff' : '#fef3c7',
                                color: p.modalidade === 'online' ? '#2563eb' : '#92400e' }}>
                                {p.modalidade}
                              </span>
                            )}
                            <span style={{ fontSize: 10, color: '#cbd5e1' }}>{p.metodo}</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
