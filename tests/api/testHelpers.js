import { activeSessions, activeUsernames, rooms } from '../../src/data/store.js';

export function resetStore() {
    activeSessions.clear();
    activeUsernames.clear();
    rooms.clear();
}

export function addSession(token, username, currentRoom = null) {
    activeUsernames.add(username);
    activeSessions.set(token, { username, currentRoom });
}

export function addRoom({
    id,
    name = 'Test Room',
    maxPlayers = 4,
    host = 'Host',
    players = [host],
    status = 'waiting',
    gameId = null,
    startedAt = null
}) {
    rooms.set(id, {
        id,
        name,
        maxPlayers,
        host,
        players,
        status,
        gameId,
        startedAt,
        clients: new Set(),
        gameState: null,
        gameInterval: null
    });
}
