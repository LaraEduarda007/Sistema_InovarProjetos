import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import Topbar from '../components/Topbar';
import { projetosService, atividadesService, relatoriosService, usuariosService, cobrancasService, semanaResumosService } from '../services/api';
import { useApp } from '../context/AppContext';
import * as XLSX from 'xlsx';
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

  // Modal cobrança
  const [showModalCob, setShowModalCob]   = useState(false);
  const [salvandoCob, setSalvandoCob]     = useState(false);
  const [formCob, setFormCob] = useState({ consultorId: '', urgencia: 'normal', mensagem: '' });

  // Modal conclusão de semana
  const [modalSemana, setModalSemana]       = useState(null); // { mes, sem }
  const [formSemana, setFormSemana]         = useState({ resumo: '', pontosPositivos: '', pontosAtencao: '' });
  const [salvandoSemana, setSalvandoSemana] = useState(false);
  const [resumosSemana, setResumosSemana]   = useState({}); // key: `m${mes}s${sem}`

  // Modal editar observação da atividade
  const [modalObsAtv, setModalObsAtv]   = useState(null); // atividade selecionada
  const [novaObs, setNovaObs]           = useState('');
  const [salvandoObs, setSalvandoObs]   = useState(false);

  // Modal registrar relatório
  const [showModalRel, setShowModalRel]       = useState(false);
  const [atividadeSelecionada, setAtividadeSelecionada] = useState(null);
  const [salvandoRel, setSalvandoRel]         = useState(false);
  const [formRel, setFormRel] = useState({
    oQueFoiRealizado: '', dificuldades: '', proximosPassos: '', avaliacaoEquipe: null, observacoes: ''
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
        relatoriosService.listar(id),
        semanaResumosService.listar(id),
      ];
      if (isAdmin) promises.push(usuariosService.listarConsultores());

      const results = await Promise.all(promises);
      const [projRes, atvRes, relRes, resumosRes, consRes] = results;

      const proj = projRes.projeto || null;
      setProjeto(proj);
      setAtividades(atvRes.atividades || []);
      setRelatorios(relRes.relatorios || []);

      // Indexa resumos por chave mes-semana
      const resumosIdx = {};
      (resumosRes?.resumos || []).forEach(r => { resumosIdx[`m${r.mes}s${r.semana}`] = r; });
      setResumosSemana(resumosIdx);

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
    if (!projeto) return 0;
    const totalSemanas = (projeto.duracao_meses || 12) * 4;

    // Agrupa atividades por (mes, semana)
    const semanasMap = {};
    for (const a of atividades) {
      const key = `${a.mes}-${a.semana}`;
      if (!semanasMap[key]) semanasMap[key] = { total: 0, concluidas: 0 };
      semanasMap[key].total++;
      if (a.status === 'concluido') semanasMap[key].concluidas++;
    }

    // Semanas onde TODAS as atividades estão concluídas
    const semanasCompletas = Object.values(semanasMap)
      .filter(s => s.total > 0 && s.concluidas === s.total).length;

    return Math.round((semanasCompletas / totalSemanas) * 100);
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
    setFormRel({ oQueFoiRealizado: '', dificuldades: '', proximosPassos: '', avaliacaoEquipe: null, observacoes: '' });
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

  const formatarData = (data) => {
    if (!data) return '—';
    return new Date(data).toLocaleDateString('pt-BR');
  };

  const voltarUrl     = isAdmin ? '/admin/projetos' : '/consultor/projetos';
  const pendentes     = atividades.filter(a => !a.status || a.status === 'a-fazer' || a.status === 'em-andamento').length;
  const consultorNome = projeto?.consultores?.[0]?.nome || '—';

  const abrirModalCob = () => {
    const primeiroConsultor = projeto?.consultores?.[0]?.id || '';
    setFormCob({
      consultorId: primeiroConsultor,
      urgencia: 'normal',
      mensagem: `Olá! Há ${pendentes} atividade(s) pendente(s) no projeto "${projeto?.nome}" que precisam de atenção. Por favor, atualize o status o quanto antes.`,
    });
    setShowModalCob(true);
  };

  const handleEnviarCobranca = async (e) => {
    e.preventDefault();
    try {
      setSalvandoCob(true);
      await cobrancasService.criar({
        consultorId: formCob.consultorId,
        urgencia:    formCob.urgencia,
        mensagem:    formCob.mensagem,
      });
      setShowModalCob(false);
      alert('Cobrança enviada com sucesso!');
    } catch (err) {
      setErro('Erro ao enviar cobrança.');
    } finally {
      setSalvandoCob(false);
    }
  };

  const abrirModalSemana = (mes, sem) => {
    const key = `m${mes}s${sem}`;
    const existente = resumosSemana[key];
    setFormSemana({
      resumo:          existente?.resumo           || '',
      pontosPositivos: existente?.pontos_positivos || '',
      pontosAtencao:   existente?.pontos_atencao   || '',
    });
    setModalSemana({ mes, sem });
  };

  const handleSalvarSemana = async (e) => {
    e.preventDefault();
    if (!modalSemana) return;
    try {
      setSalvandoSemana(true);
      await semanaResumosService.salvar({
        projetoId: id,
        mes: modalSemana.mes,
        semana: modalSemana.sem,
        resumo: formSemana.resumo,
        pontosPositivos: formSemana.pontosPositivos,
        pontosAtencao:   formSemana.pontosAtencao,
      });
      const key = `m${modalSemana.mes}s${modalSemana.sem}`;
      setResumosSemana(prev => ({ ...prev, [key]: { ...formSemana } }));
      setModalSemana(null);
    } catch {
      setErro('Erro ao salvar resumo da semana.');
    } finally {
      setSalvandoSemana(false);
    }
  };

  const abrirModalObs = (atv) => {
    setModalObsAtv(atv);
    setNovaObs(atv.observacao || '');
  };

  const handleSalvarObs = async (e) => {
    e.preventDefault();
    if (!modalObsAtv) return;
    try {
      setSalvandoObs(true);
      await atividadesService.atualizar(modalObsAtv.id, { observacao: novaObs });
      setAtividades(prev => prev.map(a =>
        a.id === modalObsAtv.id ? { ...a, observacao: novaObs } : a
      ));
      setModalObsAtv(null);
    } catch {
      setErro('Erro ao salvar observação.');
    } finally {
      setSalvandoObs(false);
    }
  };

  // Relatório expandido na aba de relatórios
  const [relExpandidoId, setRelExpandidoId] = useState(null);

  const exportarRelatoriosExcel = () => {
    const wb = XLSX.utils.book_new();

    const STATUS_MAP = {
      'concluido': 'Concluído', 'em-andamento': 'Em andamento',
      'a-fazer': 'A fazer',    'nao-realizado': 'Não realizado',
    };

    // Aba 1: Resumo do projeto
    const concluidas = atividades.filter(a => a.status === 'concluido').length;
    const wsResumo = XLSX.utils.aoa_to_sheet([
      ['INOVAR PROJETOS — Relatório do Projeto'],
      ['Projeto:', projeto?.nome || ''],
      ['Gerado em:', new Date().toLocaleDateString('pt-BR')],
      [],
      ['Total de atividades:', atividades.length],
      ['Atividades concluídas:', concluidas],
      ['Atividades pendentes:', pendentes],
      ['Total de relatórios enviados:', relatorios.length],
    ]);
    XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo');

    // Aba 2: Relatórios
    const dadosRel = [
      ['Atividade', 'Mês', 'Semana', 'Consultor',
       'O que foi realizado', 'Dificuldades', 'Próximos passos',
       'Avaliação (1-5)', 'Observações', 'Data envio'],
      ...relatorios.map(r => [
        r.atividade_titulo    || '',
        r.mes    || '',
        r.semana || '',
        r.consultor_nome      || '',
        r.o_que_foi_realizado || '',
        r.dificuldades        || '',
        r.proximos_passos     || '',
        r.avaliacao_equipe    || '',
        r.observacoes         || '',
        r.enviado_em ? new Date(r.enviado_em).toLocaleDateString('pt-BR') : '',
      ]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(dadosRel), 'Relatórios');

    // Aba 3: Atividades
    const dadosAtv = [
      ['Título', 'Setor', 'Mês', 'Semana', 'Consultor', 'Status', 'Data realização'],
      ...atividades.map(a => [
        a.titulo         || '',
        a.setor          || '',
        a.mes    || '',
        a.semana || '',
        a.consultor_nome || '',
        STATUS_MAP[a.status] || a.status || '',
        a.data_realizacao ? new Date(a.data_realizacao).toLocaleDateString('pt-BR') : '',
      ]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(dadosAtv), 'Atividades');

    XLSX.writeFile(wb, `${projeto?.nome || 'projeto'}-relatorios-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const renderEstrelas = (nota) => {
    if (!nota) return <span style={{ color: 'var(--mx)', fontSize: '.8rem' }}>—</span>;
    return (
      <span>
        {[1,2,3,4,5].map(n => (
          <span key={n} style={{ color: n <= nota ? '#f59e0b' : '#d1d5db', fontSize: '.85rem' }}>★</span>
        ))}
      </span>
    );
  };

  // Verifica se atividade está em atraso (consultor view)
  const estaAtrasada = (atv) => {
    if (atv.relatorio_id || atv.status === 'concluido') return false;
    if (!projeto?.data_inicio) return false;
    const d = new Date(projeto.data_inicio);
    d.setDate(d.getDate() + ((atv.mes - 1) * 4 + atv.semana) * 7);
    return new Date() > d;
  };

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
            {projeto.objetivo && (
              <div className="ph-objetivo">{projeto.objetivo}</div>
            )}
          </div>
          <div className="ph-actions">
            {isAdmin && pendentes > 0 && (
              <button className="btn btn-warning btn-sm" onClick={abrirModalCob}>
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
          <span className="ph-prog-l">
            {progresso}% concluído
            {projeto && (
              <span style={{ opacity: .7, fontSize: '.82em', marginLeft: '.5rem' }}>
                ({Math.round(progresso * (projeto.duracao_meses * 4) / 100)}/{projeto.duracao_meses * 4} semanas)
              </span>
            )}
          </span>
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
                        <div className="accordion-semana-header">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem', flex: 1 }}
                               onClick={() => toggleSemana(mes, sem)}>
                            <span>Semana {sem}</span>
                            {resumosSemana[`m${mes}s${sem}`] && (
                              <span className="badge badge-success" style={{ fontSize: '10px' }}>Resumo salvo</span>
                            )}
                          </div>
                          <button
                            className="btn btn-secondary btn-xs"
                            style={{ flexShrink: 0 }}
                            onClick={e => { e.stopPropagation(); abrirModalSemana(mes, sem); }}
                          >
                            {resumosSemana[`m${mes}s${sem}`] ? '✎ Resumo' : '+ Resumo'}
                          </button>
                          <span className="accordion-icon" onClick={() => toggleSemana(mes, sem)}>
                            {expandidos[`m${mes}s${sem}`] === false ? '▼' : '▲'}
                          </span>
                        </div>

                        {expandidos[`m${mes}s${sem}`] !== false && (
                          <div className="accordion-semana-body">
                            {porMes[mes][sem].map(atv => (
                              <div key={atv.id} className={`atividade-row${!isAdmin && estaAtrasada(atv) ? ' atividade-atrasada' : ''}`}>
                                <span className="atividade-setor">{atv.setor}</span>
                                <div className="atividade-titulo-wrap">
                                  <span className="atividade-titulo">
                                    {atv.titulo}
                                    {!isAdmin && estaAtrasada(atv) && (
                                      <span style={{ fontSize: 10, color: '#dc2626', fontWeight: 700, marginLeft: 6 }}>● ATRASO</span>
                                    )}
                                  </span>
                                  {atv.observacao && (
                                    <span className="atividade-obs-preview">{atv.observacao}</span>
                                  )}
                                </div>
                                <div className="atividade-acoes">
                                  {statusChip(atv.status)}
                                  {isAdmin && (
                                    <button
                                      className="btn-link"
                                      style={{ fontSize: '.78rem' }}
                                      onClick={() => abrirModalObs(atv)}
                                      title="Editar observação"
                                    >
                                      ✎ Obs.
                                    </button>
                                  )}
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
          {/* Cabeçalho da aba com botão de exportar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '.5rem' }}>
            <div className="card-title" style={{ margin: 0 }}>
              Relatórios enviados
              {relatorios.length > 0 && (
                <span className="badge badge-neutral" style={{ marginLeft: 8 }}>{relatorios.length}</span>
              )}
            </div>
            {relatorios.length > 0 && (
              <button className="btn btn-secondary btn-sm" onClick={exportarRelatoriosExcel}>
                ↓ Exportar Excel
              </button>
            )}
          </div>

          {relatorios.length === 0 ? (
            <p className="empty-state">Nenhum relatório enviado ainda.</p>
          ) : (
            <div className="rel-lista">
              {relatorios.map(rel => (
                <div
                  key={rel.id}
                  className={`rel-item${relExpandidoId === rel.id ? ' expandido' : ''}`}
                >
                  <div
                    className="rel-item-header"
                    onClick={() => setRelExpandidoId(relExpandidoId === rel.id ? null : rel.id)}
                  >
                    <div className="rel-item-esquerda">
                      <strong className="rel-item-titulo">{rel.atividade_titulo || '—'}</strong>
                      <span className="rel-item-meta">
                        Mês {rel.mes} · S{rel.semana}
                        {isAdmin && rel.consultor_nome && ` · ${rel.consultor_nome}`}
                      </span>
                    </div>
                    <div className="rel-item-direita">
                      {renderEstrelas(rel.avaliacao_equipe)}
                      <span className="rel-item-data">{formatarData(rel.enviado_em)}</span>
                      <span className="rel-item-icon">
                        {relExpandidoId === rel.id ? '▲' : '▼'}
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
                        <div className="rel-campo-label">Dificuldades</div>
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

      {/* Modal: Cobrar pendências (admin) */}
      {showModalCob && (
        <div className="modal-overlay" onClick={() => setShowModalCob(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Nova cobrança</h3>
              <div className="modal-sub">
                Projeto: <strong>{projeto?.nome}</strong> · {pendentes} atividade(s) pendente(s)
              </div>
            </div>
            <div className="modal-body">
              <form onSubmit={handleEnviarCobranca}>

                {/* Consultor */}
                {projeto?.consultores?.length > 1 ? (
                  <div className="form-group">
                    <label className="form-label">Consultor *</label>
                    <select
                      className="inp"
                      value={formCob.consultorId}
                      onChange={e => setFormCob({ ...formCob, consultorId: e.target.value })}
                      required
                    >
                      <option value="">Selecione...</option>
                      {projeto.consultores.map(c => (
                        <option key={c.id} value={c.id}>{c.nome}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="form-group">
                    <label className="form-label">Consultor</label>
                    <div className="inp" style={{ background: 'var(--bg)', color: 'var(--mx)', cursor: 'default' }}>
                      {projeto?.consultores?.[0]?.nome || '—'}
                    </div>
                  </div>
                )}

                {/* Urgência */}
                <div className="form-group">
                  <label className="form-label">Urgência</label>
                  <div className="status-opts">
                    {[
                      { value: 'normal', label: 'Normal'  },
                      { value: 'media',  label: 'Média'   },
                      { value: 'alta',   label: 'Alta'    },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        className={`status-opt ${formCob.urgencia === opt.value ? 'status-opt-ativo' : ''}`}
                        onClick={() => setFormCob({ ...formCob, urgencia: opt.value })}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mensagem */}
                <div className="form-group">
                  <label className="form-label">Mensagem *</label>
                  <textarea
                    className="inp"
                    rows="4"
                    value={formCob.mensagem}
                    onChange={e => setFormCob({ ...formCob, mensagem: e.target.value })}
                    required
                  />
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModalCob(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-warning" disabled={salvandoCob}>
                    {salvandoCob ? 'Enviando...' : 'Enviar cobrança'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Resumo de semana */}
      {modalSemana && (
        <div className="modal-overlay" onClick={() => setModalSemana(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <div>
                <h3>Resumo da Semana {modalSemana.sem} — Mês {modalSemana.mes}</h3>
                <div className="modal-sub">Este resumo pode ser enviado ao cliente ao final da semana</div>
              </div>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSalvarSemana}>
                <div className="form-group">
                  <label className="form-label">Resumo geral</label>
                  <textarea className="inp" rows="3" style={{ resize: 'vertical' }}
                    placeholder="Descreva o que foi realizado durante a semana..."
                    value={formSemana.resumo}
                    onChange={e => setFormSemana({ ...formSemana, resumo: e.target.value })}
                    autoFocus
                  />
                </div>
                <div className="form-row cols-2">
                  <div className="form-group">
                    <label className="form-label">✅ Pontos positivos</label>
                    <textarea className="inp" rows="3" style={{ resize: 'vertical' }}
                      placeholder="O que foi bem..."
                      value={formSemana.pontosPositivos}
                      onChange={e => setFormSemana({ ...formSemana, pontosPositivos: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">⚠️ Pontos de atenção</label>
                    <textarea className="inp" rows="3" style={{ resize: 'vertical' }}
                      placeholder="O que precisa de atenção..."
                      value={formSemana.pontosAtencao}
                      onChange={e => setFormSemana({ ...formSemana, pontosAtencao: e.target.value })}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setModalSemana(null)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={salvandoSemana}>
                    {salvandoSemana ? 'Salvando...' : 'Salvar resumo'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Editar observação da atividade */}
      {modalObsAtv && (
        <div className="modal-overlay" onClick={() => setModalObsAtv(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>Observação da atividade</h3>
                <div className="modal-sub">
                  <span className="rel-setor-tag">{modalObsAtv.setor}</span>
                  {modalObsAtv.titulo}
                </div>
              </div>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSalvarObs}>
                <div className="form-group">
                  <label className="form-label">Observação</label>
                  <textarea
                    className="inp"
                    rows="4"
                    placeholder="Adicione observações sobre esta atividade..."
                    value={novaObs}
                    onChange={e => setNovaObs(e.target.value)}
                    style={{ resize: 'vertical' }}
                    autoFocus
                  />
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setModalObsAtv(null)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={salvandoObs}>
                    {salvandoObs ? 'Salvando...' : 'Salvar observação'}
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
                        className={`star ${formRel.avaliacaoEquipe && n <= formRel.avaliacaoEquipe ? 'star-on' : 'star-off'}`}
                        onClick={() => setFormRel({ ...formRel, avaliacaoEquipe: n })}
                      >★</span>
                    ))}
                    {formRel.avaliacaoEquipe && (
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
