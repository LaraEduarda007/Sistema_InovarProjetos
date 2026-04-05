import express from 'express';
import {
  listarCobrancas,
  obterCobranca,
  criarCobranca,
  atualizarCobranca,
  responderCobranca,
  deletarCobranca
} from '../controllers/cobrancaController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.use(verifyToken);

router.get('/', listarCobrancas);
router.get('/:id', obterCobranca);
router.post('/', criarCobranca);
router.put('/:id/responder', responderCobranca);
router.put('/:id', atualizarCobranca);
router.delete('/:id', deletarCobranca);

export default router;
