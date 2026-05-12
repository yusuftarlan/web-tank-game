import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { activeSessions, rooms } from '../../data/store.js';

const router = express.Router();

router.post('/room/create', (req, res) => {
    const { token, roomName, maxPlayers } = req.body;

    if (!token || !activeSessions.has(token)) {
        return res.status(401).json({ success: false, message: "Yetkisiz islem. Lutfen once giris yapin." });
    }

    const user = activeSessions.get(token);
    const roomId = `room_${uuidv4().substring(0, 8)}`;
    const newRoom = {
        roomId,
        roomName: roomName || `${user.username}'in Savasi`,
        maxPlayers: maxPlayers || 4,
        players: [user.username],
        gameMaster: user.username,
        status: "waiting",
        createdAt: Date.now()
    };

    rooms.set(roomId, newRoom);
    user.currentRoom = roomId;

    res.status(200).json({
        success: true,
        message: "Oda basariyla olusturuldu.",
        roomId,
        room: newRoom
    });
});

router.get('/rooms', (req, res) => {
    const availableRooms = [];

    for (const room of rooms.values()) {
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

    res.status(200).json({ success: true, activeRooms: availableRooms });
});

router.post('/room/leave', (req, res) => {
    const { token, roomId } = req.body;

    if (!token || !activeSessions.has(token)) {
        return res.status(401).json({ success: false, message: "Yetkisiz islem. Lutfen once giris yapin." });
    }

    const room = rooms.get(roomId);

    if (!room) {
        return res.status(404).json({ success: false, message: "Oda bulunamadi." });
    }

    const user = activeSessions.get(token);
    room.players = room.players.filter((player) => player !== user.username);
    user.currentRoom = null;

    if (room.players.length === 0) {
        rooms.delete(roomId);
        return res.status(200).json({
            success: true,
            message: "Oda kapatildi.",
            roomClosed: true
        });
    }

    if (room.gameMaster === user.username) {
        room.gameMaster = room.players[0];
    }

    res.status(200).json({
        success: true,
        message: "Odadan cikildi.",
        roomClosed: false,
        room
    });
});

router.get('/room/:roomId', (req, res) => {
    const { roomId } = req.params;
    const room = rooms.get(roomId);

    if (!room) {
        return res.status(404).json({ success: false, message: "Oda bulunamadi." });
    }

    res.status(200).json({ success: true, room });
});

export default router;
