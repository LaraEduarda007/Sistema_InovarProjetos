import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { db } from './database/connection.js';

// Importar rotas
import authRoutes from './routes/auth.js';
import projetosRoutes from './routes/projetos.js';
import atividadesRoutes from './routes/atividades.js';
import relatoriosRoutes from './routes/relatorios.js';
import cobrancasRoutes from './routes/cobrancas.js';
import notificacoesRoutes from './routes/notificacoes.js';
import usuariosRoutes from './routes/usuarios.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: '✅ Backend rodando', timestamp: new Date().toISOString() });
});

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/projetos', projetosRoutes);
app.use('/api/atividades', atividadesRoutes);
app.use('/api/relatorios', relatoriosRoutes);
app.use('/api/cobrancas', cobrancasRoutes);
app.use('/api/notificacoes', notificacoesRoutes);
app.use('/api/usuarios', usuariosRoutes);

// Tratamento de erros 404
app.use((req, res) => {
  res.status(404).json({ erro: 'Rota não encontrada' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`\n🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`\n📚 Documentação das APIs:`);
  console.log(`  POST   /api/auth/login           - Fazer login`);
  console.log(`  GET    /api/projetos             - Listar projetos`);
  console.log(`  GET    /api/atividades           - Listar atividades`);
  console.log(`  GET    /api/relatorios           - Listar relatórios`);
  console.log(`  GET    /api/cobrancas            - Listar cobranças`);
  console.log(`  GET    /api/notificacoes         - Listar notificações\n`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Fechando servidor...');
  db.close();
  process.exit(0);
});
