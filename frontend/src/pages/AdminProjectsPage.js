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

function AdminProjectsPage() {
  const [projetos, setProjetos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({ 
    nome: '', 
    data_inicio: '', 
    duracao_meses: 12,
    consultor_id: 'consultor-001'
  });

  useEffect(() => {
    carregarProjetos();
  }, []);

  const carregarProjetos = async () => {
    try {
      setCarregando(true);
      const response = await projetosService.listar();
      setProjetos(response.projetos || []);
      setErro(null);
    } catch (err) {
      setErro('Erro ao carregar projetos');
      console.error(err);
    } finally {
      setCarregando(false);
    }
  };

  const handleCriar = async (e) => {
    e.preventDefault();
    try {
      await projetosService.criar(formData);
      setFormData({ 
        nome: '', 
        data_inicio: '', 
        duracao_meses: 12, 
        consultor_id: 'consultor-001' 
      });
      setShowModal(false);
      carregarProjetos();
    } catch (err) {
      setErro('Erro ao criar projeto');
      console.error(err);
    }
  };

  const handleDeletar = async (id) => {
    if (window.confirm('Tem certeza que deseja deletar este projeto?')) {
      try {
        await projetosService.deletar(id);
        carregarProjetos();
      } catch (err) {
        setErro('Erro ao deletar projeto');
      }
    }
  };

  const getNomeConsultor = (consultorId) => {
    const consultor = CONSULTORES.find(c => c.id === consultorId);
    return consultor ? consultor.nome : 'N/A';
  };

  if (carregando) {
    return (
      <MainLayout>
        <Topbar title="Projetos" />
        <div className="loading">Carregando...</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Topbar 
        title="Projetos" 
        subtitle="Gestão de todos os projetos"
      />

      {erro && <div className="alert alert-error">{erro}</div>}

      <div className="page-content">
        <div className="page-header">
          <button 
            className="btn btn-primary" 
            onClick={() => setShowModal(true)}
          >
            + Novo projeto
          </button>
        </div>

        <div className="card">
          <h3 className="card-title">Lista de projetos</h3>

          {projetos.length === 0 ? (
            <p className="empty-state">Nenhum projeto cadastrado</p>
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
                {projetos.map((projeto) => (
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
                      <span className="badge badge-success">
                        {projeto.status}
                      </span>
                    </td>

                    <td>
                      <button className="btn-link">Ver</button>

                      <button 
                        className="btn-link danger"
                        onClick={() => handleDeletar(projeto.id)}
                      >
                        Deletar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div 
          className="modal-overlay" 
          onClick={() => setShowModal(false)}
        >
          <div 
            className="modal-box" 
            onClick={e => e.stopPropagation()}
          >
            <h2>Novo Projeto</h2>

            <form onSubmit={handleCriar}>
              <div className="form-group">
                <label>Nome do Cliente *</label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) =>
                    setFormData({ ...formData, nome: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Consultor Responsável *</label>
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

              <div className="form-group">
                <label>Data de Início *</label>
                <input
                  type="date"
                  value={formData.data_inicio}
                  onChange={(e) =>
                    setFormData({ ...formData, data_inicio: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Duração (meses)</label>
                <input
                  type="number"
                  value={formData.duracao_meses}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      duracao_meses: parseInt(e.target.value)
                    })
                  }
                  min="1"
                  max="24"
                />
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </button>

                <button 
                  type="submit" 
                  className="btn btn-primary"
                >
                  Criar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}

export default AdminProjectsPage;