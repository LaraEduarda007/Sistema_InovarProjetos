import express from 'express';
import { login, verificarToken } from '../controllers/authController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', login);
router.get('/verificar', verifyToken, verificarToken);

export default router;
