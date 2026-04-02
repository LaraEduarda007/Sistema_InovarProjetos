import { runQuery, getQuery, allQuery } from '../database/connection.js';
import { v4 as uuidv4 } from 'uuid';

// Listar notificações do usuário
export async function listarNotificacoes(req, res) {
  try {
    const { id: usuarioId } = req.usuario;

    const notificacoes = await allQuery(`
      SELECT * FROM notificacoes
      WHERE usuario_id = ?
      ORDER BY criada_em DESC
    `, [usuarioId]);

    res.json({ sucesso: true, notificacoes });
  } catch (error) {
    console.error('Erro ao listar notificações:', error);
    res.status(500).json({ erro: 'Erro ao listar notificações' });
  }
}

// Obter notificação por ID
export async function obterNotificacao(req, res) {
  try {
    const { id } = req.params;

    const notificacao = await getQuery(
      'SELECT * FROM notificacoes WHERE id = ?',
      [id]
    );

    if (!notificacao) {
      return res.status(404).json({ erro: 'Notificação não encontrada' });
    }

    // Marcar como lida
    await runQuery(
  'UPDATE notificacoes SET lida = 1 WHERE id = ?',
  [id]
);

    res.json({ sucesso: true, notificacao: { ...notificacao, lida: 1 } });
  } catch (error) {
    console.error('Erro ao obter notificação:', error);
    res.status(500).json({ erro: 'Erro ao obter notificação' });
  }
}

// Criar notificação
export async function criarNotificacao(req, res) {
  try {
    const { usuarioId, tipo, titulo, mensagem, relacao_tipo, relacao_id } = req.body;

    if (!usuarioId || !tipo || !titulo || !mensagem) {
      return res.status(400).json({ erro: 'Campos obrigatórios faltando' });
    }

    const notificacaoId = uuidv4();

    await runQuery(`
      INSERT INTO notificacoes (id, usuario_id, tipo, titulo, mensagem, relacao_tipo, relacao_id, lida)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0)
    `, [notificacaoId, usuarioId, tipo, titulo, mensagem, relacao_tipo, relacao_id]);

    res.status(201).json({
      sucesso: true,
      mensagem: 'Notificação criada com sucesso',
      notificacaoId
    });
  } catch (error) {
    console.error('Erro ao criar notificação:', error);
    res.status(500).json({ erro: 'Erro ao criar notificação' });
  }
}

// Marcar notificação como lida
export async function marcarComoLida(req, res) {
  try {
    const { id } = req.params;

    await runQuery(
      'UPDATE notificacoes SET lida = 1, data_leitura = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );

    res.json({ sucesso: true, mensagem: 'Notificação marcada como lida' });
  } catch (error) {
    console.error('Erro ao marcar notificação:', error);
    res.status(500).json({ erro: 'Erro ao marcar notificação' });
  }
}

// Marcar todas como lidas
export async function marcarTodasComoLidas(req, res) {
  try {
    const { id: usuarioId } = req.usuario;

    await runQuery(
  'UPDATE notificacoes SET lida = 1 WHERE usuario_id = ? AND lida = 0',
  [usuarioId]
);

    res.json({ sucesso: true, mensagem: 'Todas as notificações foram marcadas como lidas' });
  } catch (error) {
    console.error('Erro ao marcar notificações:', error);
    res.status(500).json({ erro: 'Erro ao marcar notificações' });
  }
}

// Deletar notificação
export async function deletarNotificacao(req, res) {
  try {
    const { id } = req.params;

    await runQuery('DELETE FROM notificacoes WHERE id = ?', [id]);

    res.json({ sucesso: true, mensagem: 'Notificação deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar notificação:', error);
    res.status(500).json({ erro: 'Erro ao deletar notificação' });
  }
}
