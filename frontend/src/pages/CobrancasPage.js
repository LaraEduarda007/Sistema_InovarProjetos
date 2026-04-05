import React, { useState, useEffect } from 'react';
import MainLayout from '../components/MainLayout';
import Topbar from '../components/Topbar';
import { cobrancasService, usuariosService, atividadesService, projetosService } from '../services/api';
import { useApp } from '../context/AppContext';
import './CobrancasPage.css';

function CobrancasPage() {
  const { usuario } = useApp();
  const isAdmin = usuario?.perfil === 'admin';

  const [cobrancas, setCobrancas]         = useState([]);
  const [consultores, setConsultores]     = useState([]);
  const [todasAtividades, setTodasAtividades] = useState([]); // todas atividades (para o modal)
  const [projetoMap, setProjetoMap]           = useState({});  // map id -> projeto
  const [loading, setLoading]             = useState(true);
  const [erro, setErro]                   = useState(null);

  // Modal nova cobrança
  const [showModal, setShowModal]         = useState(false);
  const [salvando, setSalvando]           = useState(false);
  const [atividadesSelecionadas, setAtividadesSelecionadas] = useState([]);
  const [formData, setFormData] = useState({
    consultorId: '', prazo: '', urgencia: 'normal', mensagem: ''
  });

  // Modal de detalhes
  const [detalhe, setDetalhe]         = useState(null);
  const [atualizando, setAtualizando] = useState(false);

  useEffect(() => { carregarDados(); }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      setErro(null);
      const cobRes = await cobrancasService.listar();
      setCobrancas(cobRes.cobrancas || []);

      if (isAdmin) {
        const [consRes, atvRes, projRes] = await Promise.all([
          usuariosService.listarConsultores(),
          atividadesService.listar(),
          projetosService.listar()
        ]);
        const lista = consRes.consultores || [];
        setConsultores(lista);
        const atvsData = atvRes.atividades || [];
        setTodasAtividades(atvsData);
        const pMap = {};
        (projRes.projetos || []).forEach(p => { pMap[p.id] = p; });
        setProjetoMap(pMap);
        if (lista.length > 0) setFormData(f => ({ ...f, consultorId: lista[0].id }));
      }
    } catch {
      setErro('Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  };

  const handleEnviar = async (e) => {
    e.preventDefault();
    try {
      setSalvando(true);
      await cobrancasService.criar({ ...formData, atividadeIds: atividadesSelecionadas });
      setShowModal(false);
      setFormData({ consultorId: consultores[0]?.id || '', prazo: '', urgencia: 'normal', mensagem: '' });
      setAtividadesSelecionadas([]);
      carregarDados();
    } catch {
      setErro('Erro ao enviar cobrança.');
    } finally {
      setSalvando(false);
    }
  };

  const toggleAtividade = (id) => {
    setAtividadesSelecionadas(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Atividades pendentes do consultor selecionado
  const atividadesPendentes = todasAtividades.filter(a =>
    a.consultor_id === formData.consultorId &&
    a.status !== 'concluido'
  );

  const handleDeletar = async (id) => {
    if (!window.confirm('Excluir esta cobrança? Esta ação não pode ser desfeita.')) return;
    try {
      await cobrancasService.deletar(id);
      setDetalhe(null);
      setCobrancas(prev => prev.filter(c => c.id !== id));
    } catch {
      setErro('Erro ao excluir cobrança.');
    }
  };

  const handleMarcarResolvida = async (id) => {
    try {
      setAtualizando(true);
      await cobrancasService.atualizar(id, { status: 'resolvida' });
      // Atualiza local + detalhe
      setCobrancas(prev => prev.map(c => c.id === id ? { ...c, status: 'resolvida' } : c));
      if (detalhe?.id === id) setDetalhe(d => ({ ...d, status: 'resolvida' }));
    } catch {
      setErro('Erro ao atualizar cobrança.');
    } finally {
      setAtualizando(false);
    }
  };

  const urgenciaBadge = (u) => {
    const map = {
      alta:    ['badge-danger',   'Alta'],
      media:   ['badge-warning',  'Média'],
      normal:  ['badge-neutral',  'Normal'],
      urgente: ['badge-danger',   'Urgente'],
    };
    const [cls, label] = map[u] || ['badge-neutral', u || 'Normal'];
    return <span className={`badge ${cls}`}>{label}</span>;
  };

  const statusBadge = (s) => {
    if (s === 'aberta')     return <span className="badge badge-warning">Aberta</span>;
    if (s === 'respondida') return <span className="badge badge-info">Respondida</span>;
    if (s === 'resolvida')  return <span className="badge badge-success">Resolvida</span>;
    return <span className="badge badge-neutral">{s}</span>;
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';

  // Atividades em atraso: sem relatório, não concluídas, e a semana prevista já passou
  const calcAtraso = (dataInicio, mes, semana) => {
    if (!dataInicio) return 0;
    const d = new Date(dataInicio);
    d.setDate(d.getDate() + ((mes - 1) * 4 + semana) * 7);
    return Math.floor((new Date() - d) / (1000 * 60 * 60 * 24));
  };

  const atividadesEmAtraso = isAdmin
    ? todasAtividades
        .filter(a => {
          if (a.relatorio_id || a.status === 'concluido') return false;
          const proj = projetoMap[a.projeto_id];
          return proj?.data_inicio && calcAtraso(proj.data_inicio, a.mes, a.semana) > 0;
        })
        .map(a => ({ ...a, diasAtraso: calcAtraso(projetoMap[a.projeto_id]?.data_inicio, a.mes, a.semana) }))
        .sort((a, b) => b.diasAtraso - a.diasAtraso)
    : [];

  // Verifica se já existe cobrança para determinada atividade
  const atividadeCobrada = (atvId) =>
    cobrancas.some(c => {
      try { return JSON.parse(c.atividades_ids || '[]').includes(atvId); } catch { return false; }
    });

  // Métricas do protótipo
  const hoje = new Date();
  const inicioSemana = new Date(hoje);
  inicioSemana.setDate(hoje.getDate() - hoje.getDay());
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

  const qtdEmAberto       = cobrancas.filter(c => c.status === 'aberta').length;
  const qtdEstaSemana     = cobrancas.filter(c => new Date(c.enviada_em) >= inicioSemana).length;
  const qtdResolvidasMes  = cobrancas.filter(c => c.status === 'resolvida' && new Date(c.resolvida_em || c.atualizado_em) >= inicioMes).length;

  return (
    <MainLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <Topbar title="Cobranças" subtitle="Gerencie atividades pendentes dos consultores" semUsuario />
        {isAdmin && (
          <button className="btn btn-warning" onClick={() => setShowModal(true)}>
            + Nova cobrança
          </button>
        )}
      </div>

      {erro && <div className="alert alert-error">{erro}</div>}

      {/* Métricas */}
      <div className="metrics-grid cols-3" style={{ marginBottom: '1.25rem' }}>
        <div className="metric-card">
          <div className="metric-label">Em aberto</div>
          <div className={`metric-value ${qtdEmAberto > 0 ? 'danger' : ''}`}>{qtdEmAberto}</div>
          <div className="metric-sub">aguardando resposta</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Enviadas esta semana</div>
          <div className={`metric-value ${qtdEstaSemana > 0 ? 'warn' : ''}`}>{qtdEstaSemana}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Resolvidas este mês</div>
          <div className="metric-value good">{qtdResolvidasMes}</div>
        </div>
      </div>

      {/* Atividades com relatório em atraso */}
      {isAdmin && atividadesEmAtraso.length > 0 && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div className="card-title">Atividades com relatório em atraso</div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Consultor</th>
                <th>Atividade</th>
                <th>Projeto</th>
                <th>Semana</th>
                <th>Atraso</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {atividadesEmAtraso.map(atv => {
                const cobrada = atividadeCobrada(atv.id);
                return (
                  <tr key={atv.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%',
                          background: 'var(--navy-lt)', color: 'var(--navy2)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: 11
                        }}>
                          {(atv.consultor_nome || '?').substring(0, 2).toUpperCase()}
                        </div>
                        {atv.consultor_nome || '—'}
                      </div>
                    </td>
                    <td style={{ fontWeight: 600, fontSize: 12 }}>{atv.titulo}</td>
                    <td style={{ fontSize: 12, color: 'var(--mx)' }}>{atv.projeto_nome || projetoMap[atv.projeto_id]?.nome || '—'}</td>
                    <td style={{ fontSize: 12, color: 'var(--mx)' }}>Mês {atv.mes} · S{atv.semana}</td>
                    <td>
                      <span className={`badge ${atv.diasAtraso >= 7 ? 'badge-danger' : 'badge-warning'}`}>
                        {atv.diasAtraso} dia{atv.diasAtraso !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td>
                      {cobrada
                        ? <span className="badge badge-warning">Cobrado</span>
                        : <span className="badge badge-neutral">Não cobrado</span>}
                    </td>
                    <td>
                      <button className="btn-link" onClick={() => setShowModal(true)}>
                        {cobrada ? 'Cobrar novamente' : 'Cobrar'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Tabela — histórico */}
      <div className="card">
        <div className="card-title">Histórico de cobranças</div>
        {loading ? (
          <p className="empty-state">Carregando...</p>
        ) : cobrancas.length === 0 ? (
          <p className="empty-state">Nenhuma cobrança registrada.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Consultor</th>
                <th>Urgência</th>
                <th>Status</th>
                <th>Enviada em</th>
                <th>Prazo</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {cobrancas.map(cob => (
                <tr key={cob.id} style={{ cursor: 'pointer' }} onClick={() => setDetalhe(cob)}>
                  <td><strong>{cob.consultor_nome || cob.consultor_id}</strong></td>
                  <td>{urgenciaBadge(cob.urgencia)}</td>
                  <td>{statusBadge(cob.status)}</td>
                  <td style={{ color: 'var(--mx)' }}>{fmt(cob.enviada_em)}</td>
                  <td style={{ color: 'var(--mx)' }}>{fmt(cob.prazo)}</td>
                  <td>
                    <button className="btn-link" onClick={e => { e.stopPropagation(); setDetalhe(cob); }}>
                      Ver →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Modal: detalhes da cobrança ── */}
      {detalhe && (
        <div className="modal-overlay" onClick={() => setDetalhe(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header warn">
              <div>
                <h3>Detalhes da cobrança</h3>
                <div className="modal-sub">Enviada em {fmt(detalhe.enviada_em)}</div>
              </div>
              <button className="btn-link" onClick={() => setDetalhe(null)} style={{ fontSize: '1.3rem' }}>×</button>
            </div>

            <div className="modal-body">
              <div className="cob-grid">
                <div className="cob-campo">
                  <div className="cob-label">Consultor</div>
                  <div className="cob-val">{detalhe.consultor_nome || detalhe.consultor_id}</div>
                </div>
                <div className="cob-campo">
                  <div className="cob-label">Status</div>
                  <div>{statusBadge(detalhe.status)}</div>
                </div>
                <div className="cob-campo">
                  <div className="cob-label">Urgência</div>
                  <div>{urgenciaBadge(detalhe.urgencia)}</div>
                </div>
                {detalhe.prazo && (
                  <div className="cob-campo">
                    <div className="cob-label">Prazo</div>
                    <div className="cob-val">{fmt(detalhe.prazo)}</div>
                  </div>
                )}
              </div>

              {/* Atividades cobradas */}
              {detalhe.atividades_ids && (() => {
                let ids = [];
                try { ids = JSON.parse(detalhe.atividades_ids); } catch (_) {}
                const ativsCobradas = todasAtividades.filter(a => ids.includes(a.id));
                if (ativsCobradas.length === 0) return null;
                return (
                  <div className="cob-secao">
                    <div className="cob-label">Atividades cobradas ({ativsCobradas.length})</div>
                    <div className="cob-atividades-detalhe">
                      {ativsCobradas.map(a => (
                        <div key={a.id} className="cob-ativ-tag">
                          <strong>{a.titulo}</strong>
                          {a.projeto_nome && <span style={{ color: '#b45309' }}> · {a.projeto_nome}</span>}
                          <span style={{ color: '#b45309', fontWeight: 400 }}> · Mês {a.mes} / Sem. {a.semana}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {detalhe.mensagem && (
                <div className="cob-secao">
                  <div className="cob-label">Mensagem enviada</div>
                  <div className="cob-texto">{detalhe.mensagem}</div>
                </div>
              )}

              {detalhe.resposta && (
                <div className="cob-secao cob-resposta">
                  <div className="cob-label">Resposta do consultor</div>
                  <div className="cob-texto">{detalhe.resposta}</div>
                  {detalhe.respondida_em && (
                    <div className="cob-data-resp">Respondida em {fmt(detalhe.respondida_em)}</div>
                  )}
                </div>
              )}

              {!detalhe.resposta && (
                <div className="cob-secao cob-sem-resposta">
                  Aguardando resposta do consultor
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDetalhe(null)}>Fechar</button>
              {isAdmin && (
                <>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDeletar(detalhe.id)}
                    style={{ marginRight: 'auto' }}
                  >
                    Excluir
                  </button>
                  {detalhe.status !== 'resolvida' && (
                    <button
                      className="btn btn-success"
                      disabled={atualizando}
                      onClick={() => handleMarcarResolvida(detalhe.id)}
                    >
                      {atualizando ? 'Salvando...' : '✓ Marcar como resolvida'}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: nova cobrança ── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header warn">
              <h3>Nova cobrança</h3>
              <div className="modal-sub">O consultor receberá uma notificação</div>
            </div>

            <div className="modal-body">
              <form onSubmit={handleEnviar}>
                <div className="form-group">
                  <label className="form-label">Consultor *</label>
                  <select className="inp" value={formData.consultorId}
                    onChange={e => setFormData({ ...formData, consultorId: e.target.value })} required>
                    <option value="">Selecione...</option>
                    {consultores.map(c => (
                      <option key={c.id} value={c.id}>{c.nome}{c.especialidade ? ` — ${c.especialidade}` : ''}</option>
                    ))}
                  </select>
                </div>

                {/* Atividades pendentes do consultor */}
                {formData.consultorId && atividadesPendentes.length > 0 && (
                  <div className="form-group">
                    <label className="form-label">Atividades a cobrar (opcional)</label>
                    <div className="cob-atividades-lista">
                      {atividadesPendentes.map(a => (
                        <label key={a.id} className="cob-ativ-check">
                          <input
                            type="checkbox"
                            checked={atividadesSelecionadas.includes(a.id)}
                            onChange={() => toggleAtividade(a.id)}
                          />
                          <span>
                            <strong>{a.titulo}</strong>
                            <span style={{ color: 'var(--mx)', fontSize: '.75rem', marginLeft: '.4rem' }}>
                              {a.projeto_nome ? `· ${a.projeto_nome}` : ''} · Mês {a.mes} / Sem. {a.semana}
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>
                    {atividadesSelecionadas.length > 0 && (
                      <div style={{ fontSize: '.78rem', color: 'var(--navy2)', marginTop: '.3rem' }}>
                        {atividadesSelecionadas.length} atividade(s) selecionada(s)
                      </div>
                    )}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Urgência</label>
                  <div className="status-opts" style={{ marginTop: '.25rem' }}>
                    {[['normal','Normal'],['media','Média'],['alta','Alta']].map(([val, label]) => (
                      <button key={val} type="button"
                        className={`status-opt${formData.urgencia === val ? ' status-opt-ativo' : ''}`}
                        style={formData.urgencia === val
                          ? { borderColor: val === 'alta' ? 'var(--red)' : val === 'media' ? '#d97706' : 'var(--navy2)',
                              color: val === 'alta' ? 'var(--red)' : val === 'media' ? '#d97706' : 'var(--navy2)',
                              background: val === 'alta' ? '#fef2f2' : val === 'media' ? '#fffbeb' : 'var(--navy-lt)' }
                          : {}}
                        onClick={() => setFormData({ ...formData, urgencia: val })}
                      >{label}</button>
                    ))}
                  </div>
                </div>

                <div className="form-row cols-2">
                  <div className="form-group">
                    <label className="form-label">Prazo (opcional)</label>
                    <input className="inp" type="date" value={formData.prazo}
                      onChange={e => setFormData({ ...formData, prazo: e.target.value })} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Mensagem</label>
                  <textarea className="inp" rows="3"
                    placeholder="Descreva o que precisa ser regularizado..."
                    value={formData.mensagem}
                    onChange={e => setFormData({ ...formData, mensagem: e.target.value })} />
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-warning" disabled={salvando}>
                    {salvando ? 'Enviando...' : 'Enviar cobrança'}
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

export default CobrancasPage;
