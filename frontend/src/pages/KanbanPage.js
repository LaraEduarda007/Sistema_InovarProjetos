import React, { useState, useEffect } from 'react';
import MainLayout from '../components/MainLayout';
import Topbar from '../components/Topbar';
import { atividadesService } from '../services/api';
import { useApp } from '../context/AppContext';
import './KanbanPage.css';

const COLUNAS = [
  { status: 'a-fazer',       label: 'A fazer',       cor: 'var(--navy2)' },
  { status: 'em-andamento',  label: 'Em andamento',  cor: '#d97706' },
  { status: 'concluido',     label: 'Concluído',     cor: 'var(--green2)' },
  { status: 'nao-realizado', label: 'Não realizado', cor: 'var(--red)' },
];

const STATUS_MAP = {
  'a-fazer':       'A fazer',
  'em-andamento':  'Em andamento',
  'concluido':     'Concluído',
  'nao-realizado': 'Não realizado',
};

function KanbanPage() {
  const { usuario } = useApp();
  const isAdmin = usuario?.perfil === 'admin';

  const [atividades, setAtividades] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [erro, setErro]             = useState(null);

  // Modal de detalhe/edição
  const [modalAtv, setModalAtv]       = useState(null); // atividade selecionada
  const [novoStatus, setNovoStatus]   = useState('');
  const [salvando, setSalvando]       = useState(false);

  // Filtro por projeto
  const [filtroProjeto, setFiltroProjeto] = useState('');

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

  const abrirModal = (atv) => {
    setModalAtv(atv);
    setNovoStatus(atv.status || 'a-fazer');
  };

  const fecharModal = () => {
    setModalAtv(null);
    setNovoStatus('');
  };

  const handleSalvar = async () => {
    if (!modalAtv) return;
    try {
      setSalvando(true);
      await atividadesService.atualizar(modalAtv.id, { status: novoStatus });
      // Atualiza local
      setAtividades(prev =>
        prev.map(a => a.id === modalAtv.id ? { ...a, status: novoStatus } : a)
      );
      fecharModal();
    } catch {
      setErro('Erro ao atualizar status.');
    } finally {
      setSalvando(false);
    }
  };

  // Projetos únicos para filtro
  const projetosUnicos = [...new Set(atividades.map(a => a.projeto_nome).filter(Boolean))];

  // Aplica filtro
  const atvFiltradas = filtroProjeto
    ? atividades.filter(a => a.projeto_nome === filtroProjeto)
    : atividades;

  const getAtvPorStatus = (status) =>
    atvFiltradas.filter(a => (a.status || 'a-fazer') === status);

  return (
    <MainLayout>
      <Topbar title="Kanban" subtitle="Acompanhe o status de todas as atividades" />

      {erro && <div className="alert alert-error">{erro}</div>}

      {/* Filtro por projeto */}
      {isAdmin && projetosUnicos.length > 1 && (
        <div className="kanban-toolbar">
          <select
            className="inp inp-sm"
            value={filtroProjeto}
            onChange={e => setFiltroProjeto(e.target.value)}
          >
            <option value="">Todos os projetos</option>
            {projetosUnicos.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      )}

      {loading ? (
        <p className="empty-state">Carregando...</p>
      ) : (
        <div className="kanban-board">
          {COLUNAS.map((col) => {
            const cards = getAtvPorStatus(col.status);
            return (
              <div key={col.status} className="kanban-col">
                <div className="kanban-col-header">
                  <span className="kanban-col-title" style={{ color: col.cor }}>
                    {col.label}
                  </span>
                  <span className="kanban-col-count">{cards.length}</span>
                </div>

                <div className="kanban-cards">
                  {cards.length === 0 ? (
                    <p className="kanban-empty">Nenhuma atividade</p>
                  ) : (
                    cards.map((atv) => (
                      <div
                        key={atv.id}
                        className="kanban-card"
                        onClick={() => abrirModal(atv)}
                      >
                        {atv.projeto_nome && (
                          <div className="kanban-projeto">{atv.projeto_nome}</div>
                        )}
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

      {/* Modal de detalhe / edição de status */}
      {modalAtv && (
        <div className="modal-overlay" onClick={fecharModal}>
          <div className="modal-box kanban-modal-box" onClick={e => e.stopPropagation()}>

            <div className="modal-header">
              <div>
                {modalAtv.projeto_nome && (
                  <div className="kanban-modal-projeto">{modalAtv.projeto_nome}</div>
                )}
                <h3 style={{ margin: 0 }}>{modalAtv.titulo}</h3>
              </div>
              <button className="btn-link" onClick={fecharModal} style={{ fontSize: '1.2rem', lineHeight: 1 }}>×</button>
            </div>

            <div className="modal-body">

              {/* Metadados */}
              <div className="kanban-modal-meta">
                {modalAtv.setor && (
                  <span className="kanban-tag">{modalAtv.setor}</span>
                )}
                <span className="kanban-modal-info">Mês {modalAtv.mes} · Semana {modalAtv.semana}</span>
                {modalAtv.consultor_nome && (
                  <span className="kanban-modal-info">👤 {modalAtv.consultor_nome}</span>
                )}
              </div>

              {/* Observação da atividade */}
              {modalAtv.observacao && (
                <div className="kanban-modal-obs">
                  <div className="kanban-modal-label">Observação</div>
                  <div className="kanban-modal-val">{modalAtv.observacao}</div>
                </div>
              )}

              {/* Seletor de status */}
              <div className="kanban-modal-label" style={{ marginTop: '1rem' }}>
                Alterar status
              </div>
              <div className="status-opts">
                {COLUNAS.map(col => (
                  <button
                    key={col.status}
                    type="button"
                    className={`status-opt${novoStatus === col.status ? ' status-opt-ativo' : ''}`}
                    style={novoStatus === col.status
                      ? { borderColor: col.cor, color: col.cor, background: `${col.cor}18` }
                      : {}}
                    onClick={() => setNovoStatus(col.status)}
                  >
                    {col.label}
                  </button>
                ))}
              </div>

            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={fecharModal}>
                Cancelar
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSalvar}
                disabled={salvando || novoStatus === modalAtv.status}
              >
                {salvando ? 'Salvando...' : 'Salvar'}
              </button>
            </div>

          </div>
        </div>
      )}
    </MainLayout>
  );
}

export default KanbanPage;
