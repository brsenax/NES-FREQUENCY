import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const C = {
  card: { background: '#fff', borderRadius: 12, padding: 20, marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,.05)', border: '1px solid #f1f5f9' },
  title: { margin: 0, fontSize: 16, fontWeight: 600, color: '#0f172a' },
  muted: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10, marginTop: 12 },
  field: { display: 'flex', flexDirection: 'column', gap: 4 },
  label: { fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' },
  input: { padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 14 },
  select: { padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 14 },
  textarea: { padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 14, width: '100%', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' },
  formBox: { marginTop: 14, padding: 14, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' },
  btnPri: { padding: '7px 14px', border: 'none', borderRadius: 7, background: '#1e40af', color: '#fff', fontSize: 12, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 5 },
  btnSm: { padding: '7px 14px', border: '1px solid #e2e8f0', borderRadius: 7, background: '#fff', color: '#64748b', fontSize: 12, fontWeight: 500 },
  iconBtn: { width: 30, height: 30, borderRadius: 6, border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 },
  searchBox: { display: 'flex', alignItems: 'center', gap: 6, padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 7, background: '#f8fafc', marginBottom: 10 },
  searchInput: { border: 'none', outline: 'none', background: 'none', fontSize: 14, flex: 1 },
  row: { display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 7, animation: 'fadeIn .12s ease both' },
  badge: { fontSize: 9, padding: '1px 5px', borderRadius: 3, fontWeight: 600, display: 'inline-block' },
};

export default function AlunosPage() {
  const { user } = useAuth();
  const isAdmin = user?.perfil === 'admin';
  const [alunos, setAlunos] = useState([]);
  const [disciplinas, setDisciplinas] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [search, setSearch] = useState('');
  const [filterDisc, setFilterDisc] = useState('');

  // Form state
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [matricula, setMatricula] = useState('');
  const [senha, setSenha] = useState('nes2026');
  const [editId, setEditId] = useState(null);

  // Bulk state
  const [bulkText, setBulkText] = useState('');
  const [bulkDiscs, setBulkDiscs] = useState([]);

  useEffect(() => {
    loadAlunos();
    api.listDisciplinas().then(setDisciplinas).catch(() => {});
  }, []);

  const loadAlunos = async () => {
    try {
      const params = new URLSearchParams({ perfil: 'aluno' });
      if (filterDisc) params.append('disciplina_id', filterDisc);
      const data = await api.listUsers(params.toString());
      setAlunos(data);
    } catch {}
  };

  useEffect(() => { loadAlunos(); }, [filterDisc]);

  const resetForm = () => { setNome(''); setEmail(''); setMatricula(''); setSenha('nes2026'); setEditId(null); setShowForm(false); };

  const handleSave = async () => {
    if (!nome.trim()) return;
    try {
      if (editId) {
        await api.updateUser(editId, { nome, email: email || null, matricula: matricula || null, senha: senha || undefined });
      } else {
        await api.createUser({ nome, email: email || null, matricula: matricula || null, senha, perfil: 'aluno' });
      }
      await loadAlunos();
      resetForm();
    } catch (e) { alert(e.message); }
  };

  const handleBulk = async () => {
    if (!bulkText.trim() || bulkDiscs.length === 0) return;
    const nomes = bulkText.split('\n').map(l => l.trim()).filter(Boolean);
    try {
      await api.bulkCreateUsers({ nomes, perfil: 'aluno', disciplina_ids: bulkDiscs.map(Number), senha_padrao: 'nes2026' });
      await loadAlunos();
      setBulkText(''); setShowBulk(false);
    } catch (e) { alert(e.message); }
  };

  const handleEdit = (a) => {
    setNome(a.nome); setEmail(a.email || ''); setMatricula(a.matricula || ''); setSenha('');
    setEditId(a.id); setShowForm(true); setShowBulk(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Desativar aluno?')) return;
    await api.deleteUser(id);
    await loadAlunos();
  };

  const filtered = alunos.filter(a => search ? a.nome.toLowerCase().includes(search.toLowerCase()) : true);

  return (
    <div>
      <div style={C.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div><h2 style={C.title}>Gerenciar Alunos</h2><p style={C.muted}>{alunos.length} alunos</p></div>
          {isAdmin && (
            <div style={{ display: 'flex', gap: 6 }}>
              <button style={C.btnSm} onClick={() => { setShowBulk(!showBulk); setShowForm(false); }}>Em lote</button>
              <button style={C.btnPri} onClick={() => { resetForm(); setShowForm(true); setShowBulk(false); }}>+ Novo</button>
            </div>
          )}
        </div>

        {showForm && isAdmin && (
          <div style={C.formBox}>
            <div style={C.grid}>
              <div style={C.field}><label style={C.label}>Nome *</label><input style={C.input} value={nome} onChange={e => setNome(e.target.value)} /></div>
              <div style={C.field}><label style={C.label}>Email</label><input style={C.input} value={email} onChange={e => setEmail(e.target.value)} /></div>
              <div style={C.field}><label style={C.label}>Matrícula</label><input style={C.input} value={matricula} onChange={e => setMatricula(e.target.value)} /></div>
              <div style={C.field}><label style={C.label}>Senha</label><input style={C.input} value={senha} onChange={e => setSenha(e.target.value)} placeholder={editId ? 'Deixe vazio para manter' : 'nes2026'} /></div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button style={C.btnPri} onClick={handleSave}>{editId ? 'Atualizar' : 'Cadastrar'}</button>
              <button style={C.btnSm} onClick={resetForm}>Cancelar</button>
            </div>
          </div>
        )}

        {showBulk && isAdmin && (
          <div style={C.formBox}>
            <p style={{ ...C.muted, margin: '0 0 8px' }}>Um nome por linha. Selecione disciplinas abaixo.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
              {disciplinas.map(d => (
                <button key={d.id} onClick={() => setBulkDiscs(prev => prev.includes(d.id) ? prev.filter(x => x !== d.id) : [...prev, d.id])}
                  style={{ ...C.badge, padding: '4px 10px', fontSize: 11, cursor: 'pointer', border: `1px solid ${bulkDiscs.includes(d.id) ? d.cor : '#e2e8f0'}`, background: bulkDiscs.includes(d.id) ? d.cor : '#f1f5f9', color: bulkDiscs.includes(d.id) ? '#fff' : '#64748b' }}>
                  {d.nome}
                </button>
              ))}
            </div>
            <textarea style={C.textarea} rows={6} value={bulkText} onChange={e => setBulkText(e.target.value)} placeholder={"Maria Silva\nJoão Santos"} />
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button style={C.btnPri} onClick={handleBulk}>Adicionar {bulkText.split('\n').filter(l => l.trim()).length}</button>
              <button style={C.btnSm} onClick={() => setShowBulk(false)}>Cancelar</button>
            </div>
          </div>
        )}
      </div>

      <div style={C.card}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
          <div style={{ ...C.searchBox, flex: 1, minWidth: 180, marginBottom: 0 }}>
            <input style={C.searchInput} placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select style={{ ...C.select, width: 200 }} value={filterDisc} onChange={e => setFilterDisc(e.target.value)}>
            <option value="">Todas</option>
            {disciplinas.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
          </select>
        </div>

        {filtered.length === 0 ? <div style={{ textAlign: 'center', padding: 28, color: '#94a3b8', fontSize: 13 }}>Nenhum aluno.</div> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {filtered.map((a, i) => (
              <div key={a.id} style={{ ...C.row, animation: `fadeIn .1s ease ${i * .01}s both` }}>
                <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, color: '#94a3b8' }}>{i + 1}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{a.nome}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{a.matricula || ''}{a.email ? ` · ${a.email}` : ''}</div>
                </div>
                {isAdmin && (
                  <>
                    <button style={C.iconBtn} onClick={() => handleEdit(a)} title="Editar">✏️</button>
                    <button style={C.iconBtn} onClick={() => handleDelete(a.id)} title="Desativar">🗑️</button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
