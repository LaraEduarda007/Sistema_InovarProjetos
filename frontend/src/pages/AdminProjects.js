import React, { useState, useEffect } from 'react';
import MainLayout from '../components/MainLayout';
import Topbar from '../components/Topbar';
import { projetosService } from '../services/api';
import './ProjectsPage.css';

const CONSULTORES = [
  { id: 'consultor-001', nome: 'Ana Lima', especialidade: 'RH e Processos' },
  { id: 'consultor-002', nome: 'Carlos Mota', especialidade: 'Financeiro' },
  { id: 'consultor-003', nome: 'Priya Souza', especialidade: 'Operações' }
];

function AdminProjects() {
  const [projetos, setProjetos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    nome: '',
    data_inicio: '',
    duracao_meses: '12',
    consultor_id: 'consultor-001'
  });

  useEffect(() => {
    carregarProjetos();
  }, []);

  const carregarProjetos = async () => {
    try {
      setLoading(true);
      const response = await projetosService.listar();
      const projetosData = response.projetos || [];
      setProjetos(projetosData);
    } catch (error) {
      console.error('Erro ao carregar projetos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await projetosService.criar(formData);

      setFormData({
        nome: '',
        data_inicio: '',
        duracao_meses: '12',
        consultor_id: 'consultor-001'
      });

      setShowForm(false);
      carregarProjetos();
      alert('Projeto criado com sucesso!');
    } catch (error) {
      console.error('Erro ao criar projeto:', error);
      alert('Erro ao criar projeto: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja deletar este projeto?')) {
      try {
        await projetosService.deletar(id);
        carregarProjetos();
        alert('Projeto deletado com sucesso!');
      } catch (error) {
        console.error('Erro ao deletar projeto:', error);
        alert('Erro ao deletar projeto: ' + error.message);
      }
    }
  };

  const getNomeConsultor = (consultorId) => {
    const consultor = CONSULTORES.find(c => c.id === consultorId);
    return consultor ? consultor.nome : 'N/A';
  };

  return (
    <MainLayout>
      <Topbar 
        title="Projetos" 
        subtitle="Gestão de todos os projetos em andamento"
      />

      <div className="page-content">
        <div className="page-header">
          <button 
            className="btn btn-primary"
            onClick={() => setShowForm(!showForm)}
          >
            + Novo projeto
          </button>
        </div>

        {showForm && (
          <div className="card" style={{ marginBottom: '20px' }}>
            <h3 className="card-title">Criar novo projeto</h3>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '10px' }}>
                <label>Nome do cliente/supermercado *</label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) =>
                    setFormData({ ...formData, nome: e.target.value })
                  }
                  required
                  placeholder="Ex: Supermercado Bom Preço"
                />
              </div>

              <div style={{ marginBottom: '10px' }}>
                <label>Consultor responsável *</label>
                <select
                  value={formData.consultor_id}
                  onChange={(e) =>
                    setFormData({ ...formData, consultor_id: e.target.value })
                  }
                  required
                >
                  {CONSULTORES.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nome} - {c.especialidade}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '10px' }}>
                <label>Data de início *</label>
                <input
                  type="date"
                  value={formData.data_inicio}
                  onChange={(e) =>
                    setFormData({ ...formData, data_inicio: e.target.value })
                  }
                  required
                />
              </div>

              <div style={{ marginBottom: '10px' }}>
                <label>Duração (meses)</label>
                <select
                  value={formData.duracao_meses}
                  onChange={(e) =>
                    setFormData({ ...formData, duracao_meses: e.target.value })
                  }
                >
                  <option value="6">6 meses</option>
                  <option value="12">12 meses</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="btn btn-primary">
                  Criar projeto
                </button>

                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowForm(false)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="card">
          <h3 className="card-title">Lista de projetos</h3>

          {loading ? (
            <p style={{ textAlign: 'center', color: '#999' }}>
              Carregando...
            </p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Consultor</th>
                  <th>Mês</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>

              <tbody>
                {projetos.length > 0 ? (
                  projetos.map((projeto) => (
                    <tr key={projeto.id}>
                      <td>
                        <strong>{projeto.nome || 'N/A'}</strong>
                      </td>

                      <td>
  {projeto.consultor_nome || 'N/A'}
</td>

                      <td>
                        Mês {projeto.duracao_meses || 12}
                      </td>

                      <td>
                        <span className={`badge ${
                          projeto.status === 'ativo'
                            ? 'badge-success'
                            : 'badge-warning'
                        }`}>
                          {projeto.status}
                        </span>
                      </td>

                      <td>
                        <button className="btn-link">Ver</button>

                        <button 
                          className="btn-link"
                          style={{ color: 'red', marginLeft: '10px' }}
                          onClick={() => handleDelete(projeto.id)}
                        >
                          Deletar
                        </button>
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

export default AdminProjects;