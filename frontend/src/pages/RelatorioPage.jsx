import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const C = {
  card: { background: '#fff', borderRadius: 12, padding: 20, marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,.05)', border: '1px solid #f1f5f9' },
  title: { margin: 0, fontSize: 16, fontWeight: 600, color: '#0f172a' },
  muted: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
  select: { padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 14 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 10, marginBottom: 16 },
  statCard: { background: '#fff', borderRadius: 10, padding: 14, textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,.04)', border: '1px solid #f1f5f9' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 12 },
  th: { padding: '8px 8px', textAlign: 'center', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: '.03em', color: '#64748b', borderBottom: '2px solid #e2e8f0' },
  td: { padding: '8px 8px', textAlign: 'center', borderBottom: '1px solid #f1f5f9' },
};

function FreqBadge({ freq }) {
  if (freq === null || freq === undefined) return <span style={{ color: '#cbd5e1' }}>—</span>;
  const color = freq >= 75 ? '#16a34a' : freq >= 50 ? '#d97706' : '#dc2626';
  const bg = freq >= 75 ? '#dcfce7' : freq >= 50 ? '#fef3c7' : '#fef2f2';
  return <span style={{ display: 'inline-block', padding: '2px 7px', borderRadius: 4, fontSize: 12, fontWeight: 700, background: bg, color }}>{freq}%</span>;
}

export default function RelatorioPage() {
  const { user } = useAuth();
  const isAdmin = user?.perfil === 'admin';

  return isAdmin ? <RelatorioAdmin /> : <RelatorioProfessor />;
}

