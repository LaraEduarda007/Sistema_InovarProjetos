import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import Topbar from '../components/Topbar';
import { projetosService, atividadesService, relatoriosService, usuariosService, cobrancasService } from '../services/api';
import { useApp } from '../context/AppContext';
import './ProjetoDetalhePage.css';

function ProjetoDetalhePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario } = useApp();
  const isAdmin = usuario?.perfil === 'admin';

  const [projeto, setProjeto]         = useState(null);
  const [atividades, setAtividades]   = useState([]);
  const [relatorios, setRelatorios]   = useState([]);
  const [consultores, setConsultores] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [erro, setErro]               = useState(null);
  const [tabAtiva, setTabAtiva]       = useState('atividades');
  const [expandidos, setExpandidos]   = useState({});

  // Modal nova atividade
  const [showModalAtv, setShowModalAtv] = useState(false);
  const [salvandoAtv, setSalvandoAtv]   = useState(false);
  const [formAtv, setFormAtv] = useState({
    mes: 1, semana: 1, setor: '', titulo: '', observacao: '', consultorId: '', dataPrevista: ''
  });

  // Modal registrar relatório
  const [showModalRel, setShowModalRel]       = useState(false);
  const [atividadeSelecionada, setAtividadeSelecionada] = useState(null);
  const [salvandoRel, setSalvandoRel]         = useState(false);
  const [formRel, setFormRel] = useState({
    oQueFoiRealizado: '', dificuldades: '', proximosPassos: '', avaliacaoEquipe: 0, observacoes: ''
  });
  const [statusSelecionado, setStatusSelecionado] = useState('concluido');

  useEffect(() => {
    carregarDados();
  }, [id]); // eslint-disable-line

  const carregarDados = async () => {
    try {
      setLoading(true);
      setErro(null);

      const promises = [
        projetosService.obter(id),
        atividadesService.listar(id),
        relatoriosService.listar(id)
      ];
      if (isAdmin) promises.push(usuariosService.listarConsultores());

      const results = await Promise.all(promises);
      const [projRes, atvRes, relRes, consRes] = results;

      const proj = projRes.projeto || null;
      setProjeto(proj);
      setAtividades(atvRes.atividades || []);
      setRelatorios(relRes.relatorios || []);

      if (consRes) {
        const lista = consRes.consultores || [];
        setConsultores(lista);
        if (lista.length > 0) {
          setFormAtv(f => ({ ...f, consultorId: lista[0].id }));
        }
      }

      // Expande o primeiro mês por padrão
      const primeiroMes = (atvRes.atividades || []).reduce((min, a) => Math.min(min, a.mes), Infinity);
      if (isFinite(primeiroMes)) {
        setExpandidos({ [`m${primeiroMes}`]: true });
      }
    } catch (err) {
      setErro('Erro ao carregar dados do projeto.');
    } finally {
      setLoading(false);
    }
  };

  // Agrupa atividades por mes → semana
  const porMes = atividades.reduce((acc, atv) => {
    if (!acc[atv.mes]) acc[atv.mes] = {};
    if (!acc[atv.mes][atv.semana]) acc[atv.mes][atv.semana] = [];
    acc[atv.mes][atv.semana].push(atv);
    return acc;
  }, {});

  const toggleMes = (mes) => {
    setExpandidos(prev => ({ ...prev, [`m${mes}`]: !prev[`m${mes}`] }));
  };

  const toggleSemana = (mes, sem) => {
    const key = `m${mes}s${sem}`;
    setExpandidos(prev => ({ ...prev, [key]: prev[key] === false ? true : false }));
  };

  const calcularProgresso = () => {
    if (!projeto?.data_inicio) return 0;
    const inicio = new Date(projeto.data_inicio);
    const hoje = new Date();
    const mesesDecorridos = (hoje.getFullYear() - inicio.getFullYear()) * 12 + (hoje.getMonth() - inicio.getMonth());
    const pct = Math.round((mesesDecorridos / projeto.duracao_meses) * 100);
    return Math.min(Math.max(pct, 0), 100);
  };

  const calcularMesAtual = () => {
    if (!projeto?.data_inicio) return 0;
    const inicio = new Date(projeto.data_inicio);
    const hoje = new Date();
    return (hoje.getFullYear() - inicio.getFullYear()) * 12 + (hoje.getMonth() - inicio.getMonth()) + 1;
  };

  const statusChip = (status) => {
    const map = {
      'a-fazer':        ['badge-neutral',  'A fazer'],
      'em-andamento':   ['badge-warning',  'Em andamento'],
      'concluido':      ['badge-success',  'Concluído'],
      'nao-realizado':  ['badge-danger',   'Não realizado'],
    };
    const [cls, label] = map[status] || ['badge-neutral', status || 'A fazer'];
    return <span className={`badge ${cls}`}>{label}</span>;
  };

  const handleNovaAtividade = async (e) => {
    e.preventDefault();
    try {
      setSalvandoAtv(true);
      await atividadesService.criar({ projetoId: id, ...formAtv });
      setShowModalAtv(false);
      setFormAtv({ mes: 1, semana: 1, setor: '', titulo: '', observacao: '', consultorId: consultores[0]?.id || '', dataPrevista: '' });
      carregarDados();
    } catch (err) {
      setErro('Erro ao criar atividade.');
    } finally {
      setSalvandoAtv(false);
    }
  };

  const abrirModalRel = (atividade) => {
    setAtividadeSelecionada(atividade);
    setFormRel({ oQueFoiRealizado: '', dificuldades: '', proximosPassos: '', avaliacaoEquipe: 0, observacoes: '' });
    setStatusSelecionado('concluido');
    setShowModalRel(true);
  };

  const handleRegistrarRelatorio = async (e) => {
    e.preventDefault();
    try {
      setSalvandoRel(true);
      await relatoriosService.criar({
        atividadeId: atividadeSelecionada.id,
        ...formRel
      });
      // Atualiza status da atividade se não for "concluido"
      if (statusSelecionado !== 'concluido') {
        await atividadesService.atualizar(atividadeSelecionada.id, { status: statusSelecionado });
      }
      setShowModalRel(false);
      carregarDados();
    } catch (err) {
      setErro('Erro ao registrar relatório.');
    } finally {
      setSalvandoRel(false);
    }
  };

  const cobrarPendencias = async () => {
    const consultorId = projeto?.consultores?.[0]?.id;
    if (!consultorId) return;
    try {
      await cobrancasService.criar({
        consultorId,
        prazo: '',
        urgencia: 'normal',
        mensagem: `Regularize as atividades pendentes do projeto ${projeto.nome}`
      });
      alert('Cobrança enviada ao consultor!');
    } catch (err) {
      setErro('Erro ao enviar cobrança.');
    }
  };

  const formatarData = (data) => {
    if (!data) return '—';
    return new Date(data).toLocaleDateString('pt-BR');
  };

  const voltarUrl = isAdmin ? '/admin/projetos' : '/consultor/projetos';
  const pendentes = atividades.filter(a => !a.status || a.status === 'a-fazer' || a.status === 'em-andamento').length;
  const consultorNome = projeto?.consultores?.[0]?.nome || '—';

  if (loading) {
    return (
      <MainLayout>
        <p className="empty-state">Carregando...</p>
      </MainLayout>
    );
  }

  if (!projeto) {
    return (
      <MainLayout>
        <p className="empty-state">Projeto não encontrado.</p>
      </MainLayout>
    );
  }

  const progresso = calcularProgresso();
  const mesAtual = calcularMesAtual();

  return (
    <MainLayout>
      {/* Botão voltar */}
      <button className="btn-link back-btn" onClick={() => navigate(voltarUrl)}>
        ← Voltar
      </button>

      {/* Header navy do projeto */}
      <div className="ph">
        <div className="ph-top-row">
          <div>
            <div className="ph-tag">Projeto {projeto.status === 'ativo' ? 'ativo' : 'pausado'}</div>
            <h2 className="ph-nome">{projeto.nome}</h2>
            <div className="ph-sub">
              Consultor: {consultorNome} · Mês {mesAtual} de {projeto.duracao_meses}
            </div>
          </div>
          <div className="ph-actions">
            {isAdmin && pendentes > 0 && (
              <button className="btn btn-warning btn-sm" onClick={cobrarPendencias}>
                Cobrar pendências
              </button>
            )}
            {isAdmin && (
              <button className="btn btn-secondary btn-sm" onClick={() => setShowModalAtv(true)}>
                + Nova atividade
              </button>
            )}
          </div>
        </div>
        <div className="ph-prog">
          <div className="ph-prog-bg">
            <div className="ph-prog-f" style={{ width: `${progresso}%` }} />
          </div>
          <span className="ph-prog-l">{progresso}% concluído</span>
        </div>
      </div>

      {erro && <div className="alert alert-error" style={{ marginTop: '1rem' }}>{erro}</div>}

      {/* Tabs */}
      <div className="tabs-bar">
        <button
          className={`tab-btn ${tabAtiva === 'atividades' ? 'ativo' : ''}`}
          onClick={() => setTabAtiva('atividades')}
        >
          Atividades
          {pendentes > 0 && <span className="badge badge-warning" style={{ marginLeft: 6 }}>{pendentes}</span>}
        </button>
        <button
          className={`tab-btn ${tabAtiva === 'relatorios' ? 'ativo' : ''}`}
          onClick={() => setTabAtiva('relatorios')}
        >
          Relatórios
        </button>
      </div>

      {/* Tab Atividades */}
      {tabAtiva === 'atividades' && (
        <div className="card" style={{ marginTop: '1rem' }}>
          {atividades.length === 0 ? (
            <p className="empty-state">Nenhuma atividade cadastrada.</p>
          ) : (
            Object.keys(porMes).sort((a, b) => Number(a) - Number(b)).map(mes => (
              <div key={mes} className="accordion-mes">
                <div className="accordion-mes-header" onClick={() => toggleMes(mes)}>
                  <span>Mês {mes}</span>
                  <span className="accordion-icon">{expandidos[`m${mes}`] ? '▲' : '▼'}</span>
                </div>

                {expandidos[`m${mes}`] && (
                  <div className="accordion-mes-body">
                    {Object.keys(porMes[mes]).sort((a, b) => Number(a) - Number(b)).map(sem => (
                      <div key={sem} className="accordion-semana">
                        <div
                          className="accordion-semana-header"
                          onClick={() => toggleSemana(mes, sem)}
                        >
                          <span>Semana {sem}</span>
                          <span className="accordion-icon">
                            {expandidos[`m${mes}s${sem}`] === false ? '▼' : '▲'}
                          </span>
                        </div>

                        {expandidos[`m${mes}s${sem}`] !== false && (
                          <div className="accordion-semana-body">
                            {porMes[mes][sem].map(atv => (
                              <div key={atv.id} className="atividade-row">
                                <span className="atividade-setor">{atv.setor}</span>
                                <span className="atividade-titulo">{atv.titulo}</span>
                                <div className="atividade-acoes">
                                  {statusChip(atv.status)}
                                  {!isAdmin && !atv.relatorio_id && (
                                    <button
                                      className="btn btn-primary btn-xs"
                                      onClick={() => abrirModalRel(atv)}
                                    >
                                      Registrar
                                    </button>
                                  )}
                                  {atv.relatorio_id && (
                                    <span className="badge badge-success">Relatório enviado</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab Relatórios */}
      {tabAtiva === 'relatorios' && (
        <div className="card" style={{ marginTop: '1rem' }}>
          {relatorios.length === 0 ? (
            <p className="empty-state">Nenhum relatório enviado ainda.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Atividade</th>
                  {isAdmin && <th>Consultor</th>}
                  <th>Mês / Semana</th>
                  <th>Enviado em</th>
                </tr>
              </thead>
              <tbody>
                {relatorios.map(rel => (
                  <tr key={rel.id}>
                    <td><strong>{rel.atividade_titulo || '—'}</strong>
                      {rel.o_que_foi_realizado && (
                        <div style={{ fontSize: 12, color: 'var(--mx)', marginTop: 2 }}>
                          {rel.o_que_foi_realizado.length > 60
                            ? rel.o_que_foi_realizado.slice(0, 60) + '...'
                            : rel.o_que_foi_realizado}
                        </div>
                      )}
                    </td>
                    {isAdmin && <td style={{ color: 'var(--mx)' }}>{rel.consultor_nome || '—'}</td>}
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
      )}

      {/* Modal: Nova Atividade (admin) */}
      {showModalAtv && (
        <div className="modal-overlay" onClick={() => setShowModalAtv(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Nova atividade</h3>
              <div className="modal-sub">Adicione uma atividade ao projeto</div>
            </div>
            <div className="modal-body">
              <form onSubmit={handleNovaAtividade}>
                <div className="form-row cols-2">
                  <div className="form-group">
                    <label className="form-label">Mês *</label>
                    <input
                      className="inp"
                      type="number"
                      min="1"
                      max={projeto.duracao_meses}
                      value={formAtv.mes}
                      onChange={e => setFormAtv({ ...formAtv, mes: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Semana *</label>
                    <select
                      className="inp"
                      value={formAtv.semana}
                      onChange={e => setFormAtv({ ...formAtv, semana: parseInt(e.target.value) })}
                    >
                      <option value={1}>Semana 1</option>
                      <option value={2}>Semana 2</option>
                      <option value={3}>Semana 3</option>
                      <option value={4}>Semana 4</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Setor *</label>
                  <input
                    className="inp"
                    type="text"
                    placeholder="Ex: Financeiro, Logística..."
                    value={formAtv.setor}
                    onChange={e => setFormAtv({ ...formAtv, setor: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Título da atividade *</label>
                  <input
                    className="inp"
                    type="text"
                    placeholder="Descreva a atividade..."
                    value={formAtv.titulo}
                    onChange={e => setFormAtv({ ...formAtv, titulo: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Consultor responsável *</label>
                  <select
                    className="inp"
                    value={formAtv.consultorId}
                    onChange={e => setFormAtv({ ...formAtv, consultorId: e.target.value })}
                    required
                  >
                    <option value="">Selecione...</option>
                    {consultores.map(c => (
                      <option key={c.id} value={c.id}>{c.nome}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Observação</label>
                  <textarea
                    className="inp"
                    rows="2"
                    value={formAtv.observacao}
                    onChange={e => setFormAtv({ ...formAtv, observacao: e.target.value })}
                  />
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModalAtv(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={salvandoAtv}>
                    {salvandoAtv ? 'Salvando...' : 'Criar atividade'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Registrar Relatório (consultor) */}
      {showModalRel && (
        <div className="modal-overlay" onClick={() => setShowModalRel(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Registrar atividade</h3>
              <div className="modal-sub">
                <span className="rel-setor-tag">{atividadeSelecionada?.setor}</span>
                {atividadeSelecionada?.titulo} — Mês {atividadeSelecionada?.mes}, Semana {atividadeSelecionada?.semana}
              </div>
            </div>
            <div className="modal-body">
              <form onSubmit={handleRegistrarRelatorio}>

                {/* Seletor de status */}
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <div className="status-opts">
                    {[
                      { value: 'a-fazer',       label: 'A fazer' },
                      { value: 'em-andamento',  label: 'Em andamento' },
                      { value: 'concluido',     label: 'Concluído' },
                      { value: 'nao-realizado', label: 'Não realizado' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        className={`status-opt ${statusSelecionado === opt.value ? 'status-opt-ativo' : ''}`}
                        onClick={() => setStatusSelecionado(opt.value)}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">O que foi realizado *</label>
                  <textarea
                    className="inp"
                    rows="3"
                    placeholder="Descreva as ações realizadas nesta visita..."
                    value={formRel.oQueFoiRealizado}
                    onChange={e => setFormRel({ ...formRel, oQueFoiRealizado: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Dificuldades encontradas</label>
                  <textarea
                    className="inp"
                    rows="2"
                    placeholder="Obstáculos ou dificuldades..."
                    value={formRel.dificuldades}
                    onChange={e => setFormRel({ ...formRel, dificuldades: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Próximos passos *</label>
                  <textarea
                    className="inp"
                    rows="2"
                    placeholder="O que fazer na próxima visita..."
                    value={formRel.proximosPassos}
                    onChange={e => setFormRel({ ...formRel, proximosPassos: e.target.value })}
                    required
                  />
                </div>

                {/* Avaliação com estrelas */}
                <div className="form-group">
                  <label className="form-label">Avaliação da equipe</label>
                  <div className="stars-row">
                    {[1,2,3,4,5].map(n => (
                      <span
                        key={n}
                        className={`star ${n <= formRel.avaliacaoEquipe ? 'star-on' : 'star-off'}`}
                        onClick={() => setFormRel({ ...formRel, avaliacaoEquipe: n })}
                      >★</span>
                    ))}
                    {formRel.avaliacaoEquipe > 0 && (
                      <span className="star-label">{formRel.avaliacaoEquipe}/5</span>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Observações</label>
                  <textarea
                    className="inp"
                    rows="2"
                    placeholder="Informações adicionais (opcional)..."
                    value={formRel.observacoes}
                    onChange={e => setFormRel({ ...formRel, observacoes: e.target.value })}
                  />
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModalRel(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={salvandoRel}>
                    {salvandoRel ? 'Salvando...' : 'Salvar relatório'}
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

export default ProjetoDetalhePage;
