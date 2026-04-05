import { runQuery, getQuery, allQuery } from '../database/connection.js';
import { v4 as uuidv4 } from 'uuid';

// Listar resumos de um projeto
export async function listarResumos(req, res) {
  try {
    const { projetoId } = req.query;
    if (!projetoId) return res.status(400).json({ erro: 'projetoId é obrigatório' });

    const resumos = await allQuery(
      `SELECT * FROM semana_resumos WHERE projeto_id = ? ORDER BY mes, semana`,
      [projetoId]
    );
    res.json({ sucesso: true, resumos });
  } catch (error) {
    console.error('Erro ao listar resumos:', error);
    res.status(500).json({ erro: 'Erro ao listar resumos' });
  }
}

// Salvar ou atualizar resumo de semana (UPSERT)
export async function salvarResumo(req, res) {
  try {
    const { projetoId, mes, semana, resumo, pontosPositivos, pontosAtencao } = req.body;
    const { id: usuarioId } = req.usuario;

    if (!projetoId || !mes || !semana) {
      return res.status(400).json({ erro: 'projetoId, mes e semana são obrigatórios' });
    }

    // Verifica se já existe
    const existente = await getQuery(
      'SELECT id FROM semana_resumos WHERE projeto_id = ? AND mes = ? AND semana = ?',
      [projetoId, mes, semana]
    );

    if (existente) {
      await runQuery(
        `UPDATE semana_resumos
         SET resumo = ?, pontos_positivos = ?, pontos_atencao = ?, criado_em = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [resumo || null, pontosPositivos || null, pontosAtencao || null, existente.id]
      );
      return res.json({ sucesso: true, mensagem: 'Resumo atualizado', id: existente.id });
    }

    const id = uuidv4();
    await runQuery(
      `INSERT INTO semana_resumos (id, projeto_id, mes, semana, resumo, pontos_positivos, pontos_atencao, criado_por_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, projetoId, mes, semana, resumo || null, pontosPositivos || null, pontosAtencao || null, usuarioId]
    );

    res.status(201).json({ sucesso: true, mensagem: 'Resumo criado', id });
  } catch (error) {
    console.error('Erro ao salvar resumo:', error);
    res.status(500).json({ erro: 'Erro ao salvar resumo' });
  }
}
