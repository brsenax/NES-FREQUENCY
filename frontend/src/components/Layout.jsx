import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const S = {
  wrap: { display: 'flex', flexDirection: 'column', minHeight: '100vh' },
  header: { background: 'linear-gradient(135deg,#3b0764,#6d28d9)', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  brand: { display: 'flex', alignItems: 'center', gap: 10 },
  h1: { margin: 0, fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '.06em' },
  sub: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  userInfo: { display: 'flex', alignItems: 'center', gap: 12 },
  badge: { padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, textTransform: 'uppercase' },
  logoutBtn: { padding: '6px 14px', borderRadius: 7, border: '1px solid rgba(255,255,255,.2)', background: 'transparent', color: '#94a3b8', fontSize: 12, fontWeight: 500 },
  nav: { display: 'flex', background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0 8px', overflowX: 'auto' },
  link: { display: 'flex', alignItems: 'center', gap: 6, padding: '11px 16px', fontSize: 13, fontWeight: 500, color: '#94a3b8', textDecoration: 'none', borderBottom: '2px solid transparent', whiteSpace: 'nowrap' },
  activeLink: { color: '#1e40af', borderBottomColor: '#3b82f6' },
  main: { flex: 1, padding: 16, maxWidth: 960, margin: '0 auto', width: '100%' },
};

const PERFIL_COLORS = { admin: { bg: '#fef2f2', color: '#dc2626' }, professor: { bg: '#eff6ff', color: '#2563eb' }, aluno: { bg: '#f0fdf4', color: '#16a34a' } };

export default function Layout() {
  const { user, logout } = useAuth();
  const perfil = user?.perfil || 'aluno';
  const pc = PERFIL_COLORS[perfil] || PERFIL_COLORS.aluno;

  const links = perfil === 'aluno'
    ? [
        { to: '/checkin', label: 'Marcar Presença' },
        { to: '/frequencia', label: 'Minhas Frequências' },
      ]
    : perfil === 'admin'
      ? [
          { to: '/sessao', label: 'Sessão / Chamada' },
          { to: '/alunos', label: 'Alunos' },
          { to: '/historico', label: 'Histórico' },
          { to: '/relatorio', label: 'Relatório' },
          { to: '/disciplinas', label: 'Disciplinas' },
        ]
      : [
          { to: '/sessao', label: 'Sessão / Chamada' },
          { to: '/alunos', label: 'Alunos' },
          { to: '/historico', label: 'Histórico' },
          { to: '/relatorio', label: 'Relatório' },
        ];

  return (
    <div style={S.wrap}>
      <header style={S.header}>
        <div style={S.brand}>
          <div>
            <h1 style={S.h1}>NES</h1>
            <div style={S.sub}>Sistema de Frequência</div>
          </div>
        </div>
        <div style={S.userInfo}>
          <span style={{ color: '#e2e8f0', fontSize: 13 }}>{user?.nome}</span>
          <span style={{ ...S.badge, background: pc.bg, color: pc.color }}>{perfil}</span>
          <button style={S.logoutBtn} onClick={logout}>Sair</button>
        </div>
      </header>

      <nav style={S.nav}>
        {links.map(l => (
          <NavLink key={l.to} to={l.to} style={({ isActive }) => ({ ...S.link, ...(isActive ? S.activeLink : {}) })}>
            {l.label}
          </NavLink>
        ))}
      </nav>

      <main style={S.main}>
        <Outlet />
      </main>
    </div>
  );
}
