import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import {
  criarRelatorio,
  obterRelatorio,
  listarRelatorios
} from '../controllers/relatorioController.js';

const router = express.Router();

router.post('/', verifyToken, criarRelatorio);
router.get('/', verifyToken, listarRelatorios);
router.get('/:id', verifyToken, obterRelatorio);

export default router;
