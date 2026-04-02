import { runQuery, getQuery, allQuery } from '../database/connection.js';
import { v4 as uuidv4 } from 'uuid';

// Listar cobranças
export async function listarCobrancas(req, res) {
  try {
    const cobrancas = await allQuery('SELECT * FROM cobrancas ORDER BY enviada_em DESC');
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
    const cobranca = await getQuery('SELECT * FROM cobrancas WHERE id = ?', [id]);

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

    if (!consultorId || !prazo) {
      return res.status(400).json({ erro: 'Consultor e prazo são obrigatórios' });
    }

    const cobrancaId = uuidv4();

    await runQuery(
      'INSERT INTO cobrancas (id, admin_id, consultor_id, prazo, urgencia, mensagem, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [cobrancaId, 'admin-001', consultorId, prazo, urgencia || 'normal', mensagem, 'aberta']
    );

    await runQuery(`
  INSERT INTO notificacoes 
  (id, usuario_id, tipo, titulo, mensagem, referencia_id, lida)
  VALUES (?, ?, ?, ?, ?, ?, 0)
`, [
  uuidv4(),
  consultorId,
  'cobranca',
  'Nova cobrança recebida',
  mensagem || 'Você recebeu uma nova cobrança',
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

// Atualizar status da cobrança
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
