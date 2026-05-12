import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { activeSessions, activeUsernames } from '../../data/store.js';

const router = express.Router();

router.post('/login', (req, res) => {
    const { username } = req.body;

    if (!username || username.trim() === '') {
        return res.status(400).json({ success: false, message: "Kullanici adi bos olamaz." });
    }

    const cleanUsername = username.trim();

    if (activeUsernames.has(cleanUsername)) {
        return res.status(409).json({ success: false, message: "Bu kullanici adi su an oyunda!" });
    }

    const token = uuidv4();

    activeUsernames.add(cleanUsername);
    activeSessions.set(token, {
        username: cleanUsername,
        joinedAt: Date.now(),
        currentRoom: null
    });

    res.status(200).json({
        success: true,
        message: "Giris basarili.",
        token,
        username: cleanUsername,
        redirectTo: "/main-menu"
    });
});

export default router;
