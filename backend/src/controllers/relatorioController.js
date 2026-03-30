import { runQuery, getQuery, allQuery } from '../database/connection.js';
import { v4 as uuidv4 } from 'uuid';

export async function criarRelatorio(req, res) {
  try {
    const { atividadeId, oQueFoiRealizado, dificuldades, proximosPassos, avaliacaoEquipe, observacoes, imagens } = req.body;
    const { id: consultorId } = req.usuario;

    if (!atividadeId || !oQueFoiRealizado) {
      return res.status(400).json({ erro: 'Campos obrigatórios faltando' });
    }

    const relatorioId = uuidv4();

    await runQuery(`
      INSERT INTO relatorios (id, atividade_id, o_que_foi_realizado, dificuldades, proximos_passos, avaliacao_equipe, observacoes, consultor_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      relatorioId,
      atividadeId,
      oQueFoiRealizado,
      dificuldades,
      proximosPassos,
      avaliacaoEquipe,
      observacoes,
      consultorId
    ]);

    // Adicionar imagens se houver
    if (Array.isArray(imagens) && imagens.length > 0) {
      for (const imagem of imagens) {
        const imagemId = uuidv4();
        await runQuery(`
          INSERT INTO imagens (id, relatorio_id, dados_base64, nome_original, tipo_mime)
          VALUES (?, ?, ?, ?, ?)
        `, [imagemId, relatorioId, imagem.dados, imagem.nome, imagem.tipo]);
      }
    }

    // Marcar atividade como concluída
    await runQuery(`
      UPDATE atividades 
      SET status = 'concluido', data_realizacao = CURRENT_TIMESTAMP, atualizado_em = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [atividadeId]);

    res.status(201).json({
      sucesso: true,
      mensagem: 'Relatório criado com sucesso',
      relatorioId
    });
  } catch (error) {
    console.error('Erro ao criar relatório:', error);
    res.status(500).json({ erro: 'Erro ao criar relatório' });
  }
}

export async function obterRelatorio(req, res) {
  try {
    const { id } = req.params;

    const relatorio = await getQuery(
      'SELECT * FROM relatorios WHERE id = ?',
      [id]
    );

    if (!relatorio) {
      return res.status(404).json({ erro: 'Relatório não encontrado' });
    }

    // Obter imagens do relatório
    const imagens = await allQuery(
      'SELECT id, nome_original, tipo_mime FROM imagens WHERE relatorio_id = ?',
      [id]
    );

    res.json({
      sucesso: true,
      relatorio: { ...relatorio, imagens }
    });
  } catch (error) {
    console.error('Erro ao obter relatório:', error);
    res.status(500).json({ erro: 'Erro ao obter relatório' });
  }
}

export async function listarRelatorios(req, res) {
  try {
    const { projetoId } = req.query;
    const { id: usuarioId, perfil } = req.usuario;

    let sql = `
      SELECT r.*, a.titulo as atividade_titulo, a.mes, a.semana, p.nome as projeto_nome, u.nome as consultor_nome
      FROM relatorios r
      JOIN atividades a ON r.atividade_id = a.id
      JOIN projetos p ON a.projeto_id = p.id
      JOIN usuarios u ON r.consultor_id = u.id
    `;
    let params = [];

    if (projetoId) {
      sql += ' WHERE a.projeto_id = ?';
      params.push(projetoId);
    }

    // Consultores veem apenas seus relatórios
    if (perfil === 'consultor') {
      sql += (sql.includes('WHERE') ? ' AND' : ' WHERE') + ' r.consultor_id = ?';
      params.push(usuarioId);
    }

    sql += ' ORDER BY r.enviado_em DESC';

    const relatorios = await allQuery(sql, params);
    res.json({ sucesso: true, relatorios });
  } catch (error) {
    console.error('Erro ao listar relatórios:', error);
    res.status(500).json({ erro: 'Erro ao listar relatórios' });
  }
}
