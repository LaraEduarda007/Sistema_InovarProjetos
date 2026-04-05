import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import Topbar from '../components/Topbar';
import { projetosService, cobrancasService, atividadesService } from '../services/api';
import './AdminDashboard.css';

function AdminDashboard() {
  const navigate = useNavigate();

  const [projetos, setProjetos]     = useState([]);
  const [progressoMap, setProgressoMap] = useState({}); // { projetoId: { total, concluidas, pct } }
  const [loading, setLoading]       = useState(true);
  const [erro, setErro]             = useState(null);
  const [stats, setStats]           = useState({
    projetosAtivos: 0,
    relatoriosPendentes: 0,
    cobrancasAberto: 0,
    consultoresAtivos: 0,
  });

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      setErro(null);

      const projetosRes   = await projetosService.listar();
      const projetosData  = projetosRes.projetos || [];
      setProjetos(projetosData);

      // Cobranças abertas
      let cobrancasAberto = 0;
      try {
        const cobRes = await cobrancasService.listar();
        const cobData = cobRes.cobrancas || [];
        cobrancasAberto = cobData.filter(c => c.status === 'aberta').length;
      } catch (_) {}

      // Atividades pendentes e progresso por projeto
      let relatoriosPendentes = 0;
      try {
        const atvRes  = await atividadesService.listar();
        const atvData = atvRes.atividades || [];
        relatoriosPendentes = atvData.filter(a => a.status === 'a-fazer').length;

        // Mapa de progresso por projeto (semanas completas / total semanas do projeto)
        // Agrupa por (projeto_id, mes, semana)
        const semanasAgrupadas = {};
        for (const a of atvData) {
          const chave = `${a.projeto_id}__${a.mes}__${a.semana}`;
          if (!semanasAgrupadas[chave]) {
            semanasAgrupadas[chave] = { projeto_id: a.projeto_id, total: 0, concluidas: 0 };
          }
          semanasAgrupadas[chave].total++;
          if (a.status === 'concluido') semanasAgrupadas[chave].concluidas++;
        }

        // Para cada projeto, conta semanas completas
        const semanasCompletas = {}; // projeto_id -> nº semanas completas
        for (const s of Object.values(semanasAgrupadas)) {
          if (!semanasCompletas[s.projeto_id]) semanasCompletas[s.projeto_id] = 0;
          if (s.total > 0 && s.concluidas === s.total) semanasCompletas[s.projeto_id]++;
        }

        // Monta o mapa final usando duracao_meses dos projetos
        const mapa = {};
        for (const p of projetosData) {
          const totalSemanas = (p.duracao_meses || 12) * 4;
          const completas = semanasCompletas[p.id] || 0;
          mapa[p.id] = {
            semanasCompletas: completas,
            totalSemanas,
            pct: Math.round((completas / totalSemanas) * 100)
          };
        }
        setProgressoMap(mapa);
      } catch (_) {}

      // Consultores ativos: projetos distintos com consultor
      const consultoresIds = [...new Set(
        projetosData
          .filter(p => p.status === 'ativo' && p.consultor_id)
          .map(p => p.consultor_id)
      )];

      setStats({
        projetosAtivos:     projetosData.filter(p => p.status === 'ativo').length,
        relatoriosPendentes,
        cobrancasAberto,
        consultoresAtivos:  consultoresIds.length,
      });

    } catch (error) {
      setErro('Erro ao carregar dados. Verifique se o servidor está rodando.');
    } finally {
      setLoading(false);
    }
  };

  // Progresso = semanas completas / total semanas do projeto
  const calcularProgresso = (projeto) => {
    return progressoMap[projeto.id]?.pct || 0;
  };

  const progressoLabel = (projeto) => {
    const dados = progressoMap[projeto.id];
    if (!dados) return '—';
    return `${dados.semanasCompletas}/${dados.totalSemanas} semanas`;
  };

  return (
    <MainLayout>
      <div className="topbar-with-btn">
        <Topbar title="Painel geral" subtitle="Visão geral dos projetos e atividades" />
        <button className="btn btn-primary" onClick={() => navigate('/admin/projetos')}>
          + Novo projeto
        </button>
      </div>

      {erro && <div className="alert alert-error">{erro}</div>}

      {/* Cards de métricas */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">Projetos ativos</div>
          <div className="metric-value">{stats.projetosAtivos}</div>
          <div className="metric-subtext">em andamento</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Relatórios pendentes</div>
          <div className={`metric-value ${stats.relatoriosPendentes > 0 ? 'warn' : ''}`}>
            {stats.relatoriosPendentes}
          </div>
          <div className="metric-subtext">atividades sem relatório</div>
        </div>

        <div className="metric-card" style={{ cursor: stats.cobrancasAberto > 0 ? 'pointer' : 'default' }}
          onClick={() => stats.cobrancasAberto > 0 && navigate('/admin/cobrancas')}>
          <div className="metric-label">Cobranças em aberto</div>
          <div className={`metric-value ${stats.cobrancasAberto > 0 ? 'danger' : ''}`}>
            {stats.cobrancasAberto}
          </div>
          <div className="metric-subtext">{stats.cobrancasAberto > 0 ? 'clique para ver' : 'nenhuma pendente'}</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Consultores ativos</div>
          <div className="metric-value">{stats.consultoresAtivos}</div>
          <div className="metric-subtext">em campo</div>
        </div>
      </div>

      {/* Tabela de projetos */}
      <div className="card">
        <div className="card-title">Projetos em andamento</div>

        {loading ? (
          <p className="empty-state">Carregando...</p>
        ) : projetos.length === 0 ? (
          <p className="empty-state">Nenhum projeto cadastrado ainda.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Consultor</th>
                <th>Duração</th>
                <th>Progresso</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {projetos.map((projeto) => {
                const pct = calcularProgresso(projeto);
                return (
                  <tr key={projeto.id}>
                    <td><strong>{projeto.nome}</strong></td>
                    <td style={{ color: 'var(--mx)' }}>{projeto.consultor_nome || '—'}</td>
                    <td style={{ color: 'var(--mx)' }}>{projeto.duracao_meses} meses</td>
                    <td style={{ minWidth: 160 }}>
                      <div className="progress-wrap">
                        <div className="progress-bg">
                          <div className="progress-fill" style={{
                            width: `${pct}%`,
                            background: pct >= 70 ? 'var(--green2)' : pct >= 40 ? '#f59e0b' : 'var(--navy2)'
                          }} />
                        </div>
                        <span className="progress-pct">{pct}%</span>
                      </div>
                      <div style={{ fontSize: '.68rem', color: 'var(--mx)', marginTop: 2 }}>
                        {progressoLabel(projeto)}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${projeto.status === 'ativo' ? 'badge-success' : 'badge-neutral'}`}>
                        {projeto.status === 'ativo' ? 'Ativo' : 'Pausado'}
                      </span>
                    </td>
                    <td>
                      <button className="btn-link" onClick={() => navigate(`/admin/projetos/${projeto.id}`)}>
                        Ver →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </MainLayout>
  );
}

export default AdminDashboard;
