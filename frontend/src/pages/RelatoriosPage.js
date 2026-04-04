import React, { useState, useEffect } from 'react';
import MainLayout from '../components/MainLayout';
import Topbar from '../components/Topbar';
import { relatoriosService } from '../services/api';
import './RelatoriosPage.css';

function RelatoriosPage() {
  const [relatorios, setRelatorios] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [erro, setErro]             = useState(null);

  useEffect(() => {
    carregarRelatorios();
  }, []);

  const carregarRelatorios = async () => {
    try {
      setLoading(true);
      setErro(null);
      const response = await relatoriosService.listar();
      setRelatorios(response.relatorios || []);
    } catch (error) {
      setErro('Erro ao carregar relatórios.');
    } finally {
      setLoading(false);
    }
  };

  const formatarData = (data) => {
    if (!data) return '—';
    return new Date(data).toLocaleDateString('pt-BR');
  };

  return (
    <MainLayout>
      <Topbar title="Relatórios" subtitle="Histórico de atividades realizadas pelos consultores" />

      {erro && <div className="alert alert-error">{erro}</div>}

      <div className="card">
        <div className="card-title">Relatórios enviados</div>

        {loading ? (
          <p className="empty-state">Carregando...</p>
        ) : relatorios.length === 0 ? (
          <p className="empty-state">Nenhum relatório enviado ainda.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Atividade</th>
                <th>Projeto</th>
                <th>Consultor</th>
                <th>Mês / Semana</th>
                <th>Enviado em</th>
              </tr>
            </thead>
            <tbody>
              {relatorios.map((rel) => (
                <tr key={rel.id}>
                  <td>
                    <strong>{rel.atividade_titulo || '—'}</strong>
                    {rel.o_que_foi_realizado && (
                      <div style={{ fontSize: 12, color: 'var(--mx)', marginTop: 2 }}>
                        {rel.o_que_foi_realizado.length > 60
                          ? rel.o_que_foi_realizado.slice(0, 60) + '...'
                          : rel.o_que_foi_realizado}
                      </div>
                    )}
                  </td>
                  <td style={{ color: 'var(--mx)' }}>{rel.projeto_nome || '—'}</td>
                  <td style={{ color: 'var(--mx)' }}>{rel.consultor_nome || '—'}</td>
                  <td style={{ color: 'var(--mx)' }}>
                    {rel.mes ? `Mês ${rel.mes} · S${rel.semana}` : '—'}
                  </td>
                  <td style={{ color: 'var(--mx)' }}>{formatarData(rel.enviado_em)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </MainLayout>
  );
}

export default RelatoriosPage;
