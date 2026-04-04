import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import Topbar from '../components/Topbar';
import { projetosService, usuariosService } from '../services/api';

function AdminProjectsPage() {
  const navigate = useNavigate();
  const [projetos, setProjetos]         = useState([]);
  const [consultores, setConsultores]   = useState([]);
  const [carregando, setCarregando]     = useState(true);
  const [erro, setErro]                 = useState(null);
  const [showModal, setShowModal]       = useState(false);
  const [salvando, setSalvando]         = useState(false);

  const [formData, setFormData] = useState({
    nome: '',
    data_inicio: '',
    duracao_meses: 12,
    consultor_id: ''
  });

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setCarregando(true);
      setErro(null);

      const [projetosRes, consultoresRes] = await Promise.all([
        projetosService.listar(),
        usuariosService.listarConsultores()
      ]);

      setProjetos(projetosRes.projetos || []);
      const lista = consultoresRes.consultores || [];
      setConsultores(lista);

      // Pré-seleciona o primeiro consultor
      if (lista.length > 0) {
        setFormData(f => ({ ...f, consultor_id: lista[0].id }));
      }
    } catch (err) {
      setErro('Erro ao carregar dados. Verifique se o servidor está rodando.');
    } finally {
      setCarregando(false);
    }
  };

  const handleCriar = async (e) => {
    e.preventDefault();
    try {
      setSalvando(true);
      await projetosService.criar(formData);
      setShowModal(false);
      setFormData({ nome: '', data_inicio: '', duracao_meses: 12, consultor_id: consultores[0]?.id || '' });
      carregarDados();
    } catch (err) {
      setErro('Erro ao criar projeto.');
    } finally {
      setSalvando(false);
    }
  };

  const handleDeletar = async (id) => {
    if (!window.confirm('Tem certeza que deseja deletar este projeto?')) return;
    try {
      await projetosService.deletar(id);
      carregarDados();
    } catch (err) {
      setErro('Erro ao deletar projeto.');
    }
  };

  return (
    <MainLayout>
      {/* Topbar com botão */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <Topbar title="Projetos" subtitle="Gerencie todos os projetos" semUsuario />
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Novo projeto
        </button>
      </div>

      {erro && <div className="alert alert-error">{erro}</div>}

      {/* Tabela de projetos */}
      <div className="card">
        <div className="card-title">Lista de projetos</div>

        {carregando ? (
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
                <th>Status</th>
                <th>Ações</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {projetos.map((projeto) => (
                <tr key={projeto.id}>
                  <td><strong>{projeto.nome}</strong></td>
                  <td style={{ color: 'var(--mx)' }}>{projeto.consultor_nome || '—'}</td>
                  <td style={{ color: 'var(--mx)' }}>{projeto.duracao_meses} meses</td>
                  <td>
                    <span className={`badge ${projeto.status === 'ativo' ? 'badge-success' : 'badge-neutral'}`}>
                      {projeto.status === 'ativo' ? 'Ativo' : 'Pausado'}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn-link danger"
                      onClick={() => handleDeletar(projeto.id)}
                    >
                      Deletar
                    </button>
                  </td>
                  <td>
                    <button
                      className="btn-link"
                      onClick={() => navigate(`/admin/projetos/${projeto.id}`)}
                    >
                      Ver →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal novo projeto */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>

            <div className="modal-header">
              <h3>Novo projeto</h3>
              <div className="modal-sub">Preencha os dados do cliente e consultor responsável</div>
            </div>

            <div className="modal-body">
              <form onSubmit={handleCriar}>

                <div className="form-group">
                  <label className="form-label">Nome do cliente *</label>
                  <input
                    className="inp"
                    type="text"
                    placeholder="Ex: Supermercado Bom Preço"
                    value={formData.nome}
                    onChange={e => setFormData({ ...formData, nome: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Consultor responsável *</label>
                  <select
                    className="inp"
                    value={formData.consultor_id}
                    onChange={e => setFormData({ ...formData, consultor_id: e.target.value })}
                    required
                  >
                    <option value="">Selecione...</option>
                    {consultores.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.nome}{c.especialidade ? ` — ${c.especialidade}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-row cols-2">
                  <div className="form-group">
                    <label className="form-label">Data de início *</label>
                    <input
                      className="inp"
                      type="date"
                      value={formData.data_inicio}
                      onChange={e => setFormData({ ...formData, data_inicio: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Duração (meses)</label>
                    <input
                      className="inp"
                      type="number"
                      min="1"
                      max="24"
                      value={formData.duracao_meses}
                      onChange={e => setFormData({ ...formData, duracao_meses: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={salvando}>
                    {salvando ? 'Salvando...' : 'Criar projeto'}
                  </button>
                </div>

              </form>
            </div>

          </div>
        </div>
      )}
    </MainLayout>
  );
}

export default AdminProjectsPage;