function RelatorioProfessor() {
  const [disciplinas, setDisciplinas] = useState([]);
  const [discId, setDiscId] = useState('');
  const [relatorio, setRelatorio] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { api.listDisciplinas().then(setDisciplinas).catch(() => {}); }, []);

  useEffect(() => {
    if (!discId) { setRelatorio(null); return; }
    setLoading(true);
    api.relatorioDisciplina(discId).then(setRelatorio).catch(() => {}).finally(() => setLoading(false));
  }, [discId]);

  const emRisco = relatorio?.alunos?.filter(a => a.frequencia < 50 && a.total_sessoes > 0) || [];

  return (
    <div>
      <div style={C.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <h2 style={C.title}>Relatório de Frequência</h2>
          <select style={{ ...C.select, width: 240 }} value={discId} onChange={e => setDiscId(e.target.value)}>
            <option value="">Selecione uma disciplina</option>
            {disciplinas.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
          </select>
        </div>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: 28, color: '#94a3b8' }}>Carregando...</div>}

      {relatorio && (
        <>
          <div style={C.statsGrid}>
            <div style={{ ...C.statCard, borderTop: `3px solid ${relatorio.cor}` }}>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{relatorio.total_sessoes}</div>
              <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>Sessões</div>
            </div>
            <div style={{ ...C.statCard, borderTop: '3px solid #22c55e' }}>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{relatorio.alunos?.length || 0}</div>
              <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>Alunos</div>
            </div>
            <div style={{ ...C.statCard, borderTop: `3px solid ${emRisco.length > 0 ? '#ef4444' : '#22c55e'}` }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: emRisco.length > 0 ? '#ef4444' : '#22c55e' }}>{emRisco.length}</div>
              <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>Abaixo 50%</div>
            </div>
          </div>

          {emRisco.length > 0 && (
            <div style={{ ...C.card, borderLeft: '4px solid #ef4444' }}>
              <h3 style={{ ...C.title, color: '#dc2626', fontSize: 14 }}>⚠ Alunos em risco ({emRisco.length})</h3>
              <div style={{ marginTop: 8 }}>
                {emRisco.map(a => (
                  <div key={a.aluno_id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: 13 }}>
                    <span style={{ flex: 1, fontWeight: 500 }}>{a.aluno_nome}</span>
                    <FreqBadge freq={a.frequencia} />
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>({a.total_presencas}/{a.total_sessoes})</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={C.card}>
            <h3 style={{ ...C.title, fontSize: 14, marginBottom: 12 }}>Frequência por Aluno</h3>
            {relatorio.alunos?.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 20, color: '#94a3b8', fontSize: 13 }}>Sem dados.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={C.table}>
                  <thead>
                    <tr>
                      <th style={C.th}>#</th>
                      <th style={{ ...C.th, textAlign: 'left' }}>Aluno</th>
                      <th style={C.th}>Matrícula</th>
                      <th style={C.th}>Presenças</th>
                      <th style={C.th}>Presencial</th>
                      <th style={C.th}>Online</th>
                      <th style={C.th}>Frequência</th>
                    </tr>
                  </thead>
                  <tbody>
                    {relatorio.alunos.map((a, i) => (
                      <tr key={a.aluno_id} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                        <td style={C.td}>{i + 1}</td>
                        <td style={{ ...C.td, textAlign: 'left', fontWeight: 500 }}>{a.aluno_nome}</td>
                        <td style={C.td}>{a.matricula || '—'}</td>
                        <td style={C.td}>{a.total_presencas}/{a.total_sessoes}</td>
                        <td style={C.td}>{a.presencas_presencial}</td>
                        <td style={C.td}>{a.presencas_online}</td>
                        <td style={C.td}><FreqBadge freq={a.frequencia} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function RelatorioAdmin() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.relatorioGeral().then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const emRisco = data.filter(a => a.frequencia_geral < 50 && a.total_sessoes > 0);

  if (loading) return <div style={{ textAlign: 'center', padding: 28, color: '#94a3b8' }}>Carregando...</div>;

  return (
    <div>
      <div style={C.statsGrid}>
        <div style={{ ...C.statCard, borderTop: '3px solid #1e40af' }}>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{data.length}</div>
          <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>Alunos ativos</div>
        </div>
        <div style={{ ...C.statCard, borderTop: `3px solid ${emRisco.length > 0 ? '#ef4444' : '#22c55e'}` }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: emRisco.length > 0 ? '#ef4444' : '#22c55e' }}>{emRisco.length}</div>
          <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>Abaixo 50%</div>
        </div>
      </div>

      {emRisco.length > 0 && (
        <div style={{ ...C.card, borderLeft: '4px solid #ef4444' }}>
          <h3 style={{ ...C.title, color: '#dc2626', fontSize: 14 }}>⚠ Alunos em risco geral ({emRisco.length})</h3>
          <div style={{ marginTop: 8 }}>
            {emRisco.map(a => (
              <div key={a.aluno_id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: 13 }}>
                <span style={{ flex: 1, fontWeight: 500 }}>{a.aluno_nome}</span>
                <FreqBadge freq={a.frequencia_geral} />
                <span style={{ fontSize: 11, color: '#94a3b8' }}>({a.total_presencas}/{a.total_sessoes})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={C.card}>
        <h2 style={{ ...C.title, marginBottom: 12 }}>Frequência Geral Consolidada</h2>
        {data.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 20, color: '#94a3b8', fontSize: 13 }}>Sem dados.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={C.table}>
              <thead>
                <tr>
                  <th style={C.th}>#</th>
                  <th style={{ ...C.th, textAlign: 'left' }}>Aluno</th>
                  <th style={C.th}>Matrícula</th>
                  {data[0]?.disciplinas?.map((d, i) => (
                    <th key={i} style={{ ...C.th, fontSize: 9 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', display: 'inline-block', background: d.cor, marginRight: 3 }} />
                      {d.disc_nome.split(' ')[0].slice(0, 6)}
                    </th>
                  ))}
                  <th style={C.th}>Geral</th>
                </tr>
              </thead>
              <tbody>
                {data.map((a, i) => (
                  <tr key={a.aluno_id} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                    <td style={C.td}>{i + 1}</td>
                    <td style={{ ...C.td, textAlign: 'left', fontWeight: 500, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.aluno_nome}</td>
                    <td style={C.td}>{a.matricula || '—'}</td>
                    {a.disciplinas.map((d, j) => (
                      <td key={j} style={C.td}>
                        <FreqBadge freq={d.sessoes > 0 ? d.freq : null} />
                      </td>
                    ))}
                    <td style={C.td}><FreqBadge freq={a.frequencia_geral} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
