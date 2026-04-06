import { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const C = {
  card: { background: '#fff', borderRadius: 16, padding: 32, maxWidth: 440, margin: '20px auto', boxShadow: '0 1px 3px rgba(0,0,0,.05)', border: '1px solid #f1f5f9' },
  title: { margin: 0, fontSize: 18, fontWeight: 600, color: '#0f172a', textAlign: 'center' },
  muted: { fontSize: 13, color: '#94a3b8', marginTop: 6, textAlign: 'center' },
  field: { display: 'flex', flexDirection: 'column', gap: 4, marginTop: 20 },
  label: { fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' },
  input: { padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 14 },
  btnPri: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: 12, border: 'none', borderRadius: 9, background: '#22c55e', color: '#fff', fontSize: 15, fontWeight: 600, marginTop: 16 },
  error: { background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginTop: 12, textAlign: 'center' },
  success: { textAlign: 'center' },
};

export default function AlunoCheckinPage() {
  const { user } = useAuth();
  const [step, setStep] = useState('input'); // input | success
  const [sessaoId, setSessaoId] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [discNome, setDiscNome] = useState('');

  const handleCheckin = async () => {
    if (!sessaoId || !token) return;
    setError('');
    setLoading(true);
    try {
      await api.checkinToken({
        sessao_id: Number(sessaoId),
        token: token.trim(),
        metodo: 'token',
      });
      setStep('success');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setStep('input'); setSessaoId(''); setToken(''); setError(''); };

  if (step === 'success') {
    return (
      <div style={C.card}>
        <div style={C.success}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#dcfce7', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, fontSize: 36 }}>✓</div>
          <h2 style={{ ...C.title, color: '#16a34a' }}>Presença Confirmada!</h2>
          <p style={C.muted}>{user?.nome}</p>
          <button onClick={reset} style={{ ...C.btnPri, background: '#f1f5f9', color: '#64748b', marginTop: 24 }}>Nova presença</button>
        </div>
      </div>
    );
  }

  return (
    <div style={C.card}>
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: '#f0fdf4', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, fontSize: 28 }}>📋</div>
        <h2 style={C.title}>Marcar Presença</h2>
        <p style={C.muted}>Olá, {user?.nome?.split(' ')[0]}! Digite os dados que estão na tela do professor.</p>
      </div>

      <div style={C.field}>
        <label style={C.label}>ID da Sessão</label>
        <input style={C.input} value={sessaoId} onChange={e => setSessaoId(e.target.value.replace(/\D/g, ''))}
          placeholder="Ex: 1" inputMode="numeric" />
      </div>

      <div style={C.field}>
        <label style={C.label}>Código de 6 dígitos</label>
        <input style={{
          ...C.input, textAlign: 'center', fontSize: 28, fontWeight: 700,
          letterSpacing: '.15em', fontFamily: "'Courier New',monospace",
        }}
          value={token}
          onChange={e => { setToken(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
          placeholder="000000" maxLength={6} inputMode="numeric"
        />
      </div>

      {error && <div style={C.error}>{error}</div>}

      <button style={C.btnPri} onClick={handleCheckin} disabled={!sessaoId || token.length < 6 || loading}>
        {loading ? 'Verificando...' : 'Confirmar Presença'}
      </button>

      <p style={{ ...C.muted, marginTop: 16, fontSize: 11 }}>
        O professor mostra o ID da sessão e o código na tela. O código muda a cada 20 segundos.
      </p>
    </div>
  );
}
