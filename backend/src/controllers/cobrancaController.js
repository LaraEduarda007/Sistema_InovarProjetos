import { runQuery, getQuery, allQuery } from '../database/connection.js';
import { v4 as uuidv4 } from 'uuid';

// Listar cobranças (com nome do consultor)
export async function listarCobrancas(req, res) {
  try {
    const { perfil, id: usuarioId } = req.usuario;

    let sql = `
      SELECT c.*, u.nome as consultor_nome
      FROM cobrancas c
      LEFT JOIN usuarios u ON c.consultor_id = u.id
    `;
    const params = [];

    // Consultor vê só as suas
    if (perfil === 'consultor') {
      sql += ' WHERE c.consultor_id = ?';
      params.push(usuarioId);
    }

    sql += ' ORDER BY c.enviada_em DESC';

    const cobrancas = await allQuery(sql, params);
    res.json({ sucesso: true, cobrancas });
  } catch (error) {
    console.error('Erro ao listar cobranças:', error);
    res.status(500).json({ erro: 'Erro ao listar cobranças' });
  }
}

// Obter cobrança por ID
export async function obterCobranca(req, res) {
  try {
    const { id } = req.params;
    const cobranca = await getQuery(`
      SELECT c.*, u.nome as consultor_nome
      FROM cobrancas c
      LEFT JOIN usuarios u ON c.consultor_id = u.id
      WHERE c.id = ?
    `, [id]);

    if (!cobranca) {
      return res.status(404).json({ erro: 'Cobrança não encontrada' });
    }

    res.json({ sucesso: true, cobranca });
  } catch (error) {
    console.error('Erro ao obter cobrança:', error);
    res.status(500).json({ erro: 'Erro ao obter cobrança' });
  }
}

// Criar cobrança
export async function criarCobranca(req, res) {
  try {
    const { consultorId, atividadeIds, prazo, urgencia, mensagem } = req.body;

    if (!consultorId) {
      return res.status(400).json({ erro: 'Consultor é obrigatório' });
    }
    const prazoFinal = prazo || null;
    const ativIdsJson = atividadeIds && atividadeIds.length > 0
      ? JSON.stringify(atividadeIds)
      : null;

    const cobrancaId = uuidv4();

    await runQuery(
      'INSERT INTO cobrancas (id, admin_id, consultor_id, prazo, urgencia, mensagem, status, atividades_ids) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [cobrancaId, 'admin-001', consultorId, prazoFinal, urgencia || 'normal', mensagem, 'aberta', ativIdsJson]
    );

    await runQuery(`
      INSERT INTO notificacoes
      (id, usuario_id, tipo, titulo, mensagem, relacao_tipo, relacao_id, lida)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0)
    `, [
      uuidv4(),
      consultorId,
      'cobranca',
      'Nova cobrança recebida',
      mensagem || 'Você recebeu uma nova cobrança',
      'cobranca',
      cobrancaId
    ]);

    res.status(201).json({
      sucesso: true,
      mensagem: 'Cobrança criada com sucesso',
      cobrancaId
    });
  } catch (error) {
    console.error('Erro ao criar cobrança:', error.message);
    res.status(500).json({ erro: 'Erro ao criar cobrança' });
  }
}

// Consultor responde cobrança (apenas uma vez)
export async function responderCobranca(req, res) {
  try {
    const { id } = req.params;
    const { resposta } = req.body;
    const { id: usuarioId, perfil } = req.usuario;

    if (!resposta || !resposta.trim()) {
      return res.status(400).json({ erro: 'Resposta não pode estar vazia' });
    }

    const cobranca = await getQuery('SELECT * FROM cobrancas WHERE id = ?', [id]);
    if (!cobranca) {
      return res.status(404).json({ erro: 'Cobrança não encontrada' });
    }

    // Apenas o consultor destinatário pode responder
    if (perfil === 'consultor' && cobranca.consultor_id !== usuarioId) {
      return res.status(403).json({ erro: 'Sem permissão para responder esta cobrança' });
    }

    // Apenas uma resposta por cobrança
    if (cobranca.resposta) {
      return res.status(400).json({ erro: 'Esta cobrança já foi respondida' });
    }

    await runQuery(
      `UPDATE cobrancas SET resposta = ?, respondida_em = CURRENT_TIMESTAMP, status = 'respondida' WHERE id = ?`,
      [resposta.trim(), id]
    );

    res.json({ sucesso: true, mensagem: 'Resposta enviada com sucesso' });
  } catch (error) {
    console.error('Erro ao responder cobrança:', error);
    res.status(500).json({ erro: 'Erro ao responder cobrança' });
  }
}

// Atualizar status da cobrança (admin)
export async function atualizarCobranca(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['aberta', 'respondida', 'resolvida'].includes(status)) {
      return res.status(400).json({ erro: 'Status inválido' });
    }

    await runQuery(
      'UPDATE cobrancas SET status = ? WHERE id = ?',
      [status, id]
    );

    res.json({ sucesso: true, mensagem: 'Cobrança atualizada com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar cobrança:', error);
    res.status(500).json({ erro: 'Erro ao atualizar cobrança' });
  }
}

// Deletar cobrança
export async function deletarCobranca(req, res) {
  try {
    const { id } = req.params;
    await runQuery('DELETE FROM cobrancas WHERE id = ?', [id]);
    res.json({ sucesso: true, mensagem: 'Cobrança deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar cobrança:', error);
    res.status(500).json({ erro: 'Erro ao deletar cobrança' });
  }
}
