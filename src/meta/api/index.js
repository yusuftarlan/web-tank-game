import express from 'express';
import authRoutes from './authRoutes.js';
import roomRoutes from './roomRoutes.js';

const router = express.Router();

router.use(authRoutes);
router.use(roomRoutes);

export default router;
