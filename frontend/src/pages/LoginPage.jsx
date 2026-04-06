import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const S = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#1e293b,#0f172a)', padding: 20 },
  card: { background: '#fff', borderRadius: 16, padding: 36, width: '100%', maxWidth: 400, boxShadow: '0 8px 32px rgba(0,0,0,.2)' },
  h1: { margin: 0, fontSize: 28, fontWeight: 800, color: '#1e293b', letterSpacing: '.04em', textAlign: 'center' },
  sub: { textAlign: 'center', color: '#64748b', fontSize: 14, margin: '6px 0 28px' },
  field: { display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16 },
  label: { fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.04em' },
  input: { padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 15, color: '#1e293b' },
  btn: { width: '100%', padding: 12, border: 'none', borderRadius: 9, background: '#1e40af', color: '#fff', fontSize: 15, fontWeight: 600, marginTop: 8 },
  error: { background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16, textAlign: 'center' },
  hint: { marginTop: 20, padding: 14, background: '#f8fafc', borderRadius: 8, fontSize: 12, color: '#64748b', lineHeight: 1.6 },
};

export default function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [loginStr, setLoginStr] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(loginStr, senha);
      nav(user.perfil === 'aluno' ? '/checkin' : '/sessao');
    } catch (err) {
      setError(err.message || 'Credenciais inválidas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.page}>
      <div style={S.card}>
        <h1 style={S.h1}>NES</h1>
        <p style={S.sub}>Sistema de Frequência</p>

        {error && <div style={S.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={S.field}>
            <label style={S.label}>Email ou Matrícula</label>
            <input style={S.input} value={loginStr} onChange={e => setLoginStr(e.target.value)}
              placeholder="admin@nes.edu.br ou NES0001" autoFocus />
          </div>
          <div style={S.field}>
            <label style={S.label}>Senha</label>
            <input style={S.input} type="password" value={senha} onChange={e => setSenha(e.target.value)}
              placeholder="••••••" />
          </div>
          <button style={S.btn} type="submit" disabled={loading || !loginStr || !senha}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div style={S.hint}>
          <strong>Seed padrão:</strong><br />
          Admin: admin@nes.edu.br<br />
          Professor: vitor@nes.edu.br<br />
          Aluno: NES0001<br />
          Senha: nes2026
        </div>
      </div>
    </div>
  );
}
