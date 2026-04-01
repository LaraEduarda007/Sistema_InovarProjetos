import { runQuery, getQuery, allQuery } from '../database/connection.js';
import { v4 as uuidv4 } from 'uuid';

// Listar cobranças
export async function listarCobrancas(req, res) {
  try {
    const { perfil, id: usuarioId } = req.usuario;

    let sql = `
      SELECT c.*, u.nome as admin_nome, cons.nome as consultor_nome
      FROM cobrancas c
      JOIN usuarios u ON c.admin_id = u.id
      JOIN usuarios cons ON c.consultor_id = cons.id
    `;
    let params = [];

    // Consultores veem apenas suas cobranças
    if (perfil === 'consultor') {
      sql += ' WHERE c.consultor_id = ?';
      params.push(usuarioId);
    }

    sql += ' ORDER BY c.data_criacao DESC';

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

    const cobranca = await getQuery(
      `SELECT c.*, u.nome as admin_nome, cons.nome as consultor_nome
       FROM cobrancas c
       JOIN usuarios u ON c.admin_id = u.id
       JOIN usuarios cons ON c.consultor_id = cons.id
       WHERE c.id = ?`,
      [id]
    );

    if (!cobranca) {
      return res.status(404).json({ erro: 'Cobrança não encontrada' });
    }

    // Obter atividades cobradas
    const atividades = await allQuery(
      `SELECT a.id, a.titulo, a.mes, a.semana, a.setor
       FROM cobranca_atividade ca
       JOIN atividades a ON ca.atividade_id = a.id
       WHERE ca.cobranca_id = ?`,
      [id]
    );

    res.json({ sucesso: true, cobranca: { ...cobranca, atividades } });
  } catch (error) {
    console.error('Erro ao obter cobrança:', error);
    res.status(500).json({ erro: 'Erro ao obter cobrança' });
  }
}

// Criar cobrança
export async function criarCobranca(req, res) {
  try {
    const { consultorId, atividadeIds, prazo, urgencia, mensagem } = req.body;
    const { id: adminId } = req.usuario;

    if (!consultorId || !Array.isArray(atividadeIds) || atividadeIds.length === 0) {
      return res.status(400).json({ erro: 'Campos obrigatórios faltando' });
    }

    const cobrancaId = uuidv4();

    await runQuery(`
      INSERT INTO cobrancas (id, admin_id, consultor_id, prazo, urgencia, mensagem, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [cobrancaId, adminId, consultorId, prazo, urgencia || 'normal', mensagem, 'aberta']);

    // Adicionar atividades à cobrança
    for (const atividadeId of atividadeIds) {
      await runQuery(`
        INSERT INTO cobranca_atividade (cobranca_id, atividade_id)
        VALUES (?, ?)
      `, [cobrancaId, atividadeId]);
    }

    res.status(201).json({
      sucesso: true,
      mensagem: 'Cobrança criada com sucesso',
      cobrancaId
    });
  } catch (error) {
    console.error('Erro ao criar cobrança:', error);
    res.status(500).json({ erro: 'Erro ao criar cobrança' });
  }
}

// Atualizar status da cobrança
export async function atualizarCobranca(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['aberta', 'respondida', 'resolvida'].includes(status)) {
      return res.status(400).json({ erro: 'Status inválido' });
    }

    await runQuery(
      'UPDATE cobrancas SET status = ?, data_atualizacao = CURRENT_TIMESTAMP WHERE id = ?',
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

    // Deletar atividades associadas
    await runQuery('DELETE FROM cobranca_atividade WHERE cobranca_id = ?', [id]);
    
    // Deletar cobrança
    await runQuery('DELETE FROM cobrancas WHERE id = ?', [id]);

    res.json({ sucesso: true, mensagem: 'Cobrança deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar cobrança:', error);
    res.status(500).json({ erro: 'Erro ao deletar cobrança' });
  }
}
