import express from 'express';
import {
  listarCobrancas,
  obterCobranca,
  criarCobranca,
  atualizarCobranca,
  deletarCobranca
} from '../controllers/cobrancaController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Middleware de autenticação
router.use(verifyToken);

// Rotas
router.get('/', listarCobrancas);
router.get('/:id', obterCobranca);
router.post('/', criarCobranca);
router.put('/:id', atualizarCobranca);
router.delete('/:id', deletarCobranca);

export default router;
