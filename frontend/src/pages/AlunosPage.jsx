import { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

// --- Subcomponente de Relatório ---
const ReportSection = ({ data, loading }) => {
  if (loading) return <div className="p-3 text-xs text-slate-400 animate-pulse">Carregando dados...</div>;
  if (data?.error) return <div className="p-3 text-xs text-red-500">{data.error}</div>;

  return (
    <div className="mt-2.5 p-4 bg-slate-50 rounded-lg border-l-4 border-blue-800 grid grid-cols-3 gap-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
      <div>
        <span className="text-[11px] font-bold text-slate-500 uppercase block">Presença</span>
        <div className="font-semibold text-slate-900">{data.frequencia}%</div>
      </div>
      <div>
        <span className="text-[11px] font-bold text-slate-500 uppercase block">Atividades</span>
        <div className="font-semibold text-slate-900">{data.completas}/{data.total}</div>
      </div>
      <div>
        <span className="text-[11px] font-bold text-slate-500 uppercase block">Média</span>
        <div className="font-semibold text-blue-800">{data.media}</div>
      </div>
    </div>
  );
};

export default function AlunosPage() {
  const { user } = useAuth();
  const [state, setState] = useState({
    alunos: [],
    disciplinas: [],
    loading: true,
    search: '',
    filterDisc: '',
    selectedReportId: null,
    reportData: null,
    reportLoading: false,
  });

  const isAdmin = user?.perfil === 'admin';
  const isProfessor = user?.perfil === 'professor' || isAdmin;

  const loadInitialData = useCallback(async () => {
    try {
      const [alunosData, discData] = await Promise.all([
        api.listUsers('perfil=aluno'),
        api.listDisciplinas()
      ]);
      setState(prev => ({ ...prev, alunos: alunosData, disciplinas: discData, loading: false }));
    } catch (err) {
      console.error("Erro ao carregar dados", err);
    }
  }, []);

  useEffect(() => { loadInitialData(); }, [loadInitialData]);

  const handleToggleReport = async (alunoId) => {
    if (state.selectedReportId === alunoId) {
      setState(prev => ({ ...prev, selectedReportId: null, reportData: null }));
      return;
    }

    setState(prev => ({ ...prev, selectedReportId: alunoId, reportLoading: true }));
    try {
      const data = await api.getUserStats(alunoId);
      setState(prev => ({ ...prev, reportData: data, reportLoading: false }));
    } catch {
      setState(prev => ({ ...prev, reportData: { error: 'Falha ao carregar' }, reportLoading: false }));
    }
  };

  const filteredAlunos = useMemo(() => {
    return state.alunos.filter(a => {
      const matchesSearch = a.nome.toLowerCase().includes(state.search.toLowerCase());
      const matchesDisc = !state.filterDisc || a.disciplina_id === Number(state.filterDisc);
      return matchesSearch && matchesDisc;
    });
  }, [state.alunos, state.search, state.filterDisc]);

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      {/* Header Card */}
      <header className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900 m-0">Gestão Acadêmica</h2>
            <p className="text-xs text-slate-400 mt-1">{filteredAlunos.length} alunos encontrados</p>
          </div>
          {isAdmin && (
            <button className="bg-blue-800 text-white text-xs font-medium px-3.5 py-2 rounded-md hover:bg-blue-900 transition-colors flex items-center gap-1.5 shadow-sm">
              <span>+</span> Novo Aluno
            </button>
          )}
        </div>
        
        <div className="flex gap-2.5">
          <div className="flex-1">
            <input 
              className="w-full px-2.5 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-800/20 focus:border-blue-800 transition-all"
              placeholder="Pesquisar por nome..." 
              onChange={e => setState(p => ({ ...p, search: e.target.value }))}
            />
          </div>
          <select 
            className="w-[200px] px-2.5 py-2 border border-slate-200 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-800/20 transition-all"
            onChange={e => setState(p => ({ ...p, filterDisc: e.target.value }))}
          >
            <option value="">Todas as Disciplinas</option>
            {state.disciplinas.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
          </select>
        </div>
      </header>

      {/* List Card */}
      <section className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
        {state.loading ? (
            <div className="text-center py-10 text-slate-400 text-sm">Carregando lista...</div>
        ) : filteredAlunos.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">Nenhum aluno encontrado.</div>
        ) : (
          <div className="flex flex-col">
            {filteredAlunos.map((aluno, i) => (
              <div key={aluno.id} className="border-b border-slate-50 last:border-0 py-1.5">
                <div 
                  className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md transition-colors duration-200 ${
                    state.selectedReportId === aluno.id ? 'bg-slate-50' : 'hover:bg-slate-50/50'
                  }`}
                >
                  <span className="text-xs text-slate-400 w-5 font-medium">{i + 1}</span>
                  <div className="flex-1 truncate">
                    <div className="text-[13px] font-medium text-slate-900 truncate">{aluno.nome}</div>
                    <div className="text-[11px] text-slate-400">{aluno.matricula || 'Sem matrícula'}</div>
                  </div>
                  
                  <div className="flex gap-1">
                    {isProfessor && (
                      <button 
                        onClick={() => handleToggleReport(aluno.id)}
                        className={`w-8 h-8 flex items-center justify-center rounded-md hover:bg-white hover:shadow-sm transition-all ${
                          state.selectedReportId === aluno.id ? 'text-blue-800 grayscale-0 scale-110' : 'grayscale text-slate-400'
                        }`}
                        title="Ver Relatório"
                      >
                        {state.selectedReportId === aluno.id ? '✖️' : '📊'}
                      </button>
                    )}
                    {isAdmin && (
                      <button className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white hover:shadow-sm text-slate-400 hover:text-blue-800 transition-all">
                        ✏️
                      </button>
                    )}
                  </div>
                </div>

                {state.selectedReportId === aluno.id && (
                  <ReportSection data={state.reportData} loading={state.reportLoading} />
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}