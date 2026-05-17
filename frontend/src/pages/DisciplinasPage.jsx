import { useState, useEffect } from 'react';
import api from '../services/api';

const C = {
  card: { background: '#fff', borderRadius: 12, padding: 20, marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,.05)', border: '1px solid #f1f5f9' },
  title: { margin: 0, fontSize: 16, fontWeight: 600, color: '#0f172a' },
  muted: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10, marginTop: 12 },
  field: { display: 'flex', flexDirection: 'column', gap: 4 },
  label: { fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' },
  input: { padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 14, outline: 'none' },
  select: { padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 14 },
  btnPri: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 20px', border: 'none', borderRadius: 9, background: '#1e40af', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  btnDanger: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '5px 12px', border: 'none', borderRadius: 7, background: '#fef2f2', color: '#dc2626', fontSize: 12, fontWeight: 500, cursor: 'pointer' },
  btnSm: { padding: '6px 14px', border: '1px solid #e2e8f0', borderRadius: 7, background: '#fff', color: '#64748b', fontSize: 12, fontWeight: 500, cursor: 'pointer' },
  row: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 9, border: '1px solid #f1f5f9', marginBottom: 8, background: '#fff' },
  badge: { display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600 },
};

const MODOS = [
  { value: 'qr', label: 'Código QR' },
  { value: 'hibrido', label: 'Híbrido' },
];

const CORES = [
  '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b',
  '#ec4899', '#f97316', '#0ea5e9', '#14b8a6',
];

export default function DisciplinasPage() {
  const [disciplinas, setDisciplinas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [nome, setNome] = useState('');
  const [modo, setModo] = useState('qr');
  const [cor, setCor] = useState('#3b82f6');
  const [criando, setCriando] = useState(false);

  // Confirm delete
  const [confirmId, setConfirmId] = useState(null);

  const carregar = async () => {
    try {
      const data = await api.listDisciplinas();
      setDisciplinas(data);
    } catch {
      setError('Erro ao carregar disciplinas.');
    }
  };

  useEffect(() => { carregar(); }, []);

  const criar = async () => {
    if (!nome.trim()) return;
    setCriando(true);
    setError('');
    setSuccess('');
    try {
      await api.createDisciplina({ nome: nome.trim(), modo, cor });
      setNome('');
      setModo('qr');
      setCor('#3b82f6');
      setSuccess('Disciplina criada com sucesso!');
      await carregar();
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      setError(e.message || 'Erro ao criar disciplina.');
    } finally {
      setCriando(false);
    }
  };

  const deletar = async (id) => {
    setError('');
    setSuccess('');
    try {
      await api.deleteDisciplina(id);
      setConfirmId(null);
      setSuccess('Disciplina removida.');
      await carregar();
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      setError(e.message || 'Erro ao deletar disciplina.');
      setConfirmId(null);
    }
  };

  return (
    <div>
      {/* Criar disciplina */}
      <div style={C.card}>
        <h2 style={C.title}>Nova Disciplina</h2>
        <p style={C.muted}>Preencha os dados para adicionar uma disciplina ao sistema.</p>

        <div style={C.grid}>
          <div style={{ ...C.field, gridColumn: 'span 2' }}>
            <label style={C.label}>Nome</label>
            <input
              style={C.input}
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Ex: Cálculo I"
              onKeyDown={e => e.key === 'Enter' && criar()}
            />
          </div>
          <div style={C.field}>
            <label style={C.label}>Modo</label>
            <select style={C.select} value={modo} onChange={e => setModo(e.target.value)}>
              {MODOS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div style={C.field}>
            <label style={C.label}>Cor</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
              {CORES.map(c => (
                <button
                  key={c}
                  onClick={() => setCor(c)}
                  style={{
                    width: 28, height: 28, borderRadius: 7, background: c, border: 'none', cursor: 'pointer',
                    outline: cor === c ? `3px solid ${c}` : 'none',
                    outlineOffset: 2,
                    transform: cor === c ? 'scale(1.15)' : 'scale(1)',
                    transition: 'transform .15s',
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, marginTop: 12, fontSize: 13 }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{ background: '#f0fdf4', color: '#16a34a', padding: '10px 14px', borderRadius: 8, marginTop: 12, fontSize: 13 }}>
            ✓ {success}
          </div>
        )}

        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
          <button style={{ ...C.btnPri, opacity: criando || !nome.trim() ? .6 : 1 }} onClick={criar} disabled={criando || !nome.trim()}>
            {criando ? 'Criando...' : '+ Adicionar Disciplina'}
          </button>
        </div>
      </div>

      {/* Lista de disciplinas */}
      <div style={C.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h2 style={C.title}>Disciplinas Cadastradas</h2>
            <p style={C.muted}>{disciplinas.length} disciplina{disciplinas.length !== 1 ? 's' : ''} no sistema</p>
          </div>
        </div>

        {disciplinas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8', fontSize: 14 }}>
            Nenhuma disciplina cadastrada ainda.
          </div>
        ) : (
          disciplinas.map(d => (
            <div key={d.id} style={{ ...C.row, borderLeft: `4px solid ${d.cor}` }}>
              {/* Cor dot */}
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: d.cor, flexShrink: 0 }} />

              {/* Info */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{d.nome}</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>ID #{d.id}</div>
              </div>

              {/* Modo badge */}
              <span style={{
                ...C.badge,
                background: d.modo === 'hibrido' ? '#fef3c7' : '#eff6ff',
                color: d.modo === 'hibrido' ? '#92400e' : '#1d4ed8',
              }}>
                {d.modo === 'hibrido' ? 'Híbrido' : 'QR'}
              </span>

              {/* Ativa badge */}
              <span style={{
                ...C.badge,
                background: d.ativa ? '#f0fdf4' : '#fef2f2',
                color: d.ativa ? '#16a34a' : '#dc2626',
              }}>
                {d.ativa ? 'Ativa' : 'Inativa'}
              </span>

              {/* Delete */}
              {confirmId === d.id ? (
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: '#64748b' }}>Confirmar?</span>
                  <button style={{ ...C.btnDanger, background: '#dc2626', color: '#fff' }} onClick={() => deletar(d.id)}>
                    Sim
                  </button>
                  <button style={C.btnSm} onClick={() => setConfirmId(null)}>Não</button>
                </div>
              ) : (
                <button style={C.btnDanger} onClick={() => setConfirmId(d.id)}>
                  Remover
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}