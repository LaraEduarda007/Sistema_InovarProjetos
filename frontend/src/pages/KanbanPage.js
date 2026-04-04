import React, { useState, useEffect } from 'react';
import MainLayout from '../components/MainLayout';
import Topbar from '../components/Topbar';
import { atividadesService } from '../services/api';
import './KanbanPage.css';

// Colunas do Kanban conforme o protótipo
const COLUNAS = [
  { status: 'a-fazer',       label: 'A fazer',       cor: 'var(--navy2)' },
  { status: 'em-andamento',  label: 'Em andamento',  cor: '#d97706' },
  { status: 'concluido',     label: 'Concluído',     cor: 'var(--green2)' },
  { status: 'nao-realizado', label: 'Não realizado', cor: 'var(--red)' },
];

function KanbanPage() {
  const [atividades, setAtividades] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [erro, setErro]             = useState(null);

  useEffect(() => {
    carregarAtividades();
  }, []);

  const carregarAtividades = async () => {
    try {
      setLoading(true);
      setErro(null);
      const response = await atividadesService.listar();
      setAtividades(response.atividades || []);
    } catch (error) {
      setErro('Erro ao carregar atividades.');
    } finally {
      setLoading(false);
    }
  };

  const getAtvPorStatus = (status) =>
    atividades.filter(a => a.status === status);

  return (
    <MainLayout>
      <Topbar title="Kanban" subtitle="Acompanhe o status de todas as atividades" />

      {erro && <div className="alert alert-error">{erro}</div>}

      {loading ? (
        <p className="empty-state">Carregando...</p>
      ) : (
        <div className="kanban-board">
          {COLUNAS.map((col) => {
            const cards = getAtvPorStatus(col.status);
            return (
              <div key={col.status} className="kanban-col">

                {/* Cabeçalho da coluna */}
                <div className="kanban-col-header">
                  <span className="kanban-col-title" style={{ color: col.cor }}>
                    {col.label}
                  </span>
                  <span className="kanban-col-count">{cards.length}</span>
                </div>

                {/* Cards */}
                <div className="kanban-cards">
                  {cards.length === 0 ? (
                    <p className="kanban-empty">Nenhuma atividade</p>
                  ) : (
                    cards.map((atv) => (
                      <div key={atv.id} className="kanban-card">
                        <span className="kanban-tag">{atv.setor || '—'}</span>
                        <div className="kanban-card-title">{atv.titulo}</div>
                        <div className="kanban-card-meta">
                          <span>Mês {atv.mes} · S{atv.semana}</span>
                          {atv.consultor_nome && <span>{atv.consultor_nome}</span>}
                        </div>
                      </div>
                    ))
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}
    </MainLayout>
  );
}

export default KanbanPage;
