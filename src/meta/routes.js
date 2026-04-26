// src/meta/routes.js
import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { activeSessions, activeUsernames, rooms } from '../data/store.js';

const router = express.Router();

// ==========================================
// 1. GİRİŞ API (Login) - Önceki yazdığımız kısım
// ==========================================
router.post('/login', (req, res) => {
    const { username } = req.body;

    if (!username || username.trim() === '') {
        return res.status(400).json({ success: false, message: "Kullanıcı adı boş olamaz." });
    }

    const cleanUsername = username.trim();

    if (activeUsernames.has(cleanUsername)) {
        return res.status(409).json({ success: false, message: "Bu kullanıcı adı şu an oyunda!" });
    }

    const token = uuidv4();
    
    activeUsernames.add(cleanUsername);
    activeSessions.set(token, { username: cleanUsername, joinedAt: Date.now() });

    res.status(200).json({ success: true, token, username: cleanUsername });
});

// ==========================================
// 2. ODA OLUŞTURMA API
// ==========================================
router.post('/room/create', (req, res) => {
    // İstemciden token, oda adı ve maksimum oyuncu sayısını alıyoruz
    const { token, roomName, maxPlayers } = req.body;

    // 1. Yetki Kontrolü (Elindeki bilet RAM'de var mı?)
    if (!token || !activeSessions.has(token)) {
        return res.status(401).json({ success: false, message: "Yetkisiz işlem. Lütfen önce giriş yapın." });
    }

    // Kullanıcının kim olduğunu token üzerinden RAM'den buluyoruz
    const user = activeSessions.get(token);
    
    // 2. Oda verisini hazırla
    const roomId = `room_${uuidv4().substring(0, 8)}`; // room_1a2b3c4d gibi kısa bir ID
    const newRoom = {
        roomId: roomId,
        roomName: roomName || `${user.username}'in Savaşı`, // İsim girilmezse varsayılan
        maxPlayers: maxPlayers || 4,
        players: [user.username], // Kurucu otomatik olarak ilk oyuncudur
        gameMaster: user.username, // Odayı başlatan yetkili
        status: "waiting", // Oyun henüz başlamadı
        createdAt: Date.now()
    };

    // 3. Odayı RAM'e kaydet
    rooms.set(roomId, newRoom);

    res.status(200).json({ 
        success: true, 
        message: "Oda başarıyla oluşturuldu.",
        roomId: roomId,
        room: newRoom 
    });
});

// ==========================================
// 3. ODALARI LİSTELEME API
// ==========================================
router.get('/rooms', (req, res) => {
    const availableRooms = [];

    // RAM'deki tüm odaları dolaş (O(N) karmaşıklığı)
    for (const [id, room] of rooms.entries()) {
        // Sadece 'bekleyen' (oyunu başlamamış) odaları listeye ekle
        if (room.status === "waiting") {
            availableRooms.push({
                roomId: room.roomId,
                roomName: room.roomName,
                currentPlayers: room.players.length,
                maxPlayers: room.maxPlayers,
                gameMaster: room.gameMaster
            });
        }
    }

    // Listeyi istemciye gönder
    res.status(200).json({ success: true, activeRooms: availableRooms });
});

export default router;