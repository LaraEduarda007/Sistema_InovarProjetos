import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import { projetosService, atividadesService } from '../services/api';
import { useApp } from '../context/AppContext';
import './ConsultorDashboard.css';

function ConsultorDashboard() {
  const { usuario } = useApp();
  const navigate = useNavigate();

  const [projetos, setProjetos]         = useState([]);
  const [pendentes, setPendentes]       = useState([]);
  const [progressoMap, setProgressoMap] = useState({});
  const [loading, setLoading]           = useState(true);
  const [stats, setStats]               = useState({ ativos: 0, pendentes: 0, produtividade: 0 });

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const [projetosRes, atividadesRes] = await Promise.all([
        projetosService.listar(),
        atividadesService.listar()
      ]);

      const projetosData   = projetosRes.projetos || [];
      const atividadesData = atividadesRes.atividades || [];

      setProjetos(projetosData);

      // Atividades pendentes (sem relatório e não concluídas)
      const semRelatorio = atividadesData.filter(
        a => !a.relatorio_id && (a.status === 'a-fazer' || a.status === 'em-andamento')
      );
      setPendentes(semRelatorio);

      // Produtividade = semanas completas / total semanas de todos os projetos
      // (calculado junto com o progressoMap abaixo)

      // Mapa de progresso por projeto (semanas completas / total semanas)
      const semanasAgrupadas = {};
      for (const a of atividadesData) {
        const chave = `${a.projeto_id}__${a.mes}__${a.semana}`;
        if (!semanasAgrupadas[chave]) {
          semanasAgrupadas[chave] = { projeto_id: a.projeto_id, total: 0, concluidas: 0 };
        }
        semanasAgrupadas[chave].total++;
        if (a.status === 'concluido') semanasAgrupadas[chave].concluidas++;
      }

      const semanasComplPorProjeto = {};
      for (const s of Object.values(semanasAgrupadas)) {
        if (!semanasComplPorProjeto[s.projeto_id]) semanasComplPorProjeto[s.projeto_id] = 0;
        if (s.total > 0 && s.concluidas === s.total) semanasComplPorProjeto[s.projeto_id]++;
      }

      const mapa = {};
      let totalSemanasGeral = 0;
      let totalComplGeral = 0;

      for (const p of projetosData) {
        const totalSemanas = (p.duracao_meses || 12) * 4;
        const completas = semanasComplPorProjeto[p.id] || 0;
        mapa[p.id] = { completas, totalSemanas, pct: Math.round((completas / totalSemanas) * 100) };
        totalSemanasGeral += totalSemanas;
        totalComplGeral   += completas;
      }

      const prod = totalSemanasGeral > 0
        ? Math.round((totalComplGeral / totalSemanasGeral) * 100)
        : 0;

      setProgressoMap(mapa);

      setStats({
        ativos: projetosData.filter(p => p.status === 'ativo').length,
        pendentes: semRelatorio.length,
        produtividade: prod,
      });
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const calcularProgresso = (projeto) => {
    return progressoMap[projeto.id]?.pct || 0;
  };

  // Iniciais para o avatar
  const iniciais = usuario?.nome
    ? usuario.nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : 'U';

  const getNomeProjeto = (projetoId) => {
    const p = projetos.find(p => p.id === projetoId);
    return p?.nome || '—';
  };

  const getProjetoId = (atividade) => atividade.projeto_id || '';

  return (
    <MainLayout>
      {/* Saudação com avatar */}
      <div className="consultor-greeting">
        <div className="consultor-avatar">{iniciais}</div>
        <div>
          <div className="consultor-greeting-nome">Olá, {usuario?.nome || 'Consultor'}</div>
          <div className="consultor-greeting-sub">
            Consultor · {usuario?.especialidade || 'Inovar Varejo'}
          </div>
        </div>
      </div>

      {/* Métricas */}
      <div className="metrics-grid" style={{ marginBottom: '1.25rem' }}>
        <div className="metric-card">
          <div className="metric-label">Projetos ativos</div>
          <div className="metric-value">{stats.ativos}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Pendentes esta semana</div>
          <div className="metric-value warn">{stats.pendentes}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Minha produtividade</div>
          <div className="metric-value good">{stats.produtividade}%</div>
        </div>
      </div>

      {/* Atividades pendentes */}
      {pendentes.length > 0 && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div className="card-title">Atividades pendentes — esta semana</div>
          <div className="pendentes-list">
            {pendentes.slice(0, 5).map(atv => (
              <div key={atv.id} className="pendente-item">
                <div
                  className="pendente-dot"
                  style={{ background: atv.status === 'em-andamento' ? '#d97706' : '#94a3b8' }}
                />
                <div className="pendente-info">
                  <div className="pendente-titulo">{atv.titulo}</div>
                  <div className="pendente-meta">
                    {getNomeProjeto(atv.projeto_id)} · Mês {atv.mes}, Semana {atv.semana}
                    {!atv.relatorio_id && (
                      <span style={{ color: '#dc2626', fontWeight: 700 }}> · Relatório pendente</span>
                    )}
                  </div>
                </div>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => navigate(`/consultor/projetos/${atv.projeto_id}`)}
                >
                  Registrar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Meus projetos */}
      <div className="card">
        <div className="card-title">Meus projetos</div>
        {loading ? (
          <p className="empty-state">Carregando...</p>
        ) : projetos.length === 0 ? (
          <p className="empty-state">Nenhum projeto atribuído.</p>
        ) : (
          <div className="projetos-mini-list">
            {projetos.map(projeto => {
              const pct = calcularProgresso(projeto);
              return (
                <div key={projeto.id} className="projeto-mini-row">
                  <div className="projeto-mini-nome">{projeto.nome}</div>
                  <div className="progress-wrap" style={{ flex: 1, maxWidth: 160 }}>
                    <div className="progress-fill" style={{
                      width: `${pct}%`,
                      background: pct >= 70 ? 'var(--green2)' : pct >= 40 ? '#f59e0b' : 'var(--navy2)'
                    }} />
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--mx)', minWidth: 32 }}>{pct}%</span>
                  <button
                    className="btn-link"
                    onClick={() => navigate(`/consultor/projetos/${projeto.id}`)}
                  >
                    Ver →
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
}

export default ConsultorDashboard;
