import React from 'react';
import MainLayout from '../components/MainLayout';
import Topbar from '../components/Topbar';
import './ConsultorDashboard.css';

function ConsultorDashboard() {
  return (
    <MainLayout>
      <Topbar 
        title="Meu painel" 
        subtitle="Bem-vindo ao seu espaço de trabalho"
      />

      <div className="dashboard-content">
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-label">Projetos ativos</div>
            <div className="metric-value">3</div>
          </div>

          <div className="metric-card">
            <div className="metric-label">Pendentes esta semana</div>
            <div className="metric-value">2</div>
          </div>

          <div className="metric-card">
            <div className="metric-label">Minha produtividade</div>
            <div className="metric-value">90%</div>
          </div>
        </div>

        <div className="dashboard-card">
          <h3 className="card-title">Atividades pendentes - esta semana</h3>
          <div className="activities-list">
            <div className="activity-item activity-pending">
              <div className="activity-status"></div>
              <div className="activity-info">
                <div className="activity-title">Inventário açougue</div>
                <div className="activity-meta">Bom Preço - Mês 4, Semana 2 - Relatório em atraso</div>
              </div>
              <button className="btn-action">Registrar</button>
            </div>

            <div className="activity-item activity-pending">
              <div className="activity-status"></div>
              <div className="activity-info">
                <div className="activity-title">Período de experiência</div>
                <div className="activity-meta">Bom Preço - Mês 4, Semana 2 - Relatório em atraso</div>
              </div>
              <button className="btn-action">Registrar</button>
            </div>

            <div className="activity-item activity-todo">
              <div className="activity-status"></div>
              <div className="activity-info">
                <div className="activity-title">Rotina de precificação</div>
                <div className="activity-meta">Serra Verde - Mês 7, Semana 1 - A fazer</div>
              </div>
              <button className="btn-action">Registrar</button>
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <h3 className="card-title">Meus projetos</h3>
          <div className="projects-list">
            <div className="project-item">
              <div>
                <div className="project-name">Supermercado Bom Preço</div>
                <div className="project-meta">Mês 4 de 12</div>
              </div>
              <div className="project-progress">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: '33%' }}></div>
                </div>
                <div className="progress-text">33%</div>
              </div>
            </div>

            <div className="project-item">
              <div>
                <div className="project-name">Mercado Serra Verde</div>
                <div className="project-meta">Mês 7 de 12</div>
              </div>
              <div className="project-progress">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: '58%' }}></div>
                </div>
                <div className="progress-text">58%</div>
              </div>
            </div>

            <div className="project-item">
              <div>
                <div className="project-name">Rede Família Atacarejo</div>
                <div className="project-meta">Mês 2 de 12</div>
              </div>
              <div className="project-progress">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: '17%' }}></div>
                </div>
                <div className="progress-text">17%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default ConsultorDashboard;
