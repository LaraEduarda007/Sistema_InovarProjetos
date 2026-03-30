import express from 'express';
import { verifyToken, verificarPerfil } from '../middleware/auth.js';
import {
  listarProjetos,
  obterProjeto,
  criarProjeto,
  atualizarProjeto,
  deletarProjeto
} from '../controllers/projetoController.js';

const router = express.Router();

router.get('/', verifyToken, listarProjetos);
router.get('/:id', verifyToken, obterProjeto);
router.post('/', verifyToken, verificarPerfil(['admin']), criarProjeto);
router.put('/:id', verifyToken, verificarPerfil(['admin']), atualizarProjeto);
router.delete('/:id', verifyToken, verificarPerfil(['admin']), deletarProjeto);

export default router;
