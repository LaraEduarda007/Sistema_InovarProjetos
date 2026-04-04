import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { listarConsultores } from '../controllers/usuarioController.js';

const router = express.Router();

// GET /api/usuarios/consultores — lista consultores para o dropdown
router.get('/consultores', verifyToken, listarConsultores);

export default router;
