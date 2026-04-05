import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import Topbar from '../components/Topbar';
import { usuariosService } from '../services/api';

function ConsultoresPage() {
  const navigate = useNavigate();
  const [consultores, setConsultores] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [erro, setErro]               = useState(null);
  const [busca, setBusca]             = useState('');
  const [editando, setEditando]       = useState(null);
  const [salvando, setSalvando]       = useState(false);

  useEffect(() => { carregar(); }, []);

  const carregar = async () => {
    try {
      setLoading(true);
      setErro(null);
      const res = await usuariosService.listarComMetricas();
      setConsultores(res.consultores || []);
    } catch {
      setErro('Erro ao carregar consultores.');
    } finally {
      setLoading(false);
    }
  };

  const handleSalvar = async (e) => {
    e.preventDefault();
    try {
      setSalvando(true);
      await usuariosService.atualizar(editando.id, { especialidade: editando.especialidade });
      setEditando(null);
      carregar();
    } catch {
      setErro('Erro ao salvar.');
    } finally {
      setSalvando(false);
    }
  };

  const taxaConc = (c) => {
    if (!c.total_atividades) return 0;
    return Math.round((c.atividades_concluidas / c.total_atividades) * 100);
  };

  const filtrados = consultores.filter(c =>
    !busca || c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (c.especialidade || '').toLowerCase().includes(busca.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <MainLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <Topbar title="Consultores" subtitle="Perfil e métricas de cada consultor" semUsuario />
      </div>

      {/* Barra de busca */}
      <div style={{ marginBottom: '1.25rem' }}>
        <input
          className="inp"
          placeholder="🔍  Buscar por nome, especialidade ou e-mail..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          style={{ maxWidth: 380 }}
        />
      </div>

      {erro && <div className="alert alert-error">{erro}</div>}

      {loading ? (
        <p className="empty-state">Carregando...</p>
      ) : filtrados.length === 0 ? (
        <p className="empty-state">
          {busca ? 'Nenhum consultor encontrado para essa busca.' : 'Nenhum consultor cadastrado.'}
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filtrados.map(c => (
            <div key={c.id} className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>

                {/* Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem', marginBottom: '.35rem' }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: 'var(--navy-lt)', color: 'var(--navy2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: 14, flexShrink: 0
                    }}>
                      {c.nome.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '.95rem', color: 'var(--tx)' }}>{c.nome}</div>
                      <div style={{ fontSize: '.8rem', color: 'var(--mx)' }}>{c.email}</div>
                    </div>
                    <span className={`badge ${c.status === 'ativo' ? 'badge-success' : 'badge-neutral'}`}
                      style={{ marginLeft: 'auto' }}>
                      {c.status === 'ativo' ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>

                  {/* Especialidade */}
                  {editando?.id === c.id ? (
                    <form onSubmit={handleSalvar} style={{ display: 'flex', gap: '.5rem', marginTop: '.5rem' }}>
                      <input className="inp inp-sm" style={{ flex: 1 }}
                        placeholder="Especialidade"
                        value={editando.especialidade}
                        onChange={e => setEditando({ ...editando, especialidade: e.target.value })} />
                      <button type="submit" className="btn btn-primary btn-sm" disabled={salvando}>Salvar</button>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditando(null)}>Cancelar</button>
                    </form>
                  ) : (
                    <div style={{ fontSize: '.82rem', color: 'var(--mx)', marginTop: '.2rem' }}>
                      {c.especialidade || <span style={{ fontStyle: 'italic' }}>Sem especialidade</span>}
                      <button className="btn-link" style={{ marginLeft: '.5rem', fontSize: '.78rem' }}
                        onClick={() => setEditando({ id: c.id, especialidade: c.especialidade || '' })}>
                        Editar
                      </button>
                    </div>
                  )}
                </div>

                {/* Métricas + botão Ver detalhes */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '.65rem', flexShrink: 0 }}>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    {[
                      ['Projetos',    c.total_projetos],
                      ['Atividades',  c.total_atividades],
                      ['Relatórios',  c.total_relatorios],
                    ].map(([label, val]) => (
                      <div key={label} style={{ textAlign: 'center', minWidth: 60 }}>
                        <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--navy2)' }}>{val || 0}</div>
                        <div style={{ fontSize: '.72rem', color: 'var(--mx)' }}>{label}</div>
                      </div>
                    ))}
                  </div>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => navigate(`/admin/consultores/${c.id}`)}
                  >
                    Ver detalhes →
                  </button>
                </div>
              </div>

              {/* Barra de progresso */}
              <div style={{ marginTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.75rem', color: 'var(--mx)', marginBottom: 4 }}>
                  <span>Taxa de conclusão</span>
                  <span>{taxaConc(c)}%</span>
                </div>
                <div style={{ background: 'var(--bdr)', borderRadius: 4, height: 6 }}>
                  <div style={{
                    width: `${taxaConc(c)}%`, height: 6,
                    background: taxaConc(c) >= 70 ? 'var(--green2)' : taxaConc(c) >= 40 ? '#f59e0b' : 'var(--red)',
                    borderRadius: 4, transition: 'width .3s'
                  }} />
                </div>
              </div>

              {/* Avaliação média */}
              {c.media_avaliacao && (
                <div style={{ marginTop: '.5rem', fontSize: '.8rem', color: 'var(--mx)' }}>
                  Avaliação média: {' '}
                  <span style={{ color: '#f59e0b', fontWeight: 700 }}>
                    {'★'.repeat(Math.round(c.media_avaliacao))}{'☆'.repeat(5 - Math.round(c.media_avaliacao))}
                  </span>
                  {' '}{c.media_avaliacao}/5
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </MainLayout>
  );
}

export default ConsultoresPage;
