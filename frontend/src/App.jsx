import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import SessaoPage from './pages/SessaoPage';
import AlunosPage from './pages/AlunosPage';
import HistoricoPage from './pages/HistoricoPage';
import RelatorioPage from './pages/RelatorioPage';
import AlunoCheckinPage from './pages/AlunoCheckinPage';
import AlunoFrequenciaPage from './pages/AlunoFrequenciaPage';
import DisciplinasPage from './pages/DisciplinasPage';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Carregando...</div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.perfil)) return <Navigate to="/" />;
  return children;
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Carregando...</div>;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />

      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        {/* Admin & Professor */}
        <Route index element={
          user?.perfil === 'aluno'
            ? <Navigate to="/checkin" />
            : <SessaoPage />
        } />
        <Route path="sessao" element={
          <ProtectedRoute roles={['admin', 'professor']}><SessaoPage /></ProtectedRoute>
        } />
        <Route path="alunos" element={
          <ProtectedRoute roles={['admin', 'professor']}><AlunosPage /></ProtectedRoute>
        } />
        <Route path="historico" element={
          <ProtectedRoute roles={['admin', 'professor']}><HistoricoPage /></ProtectedRoute>
        } />
        <Route path="relatorio" element={
          <ProtectedRoute roles={['admin', 'professor']}><RelatorioPage /></ProtectedRoute>
        } />
        <Route path="disciplinas" element={
          <ProtectedRoute roles={['admin']}><DisciplinasPage /></ProtectedRoute>
        } />

        {/* Aluno */}
        <Route path="checkin" element={
          <ProtectedRoute roles={['aluno']}><AlunoCheckinPage /></ProtectedRoute>
        } />
        <Route path="frequencia" element={
          <ProtectedRoute roles={['aluno']}><AlunoFrequenciaPage /></ProtectedRoute>
        } />
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}