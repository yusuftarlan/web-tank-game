// src/meta/api/roomRoutes.js
import express from 'express';
import { rooms, activeSessions } from '../../data/store.js';

const router = express.Router();

function createGameId() {
    return 'game_' + Math.random().toString(36).substr(2, 9);
}

// 1. Yeni oda olustur
router.post('/', (req, res) => {
    const { roomName, maxPlayers } = req.body;
    const token = req.headers.authorization?.split(' ')[1];

    if (!token || !activeSessions.has(token)) {
        return res.status(401).json({ error: 'Yetkisiz erisim.' });
    }

    const session = activeSessions.get(token);
    const roomId = 'room_' + Math.random().toString(36).substr(2, 9);

    rooms.set(roomId, {
        id: roomId,
        name: roomName || 'Isimsiz Cephe',
        maxPlayers: parseInt(maxPlayers) || 4,
        host: session.username,
        players: [session.username],
        status: 'waiting',
        gameId: null,
        startedAt: null,
        clients: new Set(),
        gameState: null,
        gameInterval: null
    });

    session.currentRoom = roomId;
    res.json({ success: true, roomId: roomId });
});

// 2. Aktif odalari listele
router.get('/', (req, res) => {
    const roomList = [];

    rooms.forEach((room, roomId) => {
        if (roomId === 'test-room') return;
        if (room.status !== 'waiting') return;

        roomList.push({
            id: roomId,
            name: room.name,
            host: room.host,
            currentPlayers: room.players.length,
            maxPlayers: room.maxPlayers
        });
    });

    res.json({ rooms: roomList });
});

// 3. Odaya katil
router.post('/:id/join', (req, res) => {
    const roomId = req.params.id;
    const token = req.headers.authorization?.split(' ')[1];

    if (!token || !activeSessions.has(token)) return res.status(401).json({ error: 'Yetkisiz.' });
    if (!rooms.has(roomId)) return res.status(404).json({ error: 'Oda bulunamadi.' });

    const room = rooms.get(roomId);
    if (room.status !== 'waiting') return res.status(400).json({ error: 'Savas coktan baslamis!' });

    const session = activeSessions.get(token);

    if (!room.players.includes(session.username) && room.players.length >= room.maxPlayers) {
        return res.status(400).json({ error: 'Oda tam kapasite dolu!' });
    }

    if (!room.players.includes(session.username)) {
        room.players.push(session.username);
    }

    session.currentRoom = roomId;

    res.json({ success: true, roomId: roomId });
});

// 4. Odadan ayril
router.post('/:id/leave', (req, res) => {
    const roomId = req.params.id;
    const token = req.headers.authorization?.split(' ')[1];

    if (!token || !activeSessions.has(token)) return res.status(401).json({ error: 'Yetkisiz.' });

    const session = activeSessions.get(token);

    if (!rooms.has(roomId)) {
        if (session.currentRoom === roomId) {
            session.currentRoom = null;
        }

        return res.json({ success: true, roomDeleted: true });
    }

    const room = rooms.get(roomId);
    room.players = room.players.filter(player => player !== session.username);

    if (session.currentRoom === roomId) {
        session.currentRoom = null;
    }

    if (room.players.length === 0) {
        rooms.delete(roomId);
        return res.json({ success: true, roomDeleted: true });
    }

    if (room.host === session.username) {
        room.host = room.players[0];
    }

    res.json({
        success: true,
        roomDeleted: false,
        host: room.host,
        players: room.players
    });
});

// 5. Bekleme odasi bilgilerini getir
router.get('/:id', (req, res) => {
    const roomId = req.params.id;

    if (!rooms.has(roomId)) return res.status(404).json({ error: 'Oda bulunamadi.' });

    const room = rooms.get(roomId);

    res.json({
        id: room.id,
        name: room.name,
        host: room.host,
        maxPlayers: room.maxPlayers,
        status: room.status,
        players: room.players,
        gameId: room.gameId || null
    });
});

// 6. Oyunu baslat
router.post('/:id/start', (req, res) => {
    const roomId = req.params.id;
    const token = req.headers.authorization?.split(' ')[1];

    if (!token || !activeSessions.has(token)) return res.status(401).json({ error: 'Yetkisiz' });

    const session = activeSessions.get(token);
    const room = rooms.get(roomId);

    if (!room) return res.status(404).json({ error: 'Oda yok' });
    if (room.host !== session.username) return res.status(403).json({ error: 'Sadece kurucu baslatabilir' });

    if (room.status === 'playing' && room.gameId) {
        return res.json({ success: true, roomId: room.id, gameId: room.gameId });
    }

    room.gameId = createGameId();
    room.startedAt = Date.now();
    room.status = 'playing';

    res.json({ success: true, roomId: room.id, gameId: room.gameId });
});

export default router;
