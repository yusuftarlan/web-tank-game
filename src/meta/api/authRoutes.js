// src/meta/api/authRoutes.js
import express from 'express';
import { activeSessions, activeUsernames } from '../../data/store.js';

const router = express.Router();

// Giriş yapma (Login) POST isteği
router.post('/login', (req, res) => {
    try {
        const { username } = req.body;

        if (!username || username.trim() === '') {
            return res.status(400).json({ success: false, message: 'Komutan adı boş olamaz!' });
        }

        const cleanUsername = username.trim();

        // Aynı isimle giriş yapılmasını engelle
        if (activeUsernames.has(cleanUsername)) {
            return res.status(400).json({ success: false, message: 'Bu isimde bir komutan şu an zaten oyunda!' });
        }

        // Yeni oyuncu için benzersiz bir oturum anahtarı (token) oluştur
        const token = 'cmd_' + Math.random().toString(36).substr(2, 10);

        // Kullanıcıyı aktif listelere ekle
        activeUsernames.add(cleanUsername);
        activeSessions.set(token, {
            username: cleanUsername,
            currentRoom: null
        });

        console.log(`[SİSTEM] Komutan ${cleanUsername} karargâha giriş yaptı.`);

        // Başarılı yanıt dön
        res.json({ success: true, token: token, username: cleanUsername });
    } catch (error) {
        console.error('[HATA] Giriş işlemi sırasında sunucu hatası:', error);
        res.status(500).json({ success: false, message: 'Sunucu tarafında bir hata oluştu.' });
    }
});

export default router;