import express from 'express';
import {
  listarNotificacoes,
  obterNotificacao,
  criarNotificacao,
  marcarComoLida,
  marcarTodasComoLidas,
  deletarNotificacao
} from '../controllers/notificacaoController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Middleware de autenticação
router.use(verifyToken);

// Rotas
router.get('/', listarNotificacoes);
router.get('/:id', obterNotificacao);
router.post('/', criarNotificacao);
router.put('/:id/lida', marcarComoLida);
router.put('/marcar-todas-como-lidas', marcarTodasComoLidas);
router.delete('/:id', deletarNotificacao);

export default router;
