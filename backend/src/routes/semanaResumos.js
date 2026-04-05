import express from 'express';
import { listarResumos, salvarResumo } from '../controllers/semanaResumoController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();
router.use(verifyToken);

router.get('/', listarResumos);
router.post('/', salvarResumo);

export default router;
