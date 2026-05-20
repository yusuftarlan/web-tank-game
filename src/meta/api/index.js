// src/meta/api/index.js
import express from 'express';
import authRoutes from './authRoutes.js';
import roomRoutes from './roomRoutes.js';

const router = express.Router();

// Giriş işlemleri için
router.use('/auth', authRoutes);

// Oda işlemleri için (/api/rooms/... şeklinde çalışır)
router.use('/rooms', roomRoutes);

export default router;