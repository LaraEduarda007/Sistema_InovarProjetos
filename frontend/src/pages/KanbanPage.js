import React, { useState, useEffect } from 'react';
import MainLayout from '../components/MainLayout';
import Topbar from '../components/Topbar';
import { atividadesService } from '../services/api';
import './KanbanPage.css';

function KanbanPage() {
  const [atividades, setAtividades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState('todas');

  useEffect(() => {
    carregarAtividades();
  }, []);

  const carregarAtividades = async () => {
    try {
      setLoading(true);
      const response = await atividadesService.listar();
      const atividadesData = response.atividades || [];
      setAtividades(atividadesData);
    } catch (error) {
      console.error('Erro ao carregar atividades:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAtividadesPorStatus = (status) => {
    if (filtroStatus === 'todas') {
      return atividades.filter(a => a.status === status);
    }
    return atividades.filter(a => a.status === status);
  };

  const statuses = [
    { valor: 'a-fazer', label: 'A fazer', cor: '#1d4ed8' },
    { valor: 'em-andamento', label: 'Em andamento', cor: '#b45309' },
    { valor: 'concluido', label: 'Concluído', cor: '#059669' },
    { valor: 'nao-realizado', label: 'Não realizado', cor: '#991b1b' }
  ];

  return (
    <MainLayout>
      <Topbar 
        title="Kanban" 
        subtitle="Visualize o status de todas as atividades"
      />

      <div className="page-content">
        {loading ? (
          <p style={{ textAlign: 'center', color: '#999' }}>Carregando...</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
            {statuses.map((status) => (
              <div key={status.valor} style={{
                background: '#f8fafc',
                borderRadius: '8px',
                padding: '12px',
                minHeight: '400px'
              }}>
                <div style={{
                  fontSize: '13px',
                  fontWeight: '700',
                  color: status.cor,
                  marginBottom: '10px'
                }}>
                  {status.label} ({getAtividadesPorStatus(status.valor).length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {getAtividadesPorStatus(status.valor).map((atividade) => (
                    <div key={atividade.id} style={{
                      background: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      padding: '10px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }} 
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = '#1a3f6f'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                    >
                      <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                        {atividade.titulo}
                      </div>
                      <div style={{ fontSize: '11px', color: '#666' }}>
                        {atividade.setor} · Mês {atividade.mes} S{atividade.semana}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}

export default KanbanPage;