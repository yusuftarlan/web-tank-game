// src/meta/api/roomRoutes.js
import express from 'express';
import { rooms, activeSessions } from '../../data/store.js';

const router = express.Router();

// 1. YENİ ODA OLUŞTUR
router.post('/', (req, res) => {
    const { roomName, maxPlayers } = req.body;
    const token = req.headers.authorization?.split(' ')[1];

    if (!token || !activeSessions.has(token)) {
        return res.status(401).json({ error: 'Yetkisiz erişim.' });
    }

    const session = activeSessions.get(token);
    const roomId = 'room_' + Math.random().toString(36).substr(2, 9);

    rooms.set(roomId, {
        id: roomId,
        name: roomName || 'İsimsiz Cephe',
        maxPlayers: parseInt(maxPlayers) || 4,
        host: session.username,
        status: 'waiting', // YENİ: Oyunun durumunu tutuyoruz
        clients: new Set(),
        gameState: null,
        gameInterval: null
    });

    session.currentRoom = roomId;
    res.json({ success: true, roomId: roomId });
});

// 2. AKTİF ODALARI LİSTELE
router.get('/', (req, res) => {
    const roomList = [];
    
    rooms.forEach((room, roomId) => {
        if (roomId === 'test-room') return;
        // YENİ: Sadece "bekleyen" (savaş başlamamış) odaları listede göster
        if (room.status !== 'waiting') return;

        let currentPlayers = 0;
        activeSessions.forEach(session => {
            if (session.currentRoom === roomId) currentPlayers++;
        });
        
        roomList.push({
            id: roomId,
            name: room.name,
            host: room.host,
            currentPlayers: currentPlayers,
            maxPlayers: room.maxPlayers
        });
    });

    res.json({ rooms: roomList });
});

// 3. ODAYA KATIL
router.post('/:id/join', (req, res) => {
    const roomId = req.params.id;
    const token = req.headers.authorization?.split(' ')[1];

    if (!token || !activeSessions.has(token)) return res.status(401).json({ error: 'Yetkisiz.' });
    if (!rooms.has(roomId)) return res.status(404).json({ error: 'Oda bulunamadı.' });

    const room = rooms.get(roomId);
    if (room.status !== 'waiting') return res.status(400).json({ error: 'Savaş çoktan başlamış!' });

    let currentPlayers = 0;
    activeSessions.forEach(s => { if (s.currentRoom === roomId) currentPlayers++; });

    if (currentPlayers >= room.maxPlayers) return res.status(400).json({ error: 'Oda tam kapasite dolu!' });

    const session = activeSessions.get(token);
    session.currentRoom = roomId;

    res.json({ success: true, roomId: roomId });
});

// 4. BEKLEME ODASI BİLGİLERİNİ GETİR (YENİ EKLENDİ)
router.get('/:id', (req, res) => {
    const roomId = req.params.id;
    
    if (!rooms.has(roomId)) return res.status(404).json({ error: 'Oda bulunamadı.' });

    const room = rooms.get(roomId);
    const players = [];
    
    // Odaya katılmış oyuncuları bul
    activeSessions.forEach(session => {
        if (session.currentRoom === roomId) players.push(session.username);
    });

    res.json({
        id: room.id,
        name: room.name,
        host: room.host,
        maxPlayers: room.maxPlayers,
        status: room.status,
        players: players
    });
});

// 5. OYUNU BAŞLAT (YENİ EKLENDİ)
router.post('/:id/start', (req, res) => {
    const roomId = req.params.id;
    const token = req.headers.authorization?.split(' ')[1];

    if (!token || !activeSessions.has(token)) return res.status(401).json({error: 'Yetkisiz'});
    
    const session = activeSessions.get(token);
    const room = rooms.get(roomId);
    
    if (!room) return res.status(404).json({error: 'Oda yok'});
    if (room.host !== session.username) return res.status(403).json({error: 'Sadece kurucu başlatabilir'});

    room.status = 'playing'; // Odanın durumunu savaşa çevir
    res.json({success: true});
});

export default router;