import React, { useState, useEffect } from 'react';
import MainLayout from '../components/MainLayout';
import Topbar from '../components/Topbar';
import { relatoriosService } from '../services/api';
import './RelatoriosPage.css';

function RelatoriosPage() {
  const [relatorios, setRelatorios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarRelatorios();
  }, []);

  const carregarRelatorios = async () => {
    try {
      setLoading(true);
      const response = await relatoriosService.listar();
      const relatoriosData = response.relatorios || [];
      setRelatorios(relatoriosData);
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <Topbar 
        title="Relatórios" 
        subtitle="Histórico de atividades realizadas"
      />

      <div className="page-content">
        <div className="card">
          <h3 className="card-title">Relatórios</h3>
          {loading ? (
            <p style={{ textAlign: 'center', color: '#999' }}>Carregando...</p>
          ) : relatorios.length > 0 ? (
            <div>
              {relatorios.map((relatorio) => (
                <div key={relatorio.id} style={{
                  padding: '12px',
                  borderBottom: '1px solid #eee',
                  marginBottom: '10px'
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                    Atividade: {relatorio.atividade_id}
                  </div>
                  <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>
                    {relatorio.o_que_foi_realizado}
                  </div>
                  <div style={{ fontSize: '11px', color: '#999' }}>
                    {new Date(relatorio.enviado_em).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ textAlign: 'center', color: '#999' }}>Nenhum relatório</p>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

export default RelatoriosPage;