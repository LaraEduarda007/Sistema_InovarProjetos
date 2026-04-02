import React, { useState, useEffect } from 'react';
import MainLayout from '../components/MainLayout';
import Topbar from '../components/Topbar';
import { notificacoesService } from '../services/api';
import './NotificacoesPage.css';

function NotificacoesPage() {
  const [notificacoes, setNotificacoes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarNotificacoes();
  }, []);

  const carregarNotificacoes = async () => {
    try {
      setLoading(true);
      const response = await notificacoesService.listar();
      const notificacoesData = response.notificacoes || [];
      setNotificacoes(notificacoesData);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    } finally {
      setLoading(false);
    }
  };

  const marcarComoLida = async (id) => {
    try {
      await notificacoesService.marcarComoLida(id);
      carregarNotificacoes();
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
  };

  return (
    <MainLayout>
      <Topbar 
        title="Notificações" 
        subtitle="Seu centro de mensagens"
      />

      <div className="page-content">
        <div className="card">
          <h3 className="card-title">Notificações</h3>
          {loading ? (
            <p style={{ textAlign: 'center', color: '#999' }}>Carregando...</p>
          ) : notificacoes.length > 0 ? (
            <div>
              {notificacoes.map((notif) => (
                <div key={notif.id} style={{
                  padding: '12px',
                  borderBottom: '1px solid #eee',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold' }}>{notif.titulo}</div>
                    <div style={{ fontSize: '13px', color: '#666' }}>{notif.mensagem}</div>
                    <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
                      {new Date(notif.criada_em).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  {!notif.lida && (
                    <button
                      className="btn btn-primary"
                      style={{ marginLeft: '10px' }}
                      onClick={() => marcarComoLida(notif.id)}
                    >
                      Marcar como lida
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p style={{ textAlign: 'center', color: '#999' }}>Nenhuma notificação</p>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

export default NotificacoesPage;