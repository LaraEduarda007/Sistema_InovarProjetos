import { runQuery, getQuery, allQuery } from '../database/connection.js';
import { v4 as uuidv4 } from 'uuid';

export async function listarAtividades(req, res) {
  try {
    const { projetoId } = req.query;
    const { perfil, id: usuarioId } = req.usuario;

    let sql = `
      SELECT a.*, u.nome as consultor_nome, r.id as relatorio_id
      FROM atividades a
      LEFT JOIN usuarios u ON a.consultor_id = u.id
      LEFT JOIN relatorios r ON a.id = r.atividade_id
    `;
    let params = [];

    if (projetoId) {
      sql += ' WHERE a.projeto_id = ?';
      params.push(projetoId);

      // Consultores veem apenas suas atividades
      if (perfil === 'consultor') {
        sql += ' AND a.consultor_id = ?';
        params.push(usuarioId);
      }
    }

    sql += ' ORDER BY a.mes, a.semana, a.titulo';

    const atividades = await allQuery(sql, params);
    res.json({ sucesso: true, atividades });
  } catch (error) {
    console.error('Erro ao listar atividades:', error);
    res.status(500).json({ erro: 'Erro ao listar atividades' });
  }
}

export async function criarAtividade(req, res) {
  try {
    const { projetoId, mes, semana, setor, titulo, observacao, consultorId, dataPrevista } = req.body;

    if (!projetoId || !mes || !semana || !setor || !titulo || !consultorId) {
      return res.status(400).json({ erro: 'Campos obrigatórios faltando' });
    }

    const atividadeId = uuidv4();

    await runQuery(`
      INSERT INTO atividades (id, projeto_id, mes, semana, setor, titulo, observacao, consultor_id, data_prevista)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [atividadeId, projetoId, mes, semana, setor, titulo, observacao, consultorId, dataPrevista]);

    res.status(201).json({
      sucesso: true,
      mensagem: 'Atividade criada com sucesso',
      atividadeId
    });
  } catch (error) {
    console.error('Erro ao criar atividade:', error);
    res.status(500).json({ erro: 'Erro ao criar atividade' });
  }
}

export async function atualizarAtividade(req, res) {
  try {
    const { id } = req.params;
    const { status, dataPrevista, dataRealizacao } = req.body;

    await runQuery(`
      UPDATE atividades 
      SET status = ?, data_prevista = ?, data_realizacao = ?, atualizado_em = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [status, dataPrevista, dataRealizacao, id]);

    res.json({ sucesso: true, mensagem: 'Atividade atualizada com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar atividade:', error);
    res.status(500).json({ erro: 'Erro ao atualizar atividade' });
  }
}

export async function obterAtividade(req, res) {
  try {
    const { id } = req.params;

    const atividade = await getQuery(`
      SELECT a.*, u.nome as consultor_nome, r.*
      FROM atividades a
      LEFT JOIN usuarios u ON a.consultor_id = u.id
      LEFT JOIN relatorios r ON a.id = r.atividade_id
      WHERE a.id = ?
    `, [id]);

    if (!atividade) {
      return res.status(404).json({ erro: 'Atividade não encontrada' });
    }

    res.json({ sucesso: true, atividade });
  } catch (error) {
    console.error('Erro ao obter atividade:', error);
    res.status(500).json({ erro: 'Erro ao obter atividade' });
  }
}

export async function deletarAtividade(req, res) {
  try {
    const { id } = req.params;

    // Deletar relatório associado
    await runQuery('DELETE FROM relatorios WHERE atividade_id = ?', [id]);
    // Deletar imagens associadas
    await runQuery('DELETE FROM imagens WHERE atividade_id = ? OR relatorio_id IN (SELECT id FROM relatorios WHERE atividade_id = ?)', [id, id]);
    // Deletar atividade
    await runQuery('DELETE FROM atividades WHERE id = ?', [id]);

    res.json({ sucesso: true, mensagem: 'Atividade deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar atividade:', error);
    res.status(500).json({ erro: 'Erro ao deletar atividade' });
  }
}
