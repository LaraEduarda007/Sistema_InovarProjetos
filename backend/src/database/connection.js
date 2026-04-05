import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, '../../data/inovar.db');

export const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Erro ao conectar banco de dados:', err);
  } else {
    console.log('✅ Conectado ao banco de dados SQLite');
  }
});

// Desabilitar foreign keys para evitar constraint errors
db.run('PRAGMA foreign_keys = OFF');

// Migrações: adiciona colunas novas em tabelas existentes (ignora erro se já existir)
const migracoes = [
  `ALTER TABLE relatorios ADD COLUMN avaliacao_equipe INTEGER`,
  `ALTER TABLE relatorios ADD COLUMN observacoes TEXT`,
  `ALTER TABLE projetos ADD COLUMN objetivo TEXT`,
  `ALTER TABLE cobrancas ADD COLUMN resposta TEXT`,
  `ALTER TABLE cobrancas ADD COLUMN respondida_em DATETIME`,
  `ALTER TABLE cobrancas ADD COLUMN atividades_ids TEXT`,
  `CREATE TABLE IF NOT EXISTS semana_resumos (
    id TEXT PRIMARY KEY,
    projeto_id TEXT NOT NULL,
    mes INTEGER NOT NULL,
    semana INTEGER NOT NULL,
    resumo TEXT,
    pontos_positivos TEXT,
    pontos_atencao TEXT,
    criado_por_id TEXT,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(projeto_id, mes, semana)
  )`,
];
migracoes.forEach(sql => {
  db.run(sql, () => {}); // ignora erro se coluna já existe
});

// Migração: remove CHECK constraint da tabela atividades
// SQLite não permite DROP CONSTRAINT, então recriamos a tabela sem o constraint
db.serialize(() => {
  // Verifica se o constraint problemático existe
  db.get(
    `SELECT sql FROM sqlite_master WHERE type='table' AND name='atividades'`,
    (err, row) => {
      if (err || !row) return;
      // Se o CREATE TABLE contiver CHECK, recria sem ele
      if (row.sql && row.sql.includes('CHECK')) {
        db.run('BEGIN TRANSACTION', () => {
          db.run(`CREATE TABLE IF NOT EXISTS atividades_new (
            id TEXT PRIMARY KEY,
            projeto_id TEXT NOT NULL,
            mes INTEGER NOT NULL,
            semana INTEGER NOT NULL,
            setor TEXT NOT NULL,
            titulo TEXT NOT NULL,
            observacao TEXT,
            consultor_id TEXT,
            data_prevista DATE,
            data_realizacao DATE,
            status TEXT DEFAULT 'a-fazer',
            criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
            atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP
          )`, (err2) => {
            if (err2) { db.run('ROLLBACK'); return; }
            db.run(`INSERT OR IGNORE INTO atividades_new SELECT * FROM atividades`, (err3) => {
              if (err3) { db.run('ROLLBACK'); return; }
              db.run(`DROP TABLE atividades`, (err4) => {
                if (err4) { db.run('ROLLBACK'); return; }
                db.run(`ALTER TABLE atividades_new RENAME TO atividades`, (err5) => {
                  if (err5) { db.run('ROLLBACK'); return; }
                  db.run('COMMIT');
                  console.log('✅ Migração: CHECK constraint removido da tabela atividades');
                });
              });
            });
          });
        });
      }
    }
  );
});

// Migração: corrige dados corrompidos pela migração posicional anterior
// A migration anterior usou SELECT * posicional com tabela de colunas em ordem diferente,
// causando: consultor_id←status, data_prevista←consultor_id, status←data_realizacao
db.serialize(() => {
  db.run(`
    UPDATE atividades
    SET
      consultor_id    = data_prevista,
      status          = CASE consultor_id
                          WHEN 'a_fazer'       THEN 'a-fazer'
                          WHEN 'em_andamento'  THEN 'em-andamento'
                          WHEN 'nao_realizado' THEN 'nao-realizado'
                          ELSE consultor_id
                        END,
      data_prevista   = data_realizacao,
      data_realizacao = status
    WHERE consultor_id IN (
      'concluido','a_fazer','em_andamento','nao_realizado',
      'a-fazer','em-andamento','nao-realizado'
    )
  `, (err) => {
    if (err) {
      console.error('Erro na migração de correção de atividades:', err);
    } else {
      console.log('✅ Migração: dados de atividades verificados/corrigidos');
    }
  });
});

export function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

export function getQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

export function allQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}
