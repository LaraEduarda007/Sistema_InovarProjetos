import React, { useState, useEffect } from 'react';
import MainLayout from '../components/MainLayout';
import Topbar from '../components/Topbar';
import { cobrancasService, usuariosService } from '../services/api';
import './CobrancasPage.css';

function CobrancasPage() {
  const [cobrancas, setCobrancas]     = useState([]);
  const [consultores, setConsultores] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [erro, setErro]               = useState(null);
  const [showModal, setShowModal]     = useState(false);
  const [salvando, setSalvando]       = useState(false);

  const [formData, setFormData] = useState({
    consultorId: '',
    prazo: '',
    urgencia: 'normal',
    mensagem: ''
  });

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      setErro(null);

      const [cobRes, consRes] = await Promise.all([
        cobrancasService.listar(),
        usuariosService.listarConsultores()
      ]);

      setCobrancas(cobRes.cobrancas || []);
      const lista = consRes.consultores || [];
      setConsultores(lista);

      if (lista.length > 0) {
        setFormData(f => ({ ...f, consultorId: lista[0].id }));
      }
    } catch (err) {
      setErro('Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  };

  const handleEnviar = async (e) => {
    e.preventDefault();
    try {
      setSalvando(true);
      await cobrancasService.criar(formData);
      setShowModal(false);
      setFormData({ consultorId: consultores[0]?.id || '', prazo: '', urgencia: 'normal', mensagem: '' });
      carregarDados();
    } catch (err) {
      setErro('Erro ao enviar cobrança.');
    } finally {
      setSalvando(false);
    }
  };

  // Busca o nome do consultor pelo id
  const getNomeConsultor = (id) => {
    const c = consultores.find(c => c.id === id);
    return c ? c.nome : id;
  };

  const statusBadge = (status) => {
    if (status === 'aberta')    return <span className="badge badge-warning">Aberta</span>;
    if (status === 'resolvida') return <span className="badge badge-success">Resolvida</span>;
    return <span className="badge badge-neutral">{status}</span>;
  };

  const urgenciaBadge = (urgencia) => {
    if (urgencia === 'urgente') return <span className="badge badge-danger">Urgente</span>;
    return <span className="badge badge-neutral">Normal</span>;
  };

  const formatarData = (data) => {
    if (!data) return '—';
    return new Date(data).toLocaleDateString('pt-BR');
  };

  return (
    <MainLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <Topbar title="Cobranças" subtitle="Gerencie atividades pendentes dos consultores" semUsuario />
        <button className="btn btn-warning" onClick={() => setShowModal(true)}>
          + Nova cobrança
        </button>
      </div>

      {erro && <div className="alert alert-error">{erro}</div>}

      {/* Métricas rápidas */}
      <div className="metrics-grid cols-3" style={{ marginBottom: '1.25rem' }}>
        <div className="metric-card">
          <div className="metric-label">Total de cobranças</div>
          <div className="metric-value">{cobrancas.length}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Em aberto</div>
          <div className={`metric-value ${cobrancas.filter(c => c.status === 'aberta').length > 0 ? 'warn' : ''}`}>
            {cobrancas.filter(c => c.status === 'aberta').length}
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Resolvidas</div>
          <div className="metric-value good">
            {cobrancas.filter(c => c.status === 'resolvida').length}
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="card">
        <div className="card-title">Lista de cobranças</div>

        {loading ? (
          <p className="empty-state">Carregando...</p>
        ) : cobrancas.length === 0 ? (
          <p className="empty-state">Nenhuma cobrança registrada.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Consultor</th>
                <th>Prazo</th>
                <th>Urgência</th>
                <th>Status</th>
                <th>Enviada em</th>
              </tr>
            </thead>
            <tbody>
              {cobrancas.map((cob) => (
                <tr key={cob.id}>
                  <td><strong>{getNomeConsultor(cob.consultor_id)}</strong></td>
                  <td style={{ color: 'var(--mx)' }}>{formatarData(cob.prazo)}</td>
                  <td>{urgenciaBadge(cob.urgencia)}</td>
                  <td>{statusBadge(cob.status)}</td>
                  <td style={{ color: 'var(--mx)' }}>{formatarData(cob.enviada_em)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal nova cobrança */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>

            <div className="modal-header warn">
              <h3>Enviar cobrança</h3>
              <div className="modal-sub">O consultor receberá uma notificação no sistema</div>
            </div>

            <div className="modal-body">
              <div className="alert alert-warning" style={{ marginBottom: '1rem' }}>
                Selecione o consultor e informe o prazo para regularização.
              </div>

              <form onSubmit={handleEnviar}>
                <div className="form-group">
                  <label className="form-label">Consultor *</label>
                  <select
                    className="inp"
                    value={formData.consultorId}
                    onChange={e => setFormData({ ...formData, consultorId: e.target.value })}
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
                    <label className="form-label">Prazo para envio *</label>
                    <input
                      className="inp"
                      type="date"
                      value={formData.prazo}
                      onChange={e => setFormData({ ...formData, prazo: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Urgência</label>
                    <select
                      className="inp"
                      value={formData.urgencia}
                      onChange={e => setFormData({ ...formData, urgencia: e.target.value })}
                    >
                      <option value="normal">Normal</option>
                      <option value="urgente">Urgente</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Mensagem (opcional)</label>
                  <textarea
                    className="inp"
                    rows="3"
                    placeholder="Ex: Por favor regularize os relatórios até a data acima..."
                    value={formData.mensagem}
                    onChange={e => setFormData({ ...formData, mensagem: e.target.value })}
                  />
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-warning" disabled={salvando}>
                    {salvando ? 'Enviando...' : 'Enviar cobrança'}
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

export default CobrancasPage;
