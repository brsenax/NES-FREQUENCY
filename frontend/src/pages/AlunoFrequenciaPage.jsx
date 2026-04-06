import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const C = {
  card: { background: '#fff', borderRadius: 12, padding: 20, marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,.05)', border: '1px solid #f1f5f9' },
  title: { margin: 0, fontSize: 16, fontWeight: 600, color: '#0f172a' },
  muted: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
};

function FreqBadge({ freq }) {
  if (freq === null || freq === undefined) return <span style={{ color: '#cbd5e1' }}>—</span>;
  const color = freq >= 75 ? '#16a34a' : freq >= 50 ? '#d97706' : '#dc2626';
  const bg = freq >= 75 ? '#dcfce7' : freq >= 50 ? '#fef3c7' : '#fef2f2';
  return <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 6, fontSize: 14, fontWeight: 700, background: bg, color }}>{freq}%</span>;
}

export default function AlunoFrequenciaPage() {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.minhasFrequencias().then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const totalSessoes = data.reduce((s, d) => s + d.sessoes, 0);
  const totalPresencas = data.reduce((s, d) => s + d.presencas, 0);
  const freqGeral = totalSessoes > 0 ? Math.round(totalPresencas / totalSessoes * 100) : 0;

  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Carregando...</div>;

  return (
    <div>
      <div style={C.card}>
        <h2 style={C.title}>Minhas Frequências</h2>
        <p style={C.muted}>{user?.nome} · {user?.matricula}</p>
      </div>

      {/* Overall */}
      <div style={{ ...C.card, textAlign: 'center', borderTop: `3px solid ${freqGeral >= 75 ? '#22c55e' : freqGeral >= 50 ? '#f59e0b' : '#ef4444'}` }}>
        <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>Frequência Geral</div>
        <div style={{ fontSize: 48, fontWeight: 800, color: freqGeral >= 75 ? '#16a34a' : freqGeral >= 50 ? '#d97706' : '#dc2626' }}>
          {freqGeral}%
        </div>
        <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>{totalPresencas} presenças em {totalSessoes} sessões</div>
      </div>

      {/* Per discipline */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 12 }}>
        {data.map(d => (
          <div key={d.disc_id} style={{ ...C.card, borderLeft: `4px solid ${d.cor}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{d.disc_nome}</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                  {d.presencas}/{d.sessoes} sessões
                </div>
              </div>
              <FreqBadge freq={d.freq} />
            </div>

            {/* Progress bar */}
            <div style={{ marginTop: 10, height: 8, borderRadius: 4, background: '#f1f5f9', overflow: 'hidden' }}>
              <div style={{
                width: `${d.sessoes > 0 ? d.freq : 0}%`,
                height: '100%',
                borderRadius: 4,
                background: d.cor,
                transition: 'width .5s ease',
              }} />
            </div>
          </div>
        ))}
      </div>

      {data.length === 0 && (
        <div style={{ ...C.card, textAlign: 'center', color: '#94a3b8' }}>
          Nenhuma disciplina encontrada. Verifique com seu professor.
        </div>
      )}
    </div>
  );
}
