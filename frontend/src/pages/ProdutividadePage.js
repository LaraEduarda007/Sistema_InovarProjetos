import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import Topbar from '../components/Topbar';
import { usuariosService } from '../services/api';

function ProdutividadePage() {
  const navigate = useNavigate();
  const [consultores, setConsultores] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [erro, setErro]               = useState(null);

  useEffect(() => { carregar(); }, []);

  const carregar = async () => {
    try {
      setLoading(true);
      setErro(null);
      const res = await usuariosService.listarComMetricas();
      // Ordena por taxa desc
      const sorted = (res.consultores || []).sort((a, b) => {
        const ta = a.total_atividades ? (a.atividades_concluidas / a.total_atividades) : 0;
        const tb = b.total_atividades ? (b.atividades_concluidas / b.total_atividades) : 0;
        return tb - ta;
      });
      setConsultores(sorted);
    } catch {
      setErro('Erro ao carregar dados de produtividade.');
    } finally {
      setLoading(false);
    }
  };

  const taxa = (c) => {
    if (!c.total_atividades) return 0;
    return Math.round((c.atividades_concluidas / c.total_atividades) * 100);
  };

  // Thresholds conforme protótipo: Alta ≥ 80%, Atenção 60-79%, Crítico < 60%
  const nivel = (pct) => {
    if (pct >= 80) return { label: 'Alta',    cls: 'badge-success', cor: 'var(--green2)' };
    if (pct >= 60) return { label: 'Atenção', cls: 'badge-warning', cor: '#d97706' };
    return              { label: 'Crítico',  cls: 'badge-danger',  cor: '#dc2626' };
  };

  const medalha = (idx) => {
    if (idx === 0) return '🥇';
    if (idx === 1) return '🥈';
    if (idx === 2) return '🥉';
    return `${idx + 1}º`;
  };

  // Métricas conforme protótipo
  const taxaMediaGeral = consultores.length > 0
    ? Math.round(consultores.reduce((s, c) => s + taxa(c), 0) / consultores.length)
    : 0;
  const emAtencao = consultores.filter(c => { const p = taxa(c); return p >= 60 && p < 80; }).length;
  const criticos  = consultores.filter(c => taxa(c) < 60).length;

  return (
    <MainLayout>
      <div style={{ marginBottom: '1.5rem' }}>
        <Topbar title="Produtividade" subtitle="Atividades concluídas com relatório ÷ esperadas até hoje" semUsuario />
      </div>

      {erro && <div className="alert alert-error">{erro}</div>}

      {/* Métricas conforme protótipo */}
      <div className="metrics-grid cols-3" style={{ marginBottom: '1.5rem' }}>
        <div className="metric-card">
          <div className="metric-label">Média geral</div>
          <div className={`metric-value ${taxaMediaGeral >= 80 ? 'good' : taxaMediaGeral >= 60 ? 'warn' : 'danger'}`}>
            {taxaMediaGeral}%
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Em atenção (60–79%)</div>
          <div className={`metric-value ${emAtencao > 0 ? 'warn' : ''}`}>{emAtencao}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Crítico (abaixo 60%)</div>
          <div className={`metric-value ${criticos > 0 ? 'danger' : ''}`}>{criticos}</div>
        </div>
      </div>

      {loading ? (
        <p className="empty-state">Carregando...</p>
      ) : consultores.length === 0 ? (
        <p className="empty-state">Nenhum consultor encontrado.</p>
      ) : (
        <div className="card">
          <div className="card-title">Ranking de consultores</div>

          {/* Legenda de cores conforme protótipo */}
          <div style={{ display: 'flex', gap: '1.25rem', fontSize: 12, color: 'var(--mx)', marginBottom: '1rem', flexWrap: 'wrap', fontWeight: 600 }}>
            {[
              ['var(--green2)', 'Alta — acima de 80%'],
              ['#d97706',       'Atenção — 60% a 79%'],
              ['#dc2626',       'Crítico — abaixo de 60%'],
            ].map(([cor, label]) => (
              <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: cor, display: 'inline-block' }} />
                {label}
              </span>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {consultores.map((c, idx) => {
              const pct = taxa(c);
              const nv  = nivel(pct);
              return (
                <div key={c.id} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '12px 0',
                  borderBottom: idx < consultores.length - 1 ? '1px solid #f8fafc' : 'none'
                }}>
                  {/* Posição */}
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--mx)', width: 20, textAlign: 'center' }}>
                    {medalha(idx)}
                  </span>

                  {/* Avatar */}
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'var(--navy-lt)', color: 'var(--navy2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: 13, flexShrink: 0
                  }}>
                    {c.nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                  </div>

                  {/* Nome + métricas */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{c.nome}</div>
                    <div style={{ fontSize: 11, color: 'var(--mx)' }}>
                      {c.total_projetos || 0} projeto{c.total_projetos !== 1 ? 's' : ''} · {c.atividades_concluidas || 0} de {c.total_atividades || 0} atividades
                    </div>
                  </div>

                  {/* Barra de progresso */}
                  <div style={{ width: 180 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, background: 'var(--bdr)', borderRadius: 4, height: 7 }}>
                        <div style={{ width: `${pct}%`, height: 7, background: nv.cor, borderRadius: 4 }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: nv.cor, minWidth: 36 }}>{pct}%</span>
                    </div>
                  </div>

                  {/* Badge nível */}
                  <span className={`badge ${nv.cls}`} style={{ marginLeft: 4 }}>{nv.label}</span>

                  {/* Ver detalhes */}
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ marginLeft: 6 }}
                    onClick={() => navigate(`/admin/consultores/${c.id}`)}
                  >
                    Ver detalhes
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </MainLayout>
  );
}

export default ProdutividadePage;
