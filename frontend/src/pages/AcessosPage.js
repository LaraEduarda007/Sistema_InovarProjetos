import React, { useState, useEffect } from 'react';
import MainLayout from '../components/MainLayout';
import Topbar from '../components/Topbar';
import { usuariosService } from '../services/api';

const FORM_VAZIO = { nome: '', email: '', perfil: 'consultor', especialidade: '' };

function AcessosPage() {
  const [usuarios, setUsuarios]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [erro, setErro]           = useState(null);
  const [salvando, setSalvando]   = useState(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [form, setForm]           = useState(FORM_VAZIO);
  const [criando, setCriando]     = useState(false);
  const [erroModal, setErroModal] = useState(null);

  useEffect(() => { carregar(); }, []);

  const carregar = async () => {
    try {
      setLoading(true);
      setErro(null);
      const res = await usuariosService.listarTodos();
      setUsuarios(res.usuarios || []);
    } catch {
      setErro('Erro ao carregar usuários.');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (u) => {
    const novoStatus = u.status === 'ativo' ? 'inativo' : 'ativo';
    if (!window.confirm(`${novoStatus === 'inativo' ? 'Bloquear' : 'Reativar'} o acesso de "${u.nome}"?`)) return;
    try {
      setSalvando(u.id);
      await usuariosService.atualizar(u.id, { status: novoStatus });
      setUsuarios(prev => prev.map(x => x.id === u.id ? { ...x, status: novoStatus } : x));
    } catch {
      setErro('Erro ao atualizar acesso.');
    } finally {
      setSalvando(null);
    }
  };

  const abrirModal = () => {
    setForm(FORM_VAZIO);
    setErroModal(null);
    setModalAberto(true);
  };

  const fecharModal = () => {
    if (criando) return;
    setModalAberto(false);
    setErroModal(null);
  };

  const handleCriar = async (e) => {
    e.preventDefault();
    if (!form.nome.trim() || !form.email.trim()) {
      setErroModal('Nome e e-mail são obrigatórios.');
      return;
    }
    try {
      setCriando(true);
      setErroModal(null);
      await usuariosService.criar({
        nome: form.nome.trim(),
        email: form.email.trim(),
        perfil: form.perfil,
        especialidade: form.especialidade.trim() || null
      });
      setModalAberto(false);
      carregar();
    } catch (err) {
      const msg = err?.response?.data?.erro || 'Erro ao criar usuário.';
      setErroModal(msg);
    } finally {
      setCriando(false);
    }
  };

  const perfilBadge = (p) => {
    if (p === 'admin')    return <span className="badge badge-info">Admin</span>;
    if (p === 'cliente')  return <span className="badge badge-warning">Cliente</span>;
    return <span className="badge badge-neutral">Consultor</span>;
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';

  const admins  = usuarios.filter(u => u.perfil === 'admin');
  const consult = usuarios.filter(u => u.perfil === 'consultor');
  const clientes = usuarios.filter(u => u.perfil === 'cliente');

  const TabelaUsuarios = ({ lista }) => (
    <table className="data-table">
      <thead>
        <tr>
          <th>Nome</th>
          <th>E-mail</th>
          <th>Perfil</th>
          <th>Status</th>
          <th>Cadastrado em</th>
          <th>Ação</th>
        </tr>
      </thead>
      <tbody>
        {lista.map(u => (
          <tr key={u.id}>
            <td><strong>{u.nome}</strong></td>
            <td style={{ color: 'var(--mx)' }}>{u.email}</td>
            <td>{perfilBadge(u.perfil)}</td>
            <td>
              <span className={`badge ${u.status === 'ativo' ? 'badge-success' : 'badge-danger'}`}>
                {u.status === 'ativo' ? 'Ativo' : 'Bloqueado'}
              </span>
            </td>
            <td style={{ color: 'var(--mx)' }}>{fmt(u.criado_em)}</td>
            <td>
              <button
                className={`btn-link ${u.status === 'ativo' ? 'danger' : ''}`}
                disabled={salvando === u.id}
                onClick={() => toggleStatus(u)}
              >
                {salvando === u.id ? '...' : u.status === 'ativo' ? 'Bloquear' : 'Reativar'}
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <MainLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <Topbar title="Acessos" subtitle="Gerencie os usuários e permissões do sistema" semUsuario />
        <button className="btn btn-primary" style={{ marginTop: 4 }} onClick={abrirModal}>
          + Novo Acesso
        </button>
      </div>

      {erro && <div className="alert alert-error">{erro}</div>}

      {loading ? (
        <p className="empty-state">Carregando...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {admins.length > 0 && (
            <div className="card">
              <div className="card-title">Administradores</div>
              <TabelaUsuarios lista={admins} />
            </div>
          )}

          {consult.length > 0 && (
            <div className="card">
              <div className="card-title">Consultores</div>
              <TabelaUsuarios lista={consult} />
            </div>
          )}

          {clientes.length > 0 && (
            <div className="card">
              <div className="card-title">Clientes</div>
              <TabelaUsuarios lista={clientes} />
            </div>
          )}

          {usuarios.length === 0 && (
            <p className="empty-state">Nenhum usuário cadastrado.</p>
          )}
        </div>
      )}

      {/* Modal Novo Acesso */}
      {modalAberto && (
        <div className="modal-overlay" onClick={fecharModal}>
          <div className="modal-box" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Novo Acesso</span>
              <button className="modal-close" onClick={fecharModal}>×</button>
            </div>

            {erroModal && <div className="alert alert-error" style={{ margin: '0 0 .75rem' }}>{erroModal}</div>}

            <form onSubmit={handleCriar} style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
              <div>
                <label className="inp-label">Nome completo *</label>
                <input
                  className="inp"
                  placeholder="Nome do usuário"
                  value={form.nome}
                  onChange={e => setForm({ ...form, nome: e.target.value })}
                  disabled={criando}
                />
              </div>

              <div>
                <label className="inp-label">E-mail *</label>
                <input
                  className="inp"
                  type="email"
                  placeholder="email@exemplo.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  disabled={criando}
                />
              </div>

              <div>
                <label className="inp-label">Perfil *</label>
                <select
                  className="inp"
                  value={form.perfil}
                  onChange={e => setForm({ ...form, perfil: e.target.value })}
                  disabled={criando}
                >
                  <option value="consultor">Consultor</option>
                  <option value="admin">Administrador</option>
                  <option value="cliente">Cliente</option>
                </select>
              </div>

              {form.perfil === 'consultor' && (
                <div>
                  <label className="inp-label">Especialidade</label>
                  <input
                    className="inp"
                    placeholder="Ex: Fiscal, Contábil, RH..."
                    value={form.especialidade}
                    onChange={e => setForm({ ...form, especialidade: e.target.value })}
                    disabled={criando}
                  />
                </div>
              )}

              <div style={{
                padding: '.6rem .75rem',
                background: 'var(--navy-lt)',
                borderRadius: 6,
                fontSize: '.8rem',
                color: 'var(--navy2)'
              }}>
                A senha inicial será <strong>123456</strong>. O usuário pode alterá-la após o primeiro acesso.
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={fecharModal} disabled={criando}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={criando}>
                  {criando ? 'Criando...' : 'Criar Acesso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}

export default AcessosPage;
