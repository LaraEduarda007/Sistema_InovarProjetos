import React from 'react';
import MainLayout from '../components/MainLayout';
import Topbar from '../components/Topbar';
import './AdminDashboard.css';

function AdminDashboard() {
  return (
    <MainLayout>
      <Topbar 
        title="Painel geral" 
        subtitle="Bem-vinda, Lara Assis"
      />

      <div className="dashboard-content">
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-label">Projetos ativos</div>
            <div className="metric-value">8</div>
            <div className="metric-subtext">2 encerram em breve</div>
          </div>

          <div className="metric-card">
            <div className="metric-label">Relatórios pendentes</div>
            <div className="metric-value">14</div>
            <div className="metric-subtext">dessa semana</div>
          </div>

          <div className="metric-card">
            <div className="metric-label">Cobranças em aberto</div>
            <div className="metric-value">3</div>
            <div className="metric-subtext">clique para ver</div>
          </div>

          <div className="metric-card">
            <div className="metric-label">Consultores ativos</div>
            <div className="metric-value">6</div>
            <div className="metric-subtext">em campo</div>
          </div>
        </div>

        <div className="dashboard-card">
          <h3 className="card-title">Projetos em andamento</h3>
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
              <tr>
                <td>Supermercado Bom Preço</td>
                <td>Ana Lima</td>
                <td>Mês 4</td>
                <td>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: '33%' }}></div>
                  </div>
                </td>
                <td><span className="badge badge-success">Ativo</span></td>
              </tr>
              <tr>
                <td>Mercado Serra Verde</td>
                <td>Carlos Mota</td>
                <td>Mês 7</td>
                <td>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: '58%' }}></div>
                  </div>
                </td>
                <td><span className="badge badge-warning">3 pendências</span></td>
              </tr>
              <tr>
                <td>Rede Família Atacarejo</td>
                <td>Priya Souza</td>
                <td>Mês 2</td>
                <td>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: '17%' }}></div>
                  </div>
                </td>
                <td><span className="badge badge-success">Ativo</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </MainLayout>
  );
}

export default AdminDashboard;
