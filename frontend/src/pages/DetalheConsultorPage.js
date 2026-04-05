import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import { usuariosService } from '../services/api';

function DetalheConsultorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dados, setDados]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro]     = useState(null);

  useEffect(() => { carregar(); }, [id]);

  const carregar = async () => {
    try {
      setLoading(true);
      setErro(null);
      const res = await usuariosService.detalhe(id);
      setDados(res);
    } catch {
      setErro('Erro ao carregar dados do consultor.');
    } finally {
      setLoading(false);
    }
  };

  const taxa = (p) => {
    if (!p.total_atividades) return 0;
    return Math.round((p.atividades_concluidas / p.total_atividades) * 100);
  };

  const statusLabel = (s) => {
    const map = {
      'em-andamento': { label: 'Em andamento', cls: 'badge-info' },
      'concluido':    { label: 'Concluído',     cls: 'badge-success' },
      'pausado':      { label: 'Pausado',        cls: 'badge-warning' },
      'planejamento': { label: 'Planejamento',   cls: 'badge-neutral' },
    };
    return map[s] || { label: s, cls: 'badge-neutral' };
  };

  if (loading) return <MainLayout><p className="empty-state">Carregando...</p></MainLayout>;
  if (erro)    return <MainLayout><div className="alert alert-error">{erro}</div></MainLayout>;
  if (!dados)  return null;

  const { usuario: u, projetos } = dados;

  const totalAtiv  = projetos.reduce((s, p) => s + (p.total_atividades || 0), 0);
  const totalConc  = projetos.reduce((s, p) => s + (p.atividades_concluidas || 0), 0);
  const taxaGlobal = totalAtiv ? Math.round((totalConc / totalAtiv) * 100) : 0;

  return (
    <MainLayout>
      {/* Cabeçalho */}
      <div style={{ marginBottom: '1.5rem' }}>
        <button className="btn-link" style={{ marginBottom: '.75rem', fontSize: '.85rem' }}
          onClick={() => navigate(-1)}>
          ← Voltar
        </button>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'var(--navy-lt)', color: 'var(--navy2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 20, flexShrink: 0
            }}>
              {u.nome.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--tx)' }}>{u.nome}</div>
              <div style={{ fontSize: '.85rem', color: 'var(--mx)' }}>{u.email}</div>
              {u.especialidade && (
                <div style={{ fontSize: '.8rem', color: 'var(--teal2)', marginTop: '.15rem' }}>
                  {u.especialidade}
                </div>
              )}
            </div>
            <span className={`badge ${u.status === 'ativo' ? 'badge-success' : 'badge-neutral'}`}>
              {u.status === 'ativo' ? 'Ativo' : 'Inativo'}
            </span>
          </div>

          {/* Métricas globais */}
          <div style={{
            display: 'flex', gap: '1.5rem', marginTop: '1.25rem',
            paddingTop: '1rem', borderTop: '1px solid var(--bdr)', flexWrap: 'wrap'
          }}>
            {[
              ['Projetos',             projetos.length],
              ['Atividades totais',    totalAtiv],
              ['Atividades concluídas',totalConc],
              ['Taxa de conclusão',    `${taxaGlobal}%`],
            ].map(([label, val]) => (
              <div key={label} style={{ textAlign: 'center', minWidth: 80 }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--navy2)' }}>{val}</div>
                <div style={{ fontSize: '.72rem', color: 'var(--mx)' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Título projetos */}
      <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--tx)', marginBottom: '.75rem' }}>
        Projetos vinculados ({projetos.length})
      </div>

      {/* Lista de projetos */}
      {projetos.length === 0 ? (
        <p className="empty-state">Consultor não está vinculado a nenhum projeto.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
          {projetos.map(p => {
            const t    = taxa(p);
            const st   = statusLabel(p.projeto_status);
            return (
              <div key={p.id} className="card" style={{ padding: '1.1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '.75rem' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '.95rem', color: 'var(--tx)' }}>{p.nome}</div>
                    {p.cliente && (
                      <div style={{ fontSize: '.78rem', color: 'var(--mx)', marginTop: 2 }}>Cliente: {p.cliente}</div>
                    )}
                  </div>
                  <span className={`badge ${st.cls}`}>{st.label}</span>
                </div>

                {/* Progresso */}
                <div style={{ marginBottom: '.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.75rem', color: 'var(--mx)', marginBottom: 4 }}>
                    <span>Conclusão de atividades</span>
                    <span>{p.atividades_concluidas || 0} / {p.total_atividades || 0} ({t}%)</span>
                  </div>
                  <div style={{ background: 'var(--bdr)', borderRadius: 4, height: 7 }}>
                    <div style={{
                      width: `${t}%`, height: 7,
                      background: t >= 70 ? 'var(--green2)' : t >= 40 ? '#f59e0b' : 'var(--red)',
                      borderRadius: 4, transition: 'width .3s'
                    }} />
                  </div>
                </div>

                {/* Detalhes de atividades por status */}
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  {[
                    { label: 'Concluídas',    val: p.atividades_concluidas, cor: 'var(--green2)' },
                    { label: 'Em andamento',  val: p.em_andamento,          cor: 'var(--teal2)' },
                    { label: 'A fazer',       val: p.a_fazer,               cor: 'var(--mx)' },
                    { label: 'Não realizadas',val: p.nao_realizado,         cor: 'var(--red)' },
                  ].map(item => (
                    <div key={item.label} style={{ fontSize: '.78rem' }}>
                      <span style={{ color: item.cor, fontWeight: 700 }}>{item.val || 0}</span>
                      {' '}
                      <span style={{ color: 'var(--mx)' }}>{item.label}</span>
                    </div>
                  ))}
                  {p.total_relatorios > 0 && (
                    <div style={{ fontSize: '.78rem' }}>
                      <span style={{ color: 'var(--navy2)', fontWeight: 700 }}>{p.total_relatorios}</span>
                      {' '}
                      <span style={{ color: 'var(--mx)' }}>relatório(s)</span>
                    </div>
                  )}
                  {p.media_avaliacao && (
                    <div style={{ fontSize: '.78rem', color: '#f59e0b', fontWeight: 700 }}>
                      {'★'.repeat(Math.round(p.media_avaliacao))}
                      {'☆'.repeat(5 - Math.round(p.media_avaliacao))}
                      {' '}<span style={{ color: 'var(--mx)', fontWeight: 400 }}>{p.media_avaliacao}/5</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </MainLayout>
  );
}

export default DetalheConsultorPage;
