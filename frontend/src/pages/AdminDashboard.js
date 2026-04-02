import React, { useState, useEffect } from 'react';
import MainLayout from '../components/MainLayout';
import Topbar from '../components/Topbar';
import { projetosService, cobrancasService, relatoriosService } from '../services/api';
import './AdminDashboard.css';

const CONSULTORES = [
  { id: 'consultor-001', nome: 'Ana Lima', especialidade: 'RH e Processos' },
  { id: 'consultor-002', nome: 'Carlos Mota', especialidade: 'Financeiro' },
  { id: 'consultor-003', nome: 'Priya Souza', especialidade: 'Operações' }
];

function AdminDashboard() {
  const [projetos, setProjetos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    ativos: 0,
    consultoresAtivos: 0,
    cobrancasAberto: 0,
    relatorioPendente: 0
  });

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const projetosRes = await projetosService.listar();
      console.log('Resposta projetos:', projetosRes);
      
      let projetosData = [];
      if (Array.isArray(projetosRes)) {
        projetosData = projetosRes;
      } else if (projetosRes && typeof projetosRes === 'object') {
        console.log('Estrutura da resposta:', Object.keys(projetosRes));
        // Backend retorna { sucesso: true, projetos: [...] }
        projetosData = projetosRes.projetos || [];
        if (!Array.isArray(projetosData)) {
          console.warn('projetosData não é array:', projetosData);
          projetosData = [];
        }
      }
      
      console.log('Projetos data final:', projetosData);
      console.log('Quantidade:', projetosData.length);
      setProjetos(projetosData);
      
      try {
        const cobrancasRes = await cobrancasService.listar();
        const cobrancasData = Array.isArray(cobrancasRes) ? cobrancasRes : cobrancasRes.cobrancas || [];
        
        const relatoriosRes = await relatoriosService.listar();
        const relatoriosData = Array.isArray(relatoriosRes) ? relatoriosRes : relatoriosRes.relatorios || [];
        
        setStats({
          ativos: projetosData.filter(p => p.status === 'ativo').length,
          consultoresAtivos: 4,
          cobrancasAberto: cobrancasData.filter(c => c.status === 'aberta').length,
          relatorioPendente: relatoriosData.length
        });
      } catch (err) {
        console.error('Erro ao carregar cobranças/relatórios:', err);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getNomeConsultor = (consultorId) => {
    const consultor = CONSULTORES.find(c => c.id === consultorId);
    return consultor ? consultor.nome : consultorId || '-';
  };

  return (
    <MainLayout>
      <Topbar 
        title="Painel geral" 
        subtitle="Bem-vinda, Lara Assis"
      />

      <div className="dashboard-content">
        {error && (
          <div style={{ 
            background: '#fee2e2', 
            border: '1px solid #fca5a5', 
            color: '#991b1b',
            padding: '12px',
            borderRadius: '6px',
            marginBottom: '20px'
          }}>
            ❌ Erro: {error}
          </div>
        )}

        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-label">Projetos ativos</div>
            <div className="metric-value">{stats.ativos}</div>
            <div className="metric-subtext">em andamento</div>
          </div>

          <div className="metric-card">
            <div className="metric-label">Relatórios pendentes</div>
            <div className="metric-value">{stats.relatorioPendente || 0}</div>
            <div className="metric-subtext">dessa semana</div>
          </div>

          <div className="metric-card">
            <div className="metric-label">Cobranças em aberto</div>
            <div className="metric-value">{stats.cobrancasAberto || 0}</div>
            <div className="metric-subtext">clique para ver</div>
          </div>

          <div className="metric-card">
            <div className="metric-label">Consultores ativos</div>
            <div className="metric-value">{stats.consultoresAtivos}</div>
            <div className="metric-subtext">em campo</div>
          </div>
        </div>

        <div className="dashboard-card">
          <h3 className="card-title">Projetos em andamento</h3>
          {loading ? (
            <p style={{ textAlign: 'center', color: '#999' }}>Carregando...</p>
          ) : (
            <table className="projects-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Consultor</th>
                  <th>Mês</th>
                  <th>Progresso</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {projetos.length > 0 ? (
                  projetos.map((projeto) => (
                    <tr key={projeto.id}>
                      <td><strong>{projeto.nome}</strong></td>
                      <td>{projeto.consultor_nome || 'N/A'}</td>
                      <td>Mês {projeto.duracao_meses}</td>
                      <td>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: '50%' }}></div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${projeto.status === 'ativo' ? 'badge-success' : 'badge-warning'}`}>
                          {projeto.status === 'ativo' ? 'Ativo' : 'Pausado'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: '#999' }}>
                      Nenhum projeto cadastrado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

export default AdminDashboard;