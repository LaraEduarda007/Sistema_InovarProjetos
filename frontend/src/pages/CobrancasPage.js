import React, { useState, useEffect } from 'react';
import MainLayout from '../components/MainLayout';
import Topbar from '../components/Topbar';
import { cobrancasService } from '../services/api';
import './CobrancasPage.css';

const CONSULTORES = [
  { id: 'consultor-001', nome: 'Ana Lima', especialidade: 'RH e Processos' },
  { id: 'consultor-002', nome: 'Carlos Mota', especialidade: 'Financeiro' },
  { id: 'consultor-003', nome: 'Priya Souza', especialidade: 'Operações' }
];

function CobrancasPage() {
  const [cobrancas, setCobrancas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    consultor_id: 'consultor-001',
    mensagem: '',
    prazo: '',
    urgencia: 'normal'
  });

  useEffect(() => {
    carregarCobrancas();
  }, []);

  const carregarCobrancas = async () => {
    try {
      setLoading(true);
      const response = await cobrancasService.listar();
      const cobrancasData = response.cobrancas || [];
      setCobrancas(cobrancasData);
    } catch (error) {
      console.error('Erro ao carregar cobranças:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validar campos obrigatórios
      if (!formData.consultor_id || !formData.prazo) {
        alert('Preencha consultor e prazo');
        return;
      }
      
      const payload = {
  consultorId: formData.consultor_id,
  mensagem: formData.mensagem,
  prazo: formData.prazo,
  urgencia: formData.urgencia
};
      
      console.log('Enviando cobrança:', payload);
      await cobrancasService.criar(payload);
      setFormData({ consultor_id: 'consultor-001', mensagem: '', prazo: '', urgencia: 'normal' });
      setShowForm(false);
      carregarCobrancas();
      alert('Cobrança criada com sucesso!');
    } catch (error) {
      console.error('Erro ao criar cobrança:', error.response?.data || error);
      alert('Erro ao criar cobrança: ' + error.message);
    }
  };

  const getNomeConsultor = (consultorId) => {
    const consultor = CONSULTORES.find(c => c.id === consultorId);
    return consultor ? consultor.nome : consultorId;
  };

  return (
    <MainLayout>
      <Topbar 
        title="Cobranças" 
        subtitle="Acompanhe atividades pendentes"
      />

      <div className="page-content">
        <div className="page-header">
          <button 
            className="btn btn-primary"
            onClick={() => setShowForm(!showForm)}
          >
            Nova cobrança
          </button>
        </div>

        {showForm && (
          <div className="card" style={{ marginBottom: '20px' }}>
            <h3 className="card-title">Criar nova cobrança</h3>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '10px' }}>
                <label>Consultor *</label>
                <select
                  value={formData.consultor_id}
                  onChange={(e) => setFormData({ ...formData, consultor_id: e.target.value })}
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
                <label>Mensagem</label>
                <textarea
                  value={formData.mensagem}
                  onChange={(e) => setFormData({ ...formData, mensagem: e.target.value })}
                  placeholder="Mensagem da cobrança"
                  rows="3"
                />
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label>Prazo *</label>
                <input
                  type="date"
                  value={formData.prazo}
                  onChange={(e) => setFormData({ ...formData, prazo: e.target.value })}
                  required
                />
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label>Urgência</label>
                <select
                  value={formData.urgencia}
                  onChange={(e) => setFormData({ ...formData, urgencia: e.target.value })}
                >
                  <option value="normal">Normal</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="btn btn-primary">Criar cobrança</button>
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
          <h3 className="card-title">Cobranças pendentes</h3>
          {loading ? (
            <p style={{ textAlign: 'center', color: '#999' }}>Carregando...</p>
          ) : cobrancas.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Consultor</th>
                  <th>Prazo</th>
                  <th>Urgência</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {cobrancas.map((cobranca) => (
                  <tr key={cobranca.id}>
                    <td>{getNomeConsultor(cobranca.consultor_id)}</td>
                    <td>{cobranca.prazo}</td>
                    <td>{cobranca.urgencia}</td>
                    <td>
                      <span className={`badge ${cobranca.status === 'aberta' ? 'badge-warning' : 'badge-success'}`}>
                        {cobranca.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ textAlign: 'center', color: '#999' }}>Nenhuma cobrança</p>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

export default CobrancasPage;