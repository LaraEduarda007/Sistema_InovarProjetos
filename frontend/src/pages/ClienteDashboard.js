import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { projetosService } from '../services/api';
import './ClienteDashboard.css';

function ClienteDashboard() {
  const navigate  = useNavigate();
  const { usuario, logout } = useApp();
  const [dados, setDados]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro]       = useState(null);

  useEffect(() => { carregar(); }, []);

  const carregar = async () => {
    try {
      setLoading(true);
      setErro(null);
      const res = await projetosService.meuProjeto();
      setDados(res);
    } catch (err) {
      if (err?.response?.status === 404) {
        setErro('Nenhum projeto foi vinculado à sua conta ainda. Entre em contato com sua consultora responsável.');
      } else {
        setErro('Erro ao carregar projeto. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const fmtData = (d) => d ? new Date(d).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }) : '—';

  const mesLabel = (m) => {
    const map = {
      'em-andamento': { label: 'Em curso',   cor: 'var(--navy2)', bg: '#e8f0fe' },
      'concluido':    { label: 'Concluído',  cor: 'var(--green2)',bg: '#d1fae5' },
      'aguardando':   { label: 'Aguardando', cor: 'var(--mx)',    bg: 'var(--bdr2)' },
    };
    return map[m] || map['aguardando'];
  };

  const statusAtv = (s) => {
    const map = {
      'concluido':    { label: 'Concluído',    cls: 'badge-success' },
      'em-andamento': { label: 'Em andamento', cls: 'badge-info' },
      'a-fazer':      { label: 'Previsto',      cls: 'badge-neutral' },
      'nao-realizado':{ label: 'Não realizado', cls: 'badge-danger' },
    };
    return map[s] || { label: s, cls: 'badge-neutral' };
  };

  if (loading) {
    return (
      <div className="cl-shell">
        <div className="cl-topbar">
          <div className="cl-logo"><div className="cl-logo-i">IP</div><span>Inovar Projetos</span></div>
        </div>
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--mx)' }}>Carregando...</div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="cl-shell">
        <div className="cl-topbar">
          <div className="cl-logo"><div className="cl-logo-i">IP</div><span>Inovar Projetos</span></div>
          <div className="cl-topbar-right">
            <span className="cl-user">{usuario?.nome}</span>
            <button className="cl-sair" onClick={handleLogout}>Sair</button>
          </div>
        </div>
        <div style={{ maxWidth: 640, margin: '4rem auto', padding: '0 1.5rem' }}>
          <div className="alert alert-error">{erro}</div>
        </div>
      </div>
    );
  }

  const { projeto, consultores, atividades, progressoPorMes, metricas } = dados;

  // Atividades recentes (concluídas ou em andamento, últimas 5)
  const recentes = [...atividades]
    .filter(a => a.status === 'concluido' || a.status === 'em-andamento')
    .sort((a, b) => b.mes - a.mes || b.semana - a.semana)
    .slice(0, 5);

  // Próximas (a-fazer, próximas 5)
  const proximas = atividades
    .filter(a => a.status === 'a-fazer')
    .sort((a, b) => a.mes - b.mes || a.semana - b.semana)
    .slice(0, 5);

  // Construir array de todos os meses do projeto para barra de progresso mensal
  const todosMeses = [];
  for (let m = 1; m <= projeto.duracao_meses; m++) {
    const encontrado = progressoPorMes.find(p => p.mes === m);
    if (encontrado) {
      const statusM = encontrado.pct === 100 ? 'concluido' : encontrado.concluidas > 0 || encontrado.total > encontrado.concluidas ? 'em-andamento' : 'aguardando';
      todosMeses.push({ mes: m, ...encontrado, statusM });
    } else {
      // Se for o mês atual com atividades em andamento
      todosMeses.push({ mes: m, total: 0, concluidas: 0, pct: 0, statusM: 'aguardando' });
    }
  }

  return (
    <div className="cl-shell">
      {/* Topbar */}
      <div className="cl-topbar">
        <div className="cl-logo">
          <div className="cl-logo-i">IP</div>
          <span>Inovar Projetos</span>
        </div>
        <div className="cl-topbar-right">
          <span className="cl-user">{projeto.nome} · {usuario?.nome || 'Cliente'}</span>
          <button className="cl-sair" onClick={handleLogout}>Sair</button>
        </div>
      </div>

      {/* Hero */}
      <div className="cl-hero">
        <div className="cl-hero-inner">
          <div className="cl-hero-label">Acompanhamento do projeto</div>
          <h1 className="cl-hero-title">{projeto.nome}</h1>
          <div className="cl-hero-sub">
            Consultoria Inovar Varejo · Iniciado em {fmtData(projeto.data_inicio)} · {projeto.duracao_meses} meses de acompanhamento
          </div>
          <div className="cl-hero-prog">
            <div className="cl-prog-bg">
              <div className="cl-prog-fill" style={{ width: `${metricas.pctGlobal}%` }} />
            </div>
            <span className="cl-prog-label">
              {metricas.pctGlobal}% concluído · Mês {metricas.mesAtual} de {projeto.duracao_meses}
            </span>
          </div>
        </div>
      </div>

      {/* Corpo */}
      <div className="cl-body">

        {/* Banner informativo */}
        <div className="cl-banner">
          Este painel é atualizado automaticamente pela equipe de consultoria.
          Você está visualizando o andamento geral do seu projeto. Para dúvidas, entre em contato com sua consultora responsável.
        </div>

        {/* Métricas */}
        <div className="cl-metricas">
          <div className="cl-mc">
            <div className="cl-mc-l">Mês atual</div>
            <div className="cl-mc-v">{metricas.mesAtual} / {projeto.duracao_meses}</div>
            <div className="cl-mc-s">Em andamento</div>
          </div>
          <div className="cl-mc">
            <div className="cl-mc-l">Atividades concluídas</div>
            <div className="cl-mc-v" style={{ color: 'var(--green2)' }}>{metricas.totalConc}</div>
            <div className="cl-mc-s">de {metricas.totalAtiv} cadastradas</div>
          </div>
          <div className="cl-mc">
            <div className="cl-mc-l">Em andamento</div>
            <div className="cl-mc-v" style={{ color: '#d97706' }}>{metricas.totalAndamento}</div>
            <div className="cl-mc-s">neste período</div>
          </div>
          <div className="cl-mc">
            <div className="cl-mc-l">Consultora responsável</div>
            <div className="cl-mc-v cl-mc-nome">{consultores[0]?.nome || '—'}</div>
            <div className="cl-mc-s">{consultores[0]?.especialidade || ''}</div>
          </div>
        </div>

        {/* Progresso por mês */}
        <div className="cl-section">
          <div className="cl-sec-title">Progresso por mês</div>
          {todosMeses.map(m => {
            const st = mesLabel(m.statusM);
            const mostraBarra = m.total > 0;
            return (
              <div key={m.mes} className="cl-mes-bar">
                <span className="cl-mes-nome">Mês {m.mes}</span>
                <div className="cl-mes-prog-bg">
                  {mostraBarra && (
                    <div className="cl-mes-prog-fill" style={{
                      width: `${m.pct}%`,
                      background: m.pct === 100 ? 'var(--green2)' : 'var(--navy2)'
                    }} />
                  )}
                </div>
                <span className="cl-mes-pct" style={{ color: mostraBarra ? (m.pct === 100 ? 'var(--green2)' : 'var(--navy2)') : 'var(--mx)' }}>
                  {mostraBarra ? `${m.pct}%` : '—'}
                </span>
                <span className="cl-mes-badge" style={{ color: st.cor, background: st.bg }}>
                  {st.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Últimas atividades */}
        {recentes.length > 0 && (
          <div className="cl-section">
            <div className="cl-sec-title">Últimas atividades realizadas</div>
            {recentes.map(a => {
              const st = statusAtv(a.status);
              return (
                <div key={a.id} className="cl-atv-item">
                  <div className="cl-atv-top">
                    <span className="cl-atv-titulo">{a.titulo}</span>
                    <span className={`badge ${st.cls}`}>{st.label}</span>
                  </div>
                  <div className="cl-atv-meta">
                    Mês {a.mes} · Semana {a.semana} · {a.setor}
                    {a.data_realizacao && ` · ${new Date(a.data_realizacao).toLocaleDateString('pt-BR')}`}
                    {a.consultor_nome && ` · ${a.consultor_nome}`}
                  </div>
                  {a.observacao && (
                    <div className="cl-atv-obs">{a.observacao}</div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Equipe de consultores */}
        {consultores.length > 0 && (
          <div className="cl-section">
            <div className="cl-sec-title">Equipe de consultores no projeto</div>
            {consultores.map((c, i) => (
              <div key={c.id} className="cl-cons-row">
                <div className="cl-av">{c.nome.charAt(0).toUpperCase()}</div>
                <div style={{ flex: 1 }}>
                  <div className="cl-cons-nome">{c.nome}</div>
                  <div className="cl-cons-esp">{c.especialidade || c.area_atuacao || 'Consultor'}</div>
                </div>
                <span className={`badge ${i === 0 ? 'badge-info' : 'badge-neutral'}`}>
                  {i === 0 ? 'Responsável' : 'Especialista'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Próximas atividades */}
        {proximas.length > 0 && (
          <div className="cl-section">
            <div className="cl-sec-title">Próximas atividades previstas</div>
            {proximas.map(a => (
              <div key={a.id} className="cl-atv-item">
                <div className="cl-atv-top">
                  <span className="cl-atv-titulo">{a.titulo}</span>
                  <span className="badge badge-neutral">Mês {a.mes} · Semana {a.semana}</span>
                </div>
                <div className="cl-atv-meta">
                  {a.setor}
                  {a.data_prevista && ` · Previsto: ${new Date(a.data_prevista).toLocaleDateString('pt-BR')}`}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="cl-footer">
          Inovar Varejo Consultoria · <a href="https://www.inovarvarejo.com.br">www.inovarvarejo.com.br</a>
        </div>
      </div>
    </div>
  );
}

export default ClienteDashboard;
