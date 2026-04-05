import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import {
  listarConsultores,
  listarTodos,
  listarConsultoresComMetricas,
  atualizarUsuario,
  criarUsuario,
  detalheConsultor
} from '../controllers/usuarioController.js';

const router = express.Router();

router.get('/consultores',          verifyToken, listarConsultores);
router.get('/consultores/metricas', verifyToken, listarConsultoresComMetricas);
router.get('/',                     verifyToken, listarTodos);
router.post('/',                    verifyToken, criarUsuario);
router.get('/:id/detalhes',         verifyToken, detalheConsultor);
router.put('/:id',                  verifyToken, atualizarUsuario);

export default router;
