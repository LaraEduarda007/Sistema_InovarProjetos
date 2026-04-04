import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import Topbar from '../components/Topbar';
import { projetosService, atividadesService } from '../services/api';

function ConsultorProjetosPage() {
  const [projetos, setProjetos] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [erro, setErro]         = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    carregarProjetos();
  }, []);

  const carregarProjetos = async () => {
    try {
      setLoading(true);
      setErro(null);
      const response = await projetosService.listar();
      setProjetos(response.projetos || []);
    } catch (err) {
      setErro('Erro ao carregar projetos.');
    } finally {
      setLoading(false);
    }
  };

  const calcularProgresso = (projeto) => {
    if (!projeto.data_inicio) return 0;
    const inicio = new Date(projeto.data_inicio);
    const hoje = new Date();
    const mesesDecorridos = (hoje.getFullYear() - inicio.getFullYear()) * 12 + (hoje.getMonth() - inicio.getMonth());
    const pct = Math.round((mesesDecorridos / projeto.duracao_meses) * 100);
    return Math.min(Math.max(pct, 0), 100);
  };

  return (
    <MainLayout>
      <Topbar title="Meus Projetos" subtitle="Projetos atribuídos a você" />

      {erro && <div className="alert alert-error">{erro}</div>}

      <div className="card">
        <div className="card-title">Lista de projetos</div>

        {loading ? (
          <p className="empty-state">Carregando...</p>
        ) : projetos.length === 0 ? (
          <p className="empty-state">Nenhum projeto atribuído.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Duração</th>
                <th>Progresso</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {projetos.map((projeto) => {
                const pct = calcularProgresso(projeto);
                return (
                  <tr key={projeto.id}>
                    <td><strong>{projeto.nome}</strong></td>
                    <td style={{ color: 'var(--mx)' }}>{projeto.duracao_meses} meses</td>
                    <td style={{ minWidth: 120 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="progress-wrap" style={{ flex: 1 }}>
                          <div className="progress-fill" style={{ width: `${pct}%` }} />
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--mx)', minWidth: 32 }}>{pct}%</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${projeto.status === 'ativo' ? 'badge-success' : 'badge-neutral'}`}>
                        {projeto.status === 'ativo' ? 'Ativo' : 'Pausado'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn-link"
                        onClick={() => navigate(`/consultor/projetos/${projeto.id}`)}
                      >
                        Ver atividades →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </MainLayout>
  );
}

export default ConsultorProjetosPage;
