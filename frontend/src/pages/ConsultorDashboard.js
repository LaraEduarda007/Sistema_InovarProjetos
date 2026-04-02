import React, { useState, useEffect } from 'react';
import MainLayout from '../components/MainLayout';
import Topbar from '../components/Topbar';
import { projetosService, atividadesService } from '../services/api';
import './ConsultorDashboard.css';

function ConsultorDashboard() {
  const [projetos, setProjetos] = useState([]);
  const [atividades, setAtividades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    ativos: 0,
    pendentes: 0,
    produtividade: 0
  });

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
      
      const projetosData = projetosRes.projetos || [];
      const atividadesData = atividadesRes.atividades || [];
      
      setProjetos(projetosData);
      setAtividades(atividadesData);
      
      setStats({
        ativos: projetosData.length,
        pendentes: atividadesData.filter(a => a.status === 'a-fazer').length,
        produtividade: 90
      });
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <Topbar 
        title="Meu painel" 
        subtitle="Bem-vindo à sua área de trabalho"
      />

      <div className="dashboard-content">
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-label">Projetos ativos</div>
            <div className="metric-value">{stats.ativos}</div>
          </div>

          <div className="metric-card">
            <div className="metric-label">Pendentes esta semana</div>
            <div className="metric-value" style={{ color: '#f59e0b' }}>{stats.pendentes}</div>
          </div>

          <div className="metric-card">
            <div className="metric-label">Minha produtividade</div>
            <div className="metric-value" style={{ color: '#10b981' }}>{stats.produtividade}%</div>
          </div>
        </div>

        <div className="dashboard-card">
          <h3 className="card-title">Meus projetos</h3>
          {loading ? (
            <p style={{ textAlign: 'center', color: '#999' }}>Carregando...</p>
          ) : projetos.length > 0 ? (
            <table className="projects-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Mês</th>
                  <th>Progresso</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {projetos.map((projeto) => (
                  <tr key={projeto.id}>
                    <td>{projeto.consultor_nome || 'N/A'}</td>
                    <td>Mês {projeto.duracao_meses}</td>
                    <td>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: '50%' }}></div>
                      </div>
                    </td>
                    <td><span className="badge badge-success">Ativo</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ textAlign: 'center', color: '#999' }}>Nenhum projeto atribuído</p>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

export default ConsultorDashboard;