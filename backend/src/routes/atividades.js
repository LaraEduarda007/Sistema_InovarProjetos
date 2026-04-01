import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import {
  listarAtividades,
  criarAtividade,
  atualizarAtividade,
  obterAtividade,
  deletarAtividade
} from '../controllers/atividadeController.js';

const router = express.Router();

router.get('/', verifyToken, listarAtividades);
router.get('/:id', verifyToken, obterAtividade);
router.post('/', verifyToken, criarAtividade);
router.put('/:id', verifyToken, atualizarAtividade);
router.delete('/:id', verifyToken, deletarAtividade);

export default router;
