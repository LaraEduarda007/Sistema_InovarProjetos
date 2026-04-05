import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import Topbar from '../components/Topbar';
import { projetosService, atividadesService } from '../services/api';

function ConsultorProjetosPage() {
  const [projetos, setProjetos]           = useState([]);
  const [pendenciasPorProjeto, setPendencias] = useState({});
  const [progressoMap, setProgressoMap]   = useState({});
  const [loading, setLoading]             = useState(true);
  const [erro, setErro]                   = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    carregarProjetos();
  }, []);

  const carregarProjetos = async () => {
    try {
      setLoading(true);
      setErro(null);

      const [projetosRes, atividadesRes] = await Promise.all([
        projetosService.listar(),
        atividadesService.listar() // backend filtra pelo consultor logado
      ]);

      const projetosData   = projetosRes.projetos || [];
      const atividadesData = atividadesRes.atividades || [];

      // Conta pendências por projeto
      const pendencias = {};
      atividadesData.forEach(atv => {
        if (!atv.relatorio_id && (atv.status === 'a-fazer' || atv.status === 'em-andamento')) {
          pendencias[atv.projeto_id] = (pendencias[atv.projeto_id] || 0) + 1;
        }
      });

      // Progresso: semanas completas / total semanas do projeto
      const semanasAgrupadas = {};
      for (const a of atividadesData) {
        const chave = `${a.projeto_id}__${a.mes}__${a.semana}`;
        if (!semanasAgrupadas[chave]) semanasAgrupadas[chave] = { projeto_id: a.projeto_id, total: 0, concluidas: 0 };
        semanasAgrupadas[chave].total++;
        if (a.status === 'concluido') semanasAgrupadas[chave].concluidas++;
      }

      const semanasCompletas = {};
      for (const s of Object.values(semanasAgrupadas)) {
        if (!semanasCompletas[s.projeto_id]) semanasCompletas[s.projeto_id] = 0;
        if (s.total > 0 && s.concluidas === s.total) semanasCompletas[s.projeto_id]++;
      }

      const mapa = {};
      for (const p of projetosData) {
        const totalSemanas = (p.duracao_meses || 12) * 4;
        const completas = semanasCompletas[p.id] || 0;
        mapa[p.id] = { completas, totalSemanas, pct: Math.round((completas / totalSemanas) * 100) };
      }

      setProjetos(projetosData);
      setPendencias(pendencias);
      setProgressoMap(mapa);
    } catch (err) {
      setErro('Erro ao carregar projetos.');
    } finally {
      setLoading(false);
    }
  };

  const calcularProgresso = (projeto) => progressoMap[projeto.id]?.pct || 0;

  const calcularMesAtual = (projeto) => {
    if (!projeto.data_inicio) return '—';
    const inicio = new Date(projeto.data_inicio);
    const hoje = new Date();
    const mes = (hoje.getFullYear() - inicio.getFullYear()) * 12 + (hoje.getMonth() - inicio.getMonth()) + 1;
    return `Mês ${Math.min(Math.max(mes, 1), projeto.duracao_meses)}`;
  };

  return (
    <MainLayout>
      <Topbar title="Meus projetos" subtitle="Projetos atribuídos a você" />

      {erro && <div className="alert alert-error">{erro}</div>}

      <div className="card">
        {loading ? (
          <p className="empty-state">Carregando...</p>
        ) : projetos.length === 0 ? (
          <p className="empty-state">Nenhum projeto atribuído.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Mês atual</th>
                <th>Progresso</th>
                <th>Pendências</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {projetos.map((projeto) => {
                const pct       = calcularProgresso(projeto);
                const mesAtual  = calcularMesAtual(projeto);
                const qtdPend   = pendenciasPorProjeto[projeto.id] || 0;

                return (
                  <tr key={projeto.id}>
                    <td><strong>{projeto.nome}</strong></td>
                    <td style={{ color: 'var(--mx)' }}>{mesAtual}</td>
                    <td style={{ minWidth: 130 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="progress-wrap" style={{ flex: 1 }}>
                          <div className="progress-fill" style={{ width: `${pct}%` }} />
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--mx)', minWidth: 32 }}>{pct}%</span>
                      </div>
                    </td>
                    <td>
                      {qtdPend > 0 ? (
                        <span className="badge badge-warning">{qtdPend} pendente{qtdPend > 1 ? 's' : ''}</span>
                      ) : (
                        <span className="badge badge-success">Em dia</span>
                      )}
                    </td>
                    <td>
                      <button
                        className="btn-link"
                        onClick={() => navigate(`/consultor/projetos/${projeto.id}`)}
                      >
                        Ver atividades →
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

export default ConsultorProjetosPage;
