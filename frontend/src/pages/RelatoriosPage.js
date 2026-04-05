import React, { useState, useEffect } from 'react';
import MainLayout from '../components/MainLayout';
import Topbar from '../components/Topbar';
import { relatoriosService, atividadesService } from '../services/api';
import { useApp } from '../context/AppContext';
import * as XLSX from 'xlsx';
import './RelatoriosPage.css';

const STATUS_MAP = {
  'concluido':     'Concluído',
  'em-andamento':  'Em andamento',
  'a-fazer':       'A fazer',
  'nao-realizado': 'Não realizado',
};

function RelatoriosPage() {
  const { usuario } = useApp();
  const isAdmin = usuario?.perfil === 'admin';

  const [relatorios, setRelatorios]   = useState([]);
  const [atividades, setAtividades]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [erro, setErro]               = useState(null);
  const [expandidoId, setExpandidoId] = useState(null);

  // Filtros
  const [filtroProjeto, setFiltroProjeto]     = useState('');
  const [filtroConsultor, setFiltroConsultor] = useState('');

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      setErro(null);
      const [relRes, atvRes] = await Promise.all([
        relatoriosService.listar(),
        atividadesService.listar(),
      ]);
      setRelatorios(relRes.relatorios || []);
      setAtividades(atvRes.atividades || []);
    } catch {
      setErro('Erro ao carregar relatórios.');
    } finally {
      setLoading(false);
    }
  };

  // Aplica filtros à lista
  const relFiltrados = relatorios.filter(r => {
    if (filtroProjeto   && r.projeto_nome   !== filtroProjeto)   return false;
    if (filtroConsultor && r.consultor_nome !== filtroConsultor) return false;
    return true;
  });

  // Listas únicas para os selects de filtro
  const projetosUnicos    = [...new Set(relatorios.map(r => r.projeto_nome).filter(Boolean))];
  const consultoresUnicos = [...new Set(relatorios.map(r => r.consultor_nome).filter(Boolean))];

  // ── Estatísticas ──────────────────────────────────────────────
  const totalRel      = relFiltrados.length;
  const avaliacoes    = relFiltrados.filter(r => r.avaliacao_equipe).map(r => r.avaliacao_equipe);
  const mediaAval     = avaliacoes.length > 0
    ? (avaliacoes.reduce((a, b) => a + b, 0) / avaliacoes.length).toFixed(1)
    : null;
  const concluidas    = atividades.filter(a => a.status === 'concluido').length;
  const taxaConclusao = atividades.length > 0
    ? Math.round((concluidas / atividades.length) * 100)
    : 0;

  // ── Export Excel ──────────────────────────────────────────────
  const exportarExcel = () => {
    const wb = XLSX.utils.book_new();

    // Aba 1: Resumo
    const wsResumo = XLSX.utils.aoa_to_sheet([
      ['INOVAR PROJETOS — Relatório de Desempenho'],
      ['Gerado em:', new Date().toLocaleDateString('pt-BR')],
      ['Filtro — Projeto:', filtroProjeto || 'Todos'],
      ['Filtro — Consultor:', filtroConsultor || 'Todos'],
      [],
      ['Indicador', 'Valor'],
      ['Total de relatórios enviados', totalRel],
      ['Avaliação média da equipe', mediaAval ? `${mediaAval} / 5` : '—'],
      ['Taxa de conclusão de atividades', `${taxaConclusao}%`],
      ['Total de atividades', atividades.length],
      ['Atividades concluídas', concluidas],
    ]);
    XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo');

    // Aba 2: Relatórios detalhados
    const dadosRel = [
      ['Atividade', 'Projeto', 'Consultor', 'Mês', 'Semana',
       'O que foi realizado', 'Dificuldades', 'Próximos passos',
       'Avaliação (1-5)', 'Observações', 'Data envio'],
      ...relFiltrados.map(r => [
        r.atividade_titulo    || '',
        r.projeto_nome        || '',
        r.consultor_nome      || '',
        r.mes    || '',
        r.semana || '',
        r.o_que_foi_realizado || '',
        r.dificuldades        || '',
        r.proximos_passos     || '',
        r.avaliacao_equipe    || '',
        r.observacoes         || '',
        r.enviado_em ? new Date(r.enviado_em).toLocaleDateString('pt-BR') : '',
      ]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(dadosRel), 'Relatórios');

    // Aba 3: Atividades com status
    const dadosAtv = [
      ['Título', 'Setor', 'Consultor', 'Mês', 'Semana', 'Status', 'Data realização'],
      ...atividades.map(a => [
        a.titulo         || '',
        a.setor          || '',
        a.consultor_nome || '',
        a.mes    || '',
        a.semana || '',
        STATUS_MAP[a.status] || a.status || '',
        a.data_realizacao
          ? new Date(a.data_realizacao).toLocaleDateString('pt-BR')
          : '',
      ]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(dadosAtv), 'Atividades');

    XLSX.writeFile(wb, `inovar-relatorios-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // ── Export PDF (impressão do navegador) ────────────────────────
  const exportarPDF = () => {
    window.print();
  };

  // ── Helpers de UI ─────────────────────────────────────────────
  const formatarData = (data) => {
    if (!data) return '—';
    return new Date(data).toLocaleDateString('pt-BR');
  };

  const renderEstrelas = (nota) => {
    if (!nota) return <span className="rel-sem-aval">Sem avaliação</span>;
    return (
      <span className="rel-stars">
        {[1, 2, 3, 4, 5].map(n => (
          <span key={n} className={n <= nota ? 'star-on' : 'star-off'}>★</span>
        ))}
      </span>
    );
  };

  return (
    <MainLayout>
      {/* Cabeçalho visível apenas na impressão / PDF */}
      <div className="rel-print-header">
        <div className="rel-print-logo">INOVAR PROJETOS</div>
        <h2>Relatório de Desempenho</h2>
        <p>
          Gerado em {new Date().toLocaleDateString('pt-BR')}
          {filtroProjeto   && ` · Projeto: ${filtroProjeto}`}
          {filtroConsultor && ` · Consultor: ${filtroConsultor}`}
        </p>
      </div>

      <Topbar title="Relatórios" subtitle="Histórico detalhado de atividades e desempenho" />

      {erro && <div className="alert alert-error">{erro}</div>}

      {/* ── Barra de ações ── */}
      <div className="rel-toolbar no-print">
        <div className="rel-filtros">
          {isAdmin && projetosUnicos.length > 0 && (
            <select
              className="inp inp-sm"
              value={filtroProjeto}
              onChange={e => setFiltroProjeto(e.target.value)}
            >
              <option value="">Todos os projetos</option>
              {projetosUnicos.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          )}
          {isAdmin && consultoresUnicos.length > 0 && (
            <select
              className="inp inp-sm"
              value={filtroConsultor}
              onChange={e => setFiltroConsultor(e.target.value)}
            >
              <option value="">Todos os consultores</option>
              {consultoresUnicos.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
        </div>
        <div className="rel-acoes">
          <button className="btn btn-secondary btn-sm" onClick={exportarExcel}>
            ↓ Excel
          </button>
          <button className="btn btn-primary btn-sm" onClick={exportarPDF}>
            ↓ PDF
          </button>
        </div>
      </div>

      {loading ? (
        <p className="empty-state">Carregando...</p>
      ) : (
        <>
          {/* ── Cards de resumo ── */}
          <div className="rel-stats">
            <div className="rel-stat-card">
              <div className="rel-stat-valor">{totalRel}</div>
              <div className="rel-stat-label">Relatórios enviados</div>
            </div>
            <div className="rel-stat-card">
              <div className="rel-stat-valor">
                {mediaAval
                  ? <>{mediaAval}<span className="rel-stat-sufixo"> / 5 ★</span></>
                  : <span className="rel-stat-vazio">—</span>}
              </div>
              <div className="rel-stat-label">Avaliação média da equipe</div>
            </div>
            <div className="rel-stat-card">
              <div className="rel-stat-valor">
                {taxaConclusao}<span className="rel-stat-sufixo">%</span>
              </div>
              <div className="rel-stat-label">Atividades concluídas</div>
            </div>
            <div className="rel-stat-card">
              <div className="rel-stat-valor">{atividades.length}</div>
              <div className="rel-stat-label">Total de atividades</div>
            </div>
          </div>

          {/* ── Lista de relatórios expandíveis ── */}
          <div className="card">
            <div className="rel-lista-header">
              <div className="card-title">Relatórios detalhados</div>
              {(filtroProjeto || filtroConsultor) && (
                <div className="rel-filtro-badges">
                  {filtroProjeto   && <span className="badge badge-neutral">{filtroProjeto}</span>}
                  {filtroConsultor && <span className="badge badge-neutral">{filtroConsultor}</span>}
                  <button
                    className="btn-link btn-sm no-print"
                    onClick={() => { setFiltroProjeto(''); setFiltroConsultor(''); }}
                  >
                    Limpar
                  </button>
                </div>
              )}
            </div>

            {relFiltrados.length === 0 ? (
              <p className="empty-state">Nenhum relatório encontrado.</p>
            ) : (
              <div className="rel-lista">
                {relFiltrados.map(rel => (
                  <div
                    key={rel.id}
                    className={`rel-item${expandidoId === rel.id ? ' expandido' : ''}`}
                  >
                    <div
                      className="rel-item-header"
                      onClick={() => setExpandidoId(expandidoId === rel.id ? null : rel.id)}
                    >
                      <div className="rel-item-esquerda">
                        <span className="rel-item-projeto">{rel.projeto_nome || '—'}</span>
                        <strong className="rel-item-titulo">{rel.atividade_titulo || '—'}</strong>
                        <span className="rel-item-meta">
                          Mês {rel.mes} · Semana {rel.semana}
                          {isAdmin && rel.consultor_nome && ` · ${rel.consultor_nome}`}
                        </span>
                      </div>
                      <div className="rel-item-direita">
                        {renderEstrelas(rel.avaliacao_equipe)}
                        <span className="rel-item-data">{formatarData(rel.enviado_em)}</span>
                        <span className="rel-item-icon no-print">
                          {expandidoId === rel.id ? '▲' : '▼'}
                        </span>
                      </div>
                    </div>

                    <div className="rel-item-body">
                      {rel.o_que_foi_realizado && (
                        <div className="rel-campo">
                          <div className="rel-campo-label">O que foi realizado</div>
                          <div className="rel-campo-val">{rel.o_que_foi_realizado}</div>
                        </div>
                      )}
                      {rel.dificuldades && (
                        <div className="rel-campo">
                          <div className="rel-campo-label">Dificuldades encontradas</div>
                          <div className="rel-campo-val">{rel.dificuldades}</div>
                        </div>
                      )}
                      {rel.proximos_passos && (
                        <div className="rel-campo">
                          <div className="rel-campo-label">Próximos passos</div>
                          <div className="rel-campo-val">{rel.proximos_passos}</div>
                        </div>
                      )}
                      {rel.observacoes && (
                        <div className="rel-campo">
                          <div className="rel-campo-label">Observações</div>
                          <div className="rel-campo-val">{rel.observacoes}</div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </MainLayout>
  );
}

export default RelatoriosPage;
