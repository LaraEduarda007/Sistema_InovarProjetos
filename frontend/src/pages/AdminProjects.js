import React from 'react';
import MainLayout from '../components/MainLayout';
import Topbar from '../components/Topbar';
import './ProjectsPage.css';

function AdminProjects() {
  return (
    <MainLayout>
      <Topbar 
        title="Projetos" 
        subtitle="Gestão de todos os projetos em andamento"
      />

      <div className="page-content">
        <div className="page-header">
          <button className="btn btn-primary">Novo projeto</button>
        </div>

        <div className="card">
          <h3 className="card-title">Lista de projetos</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Consultor</th>
                <th>Mês</th>
                <th>Progresso</th>
                <th>Status</th>
                <th>Ações</th>
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
                <td><button className="btn-link">Ver</button></td>
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
                <td><button className="btn-link">Ver</button></td>
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
                <td><button className="btn-link">Ver</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </MainLayout>
  );
}

export default AdminProjects;
