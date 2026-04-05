import React, { useState, useEffect } from 'react';
import MainLayout from '../components/MainLayout';
import Topbar from '../components/Topbar';
import { notificacoesService, cobrancasService } from '../services/api';
import './NotificacoesPage.css';

function NotificacoesPage() {
  const [notificacoes, setNotificacoes] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [erro, setErro]                 = useState(null);

  // Cobrança expandida para resposta
  const [cobrandoId, setCobrandoId]     = useState(null); // id da notificacao
  const [cobrancaDetalhe, setCobrancaDetalhe] = useState(null); // dados da cobrança
  const [resposta, setResposta]         = useState('');
  const [enviandoResp, setEnviandoResp] = useState(false);

  useEffect(() => { carregarNotificacoes(); }, []);

  const carregarNotificacoes = async () => {
    try {
      setLoading(true);
      setErro(null);
      const response = await notificacoesService.listar();
      setNotificacoes(response.notificacoes || []);
    } catch {
      setErro('Erro ao carregar notificações.');
    } finally {
      setLoading(false);
    }
  };

  const marcarComoLida = async (id) => {
    try {
      await notificacoesService.marcarComoLida(id);
      setNotificacoes(prev => prev.map(n => n.id === id ? { ...n, lida: 1 } : n));
    } catch {
      setErro('Erro ao marcar notificação.');
    }
  };

  const marcarTodasComoLidas = async () => {
    try {
      await notificacoesService.marcarTodasComoLidas();
      carregarNotificacoes();
    } catch {
      setErro('Erro ao marcar todas como lidas.');
    }
  };

  const abrirResposta = async (notif) => {
    setCobrandoId(notif.id);
    setResposta('');
    setCobrancaDetalhe(null);
    try {
      const res = await cobrancasService.obter(notif.relacao_id);
      setCobrancaDetalhe(res.cobranca || null);
    } catch {
      setCobrancaDetalhe(null);
    }
  };

  const handleResponder = async (e) => {
    e.preventDefault();
    if (!cobrancaDetalhe) return;
    try {
      setEnviandoResp(true);
      await cobrancasService.responder(cobrancaDetalhe.id, resposta);
      // Marca a notificação como lida também
      const notif = notificacoes.find(n => n.id === cobrandoId);
      if (notif && !notif.lida) await marcarComoLida(cobrandoId);
      setCobrandoId(null);
      setCobrancaDetalhe(prev => ({ ...prev, resposta, status: 'respondida' }));
      carregarNotificacoes();
    } catch (err) {
      setErro(err?.response?.data?.erro || 'Erro ao enviar resposta.');
    } finally {
      setEnviandoResp(false);
    }
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString('pt-BR') : '';

  const dotCor = (tipo) => {
    if (tipo === 'cobranca') return '#f59e0b';
    if (tipo === 'relatorio') return 'var(--green2)';
    return 'var(--navy2)';
  };

  const naoLidas = notificacoes.filter(n => !n.lida).length;

  return (
    <MainLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <Topbar title="Notificações" subtitle="Suas mensagens e alertas do sistema" semUsuario />
        {naoLidas > 0 && (
          <button className="btn btn-secondary btn-sm" onClick={marcarTodasComoLidas}>
            Marcar todas como lidas
          </button>
        )}
      </div>

      {erro && <div className="alert alert-error">{erro}</div>}

      <div className="card">
        {loading ? (
          <p className="empty-state">Carregando...</p>
        ) : notificacoes.length === 0 ? (
          <p className="empty-state">Nenhuma notificação.</p>
        ) : (
          <div>
            {notificacoes.map((notif) => (
              <div key={notif.id}>
                <div className={`notif-item ${!notif.lida ? 'nao-lida' : ''}`}>
                  <div className="notif-dot" style={{ background: dotCor(notif.tipo) }} />

                  <div className="notif-conteudo">
                    <div className="notif-titulo">{notif.titulo}</div>
                    <div className="notif-mensagem">{notif.mensagem}</div>
                    <div className="notif-data">{fmt(notif.data_criacao)}</div>
                  </div>

                  <div className="notif-acoes">
                    {/* Cobrança: botão responder (ou status) */}
                    {notif.tipo === 'cobranca' && notif.relacao_id && (
                      cobrandoId === notif.id
                        ? <button className="btn btn-secondary btn-xs" onClick={() => setCobrandoId(null)}>Fechar</button>
                        : <button className="btn btn-warning btn-xs" onClick={() => abrirResposta(notif)}>
                            Responder
                          </button>
                    )}
                    {/* Marcar como lida */}
                    {!notif.lida && (
                      <button className="btn btn-secondary btn-xs" onClick={() => marcarComoLida(notif.id)}>
                        Marcar como lida
                      </button>
                    )}
                    {notif.lida && <span className="notif-lida-tag">✓ Lida</span>}
                  </div>
                </div>

                {/* Painel de resposta expandível */}
                {cobrandoId === notif.id && (
                  <div className="notif-resposta-panel">
                    {cobrancaDetalhe ? (
                      <>
                        {cobrancaDetalhe.mensagem && (
                          <div className="notif-cob-msg">
                            <div className="notif-cob-label">Mensagem do administrador</div>
                            <p>{cobrancaDetalhe.mensagem}</p>
                          </div>
                        )}

                        {cobrancaDetalhe.resposta ? (
                          <div className="notif-cob-respondida">
                            <div className="notif-cob-label">Sua resposta (enviada)</div>
                            <p>{cobrancaDetalhe.resposta}</p>
                          </div>
                        ) : (
                          <form onSubmit={handleResponder}>
                            <label className="form-label" style={{ marginBottom: '.4rem', display: 'block' }}>
                              Sua resposta
                            </label>
                            <textarea
                              className="inp"
                              rows="3"
                              placeholder="Descreva o que foi feito ou informe a situação das atividades..."
                              value={resposta}
                              onChange={e => setResposta(e.target.value)}
                              required
                              style={{ resize: 'vertical' }}
                            />
                            <div style={{ display: 'flex', gap: '.5rem', marginTop: '.5rem' }}>
                              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setCobrandoId(null)}>
                                Cancelar
                              </button>
                              <button type="submit" className="btn btn-warning btn-sm" disabled={enviandoResp}>
                                {enviandoResp ? 'Enviando...' : 'Enviar resposta'}
                              </button>
                            </div>
                          </form>
                        )}
                      </>
                    ) : (
                      <p style={{ color: 'var(--mx)', fontSize: '.85rem' }}>Carregando detalhes...</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}

export default NotificacoesPage;
