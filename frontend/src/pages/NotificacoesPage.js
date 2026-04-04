import React, { useState, useEffect } from 'react';
import MainLayout from '../components/MainLayout';
import Topbar from '../components/Topbar';
import { notificacoesService } from '../services/api';
import './NotificacoesPage.css';

function NotificacoesPage() {
  const [notificacoes, setNotificacoes] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [erro, setErro]                 = useState(null);

  useEffect(() => {
    carregarNotificacoes();
  }, []);

  const carregarNotificacoes = async () => {
    try {
      setLoading(true);
      setErro(null);
      const response = await notificacoesService.listar();
      setNotificacoes(response.notificacoes || []);
    } catch (error) {
      setErro('Erro ao carregar notificações.');
    } finally {
      setLoading(false);
    }
  };

  const marcarComoLida = async (id) => {
    try {
      await notificacoesService.marcarComoLida(id);
      carregarNotificacoes();
    } catch (error) {
      setErro('Erro ao marcar notificação.');
    }
  };

  const marcarTodasComoLidas = async () => {
    try {
      await notificacoesService.marcarTodasComoLidas();
      carregarNotificacoes();
    } catch (error) {
      setErro('Erro ao marcar todas como lidas.');
    }
  };

  const formatarData = (data) => {
    if (!data) return '';
    return new Date(data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // Cor do dot por tipo de notificação
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
              <div key={notif.id} className={`notif-item ${!notif.lida ? 'nao-lida' : ''}`}>
                {/* Dot colorido */}
                <div className="notif-dot" style={{ background: dotCor(notif.tipo) }} />

                {/* Conteúdo */}
                <div className="notif-conteudo">
                  <div className="notif-titulo">{notif.titulo}</div>
                  <div className="notif-mensagem">{notif.mensagem}</div>
                  <div className="notif-data">{formatarData(notif.data_criacao)}</div>
                </div>

                {/* Ação */}
                {!notif.lida && (
                  <button
                    className="btn btn-secondary btn-xs"
                    onClick={() => marcarComoLida(notif.id)}
                  >
                    Marcar como lida
                  </button>
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
