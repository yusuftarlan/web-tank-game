import request from 'supertest';
import { activeSessions, rooms } from '../../src/data/store.js';
import { createTestApp } from './testApp.js';
import { addRoom, addSession, resetStore } from './testHelpers.js';

describe('Room API routes', () => {
    let app;

    beforeEach(() => {
        resetStore();
        app = createTestApp();
    });

    test('POST /api/rooms rejects requests without a valid token', async () => {
        await request(app)
            .post('/api/rooms')
            .send({ roomName: 'Alpha', maxPlayers: 4 })
            .expect(401);
    });

    test('POST /api/rooms creates a room for an authenticated user', async () => {
        addSession('token-host', 'Host');

        const response = await request(app)
            .post('/api/rooms')
            .set('Authorization', 'Bearer token-host')
            .send({ roomName: 'Alpha', maxPlayers: 3 })
            .expect(200);

        const room = rooms.get(response.body.roomId);

        expect(response.body).toEqual({
            success: true,
            roomId: expect.stringMatching(/^room_/)
        });
        expect(room).toMatchObject({
            id: response.body.roomId,
            name: 'Alpha',
            maxPlayers: 3,
            host: 'Host',
            players: ['Host'],
            status: 'waiting'
        });
    });

    test('POST /api/rooms updates the creator session currentRoom', async () => {
        addSession('token-host', 'Host');

        const response = await request(app)
            .post('/api/rooms')
            .set('Authorization', 'Bearer token-host')
            .send({ roomName: 'Alpha', maxPlayers: 4 })
            .expect(200);

        expect(activeSessions.get('token-host').currentRoom).toBe(response.body.roomId);
    });

    test('GET /api/rooms lists only waiting rooms', async () => {
        addRoom({ id: 'room_waiting', name: 'Waiting Room', host: 'Host', players: ['Host'] });
        addRoom({ id: 'room_playing', name: 'Playing Room', host: 'Host', players: ['Host'], status: 'playing' });

        const response = await request(app)
            .get('/api/rooms')
            .expect(200);

        expect(response.body.rooms).toEqual([
            {
                id: 'room_waiting',
                name: 'Waiting Room',
                host: 'Host',
                currentPlayers: 1,
                maxPlayers: 4
            }
        ]);
    });

    test('GET /api/rooms excludes test-room', async () => {
        addRoom({ id: 'test-room', name: 'Hidden Test Room' });

        const response = await request(app)
            .get('/api/rooms')
            .expect(200);

        expect(response.body.rooms).toEqual([]);
    });

    test('POST /api/rooms/:id/join adds an authenticated player to the room', async () => {
        addSession('token-player', 'Player');
        addRoom({ id: 'room_1', host: 'Host', players: ['Host'] });

        const response = await request(app)
            .post('/api/rooms/room_1/join')
            .set('Authorization', 'Bearer token-player')
            .expect(200);

        expect(response.body).toEqual({ success: true, roomId: 'room_1' });
        expect(rooms.get('room_1').players).toEqual(['Host', 'Player']);
        expect(activeSessions.get('token-player').currentRoom).toBe('room_1');
    });

    test('POST /api/rooms/:id/join does not duplicate the same player', async () => {
        addSession('token-player', 'Player');
        addRoom({ id: 'room_1', players: ['Player'], host: 'Player' });

        await request(app)
            .post('/api/rooms/room_1/join')
            .set('Authorization', 'Bearer token-player')
            .expect(200);

        expect(rooms.get('room_1').players).toEqual(['Player']);
    });

    test('POST /api/rooms/:id/join rejects new players when the room is full', async () => {
        addSession('token-player', 'Player');
        addRoom({ id: 'room_1', maxPlayers: 1, host: 'Host', players: ['Host'] });

        await request(app)
            .post('/api/rooms/room_1/join')
            .set('Authorization', 'Bearer token-player')
            .expect(400);

        expect(rooms.get('room_1').players).toEqual(['Host']);
    });

    test('POST /api/rooms/:id/join rejects joining a playing room', async () => {
        addSession('token-player', 'Player');
        addRoom({ id: 'room_1', status: 'playing' });

        await request(app)
            .post('/api/rooms/room_1/join')
            .set('Authorization', 'Bearer token-player')
            .expect(400);
    });

    test('GET /api/rooms/:id returns room details', async () => {
        addRoom({ id: 'room_1', name: 'Alpha', maxPlayers: 2, host: 'Host', players: ['Host'] });

        const response = await request(app)
            .get('/api/rooms/room_1')
            .expect(200);

        expect(response.body).toEqual({
            id: 'room_1',
            name: 'Alpha',
            host: 'Host',
            maxPlayers: 2,
            status: 'waiting',
            players: ['Host'],
            gameId: null
        });
    });

    test('GET /api/rooms/:id returns 404 for a missing room', async () => {
        await request(app)
            .get('/api/rooms/missing-room')
            .expect(404);
    });

    test('POST /api/rooms/:id/leave removes a player from the room', async () => {
        addSession('token-player', 'Player', 'room_1');
        addRoom({ id: 'room_1', host: 'Host', players: ['Host', 'Player'] });

        const response = await request(app)
            .post('/api/rooms/room_1/leave')
            .set('Authorization', 'Bearer token-player')
            .expect(200);

        expect(response.body).toEqual({
            success: true,
            roomDeleted: false,
            host: 'Host',
            players: ['Host']
        });
        expect(activeSessions.get('token-player').currentRoom).toBeNull();
    });

    test('POST /api/rooms/:id/leave deletes the room when the last player leaves', async () => {
        addSession('token-host', 'Host', 'room_1');
        addRoom({ id: 'room_1', host: 'Host', players: ['Host'] });

        const response = await request(app)
            .post('/api/rooms/room_1/leave')
            .set('Authorization', 'Bearer token-host')
            .expect(200);

        expect(response.body).toEqual({ success: true, roomDeleted: true });
        expect(rooms.has('room_1')).toBe(false);
    });

    test('POST /api/rooms/:id/leave transfers host to the next player', async () => {
        addSession('token-host', 'Host', 'room_1');
        addRoom({ id: 'room_1', host: 'Host', players: ['Host', 'Player'] });

        const response = await request(app)
            .post('/api/rooms/room_1/leave')
            .set('Authorization', 'Bearer token-host')
            .expect(200);

        expect(response.body.host).toBe('Player');
        expect(rooms.get('room_1').host).toBe('Player');
        expect(rooms.get('room_1').players).toEqual(['Player']);
    });

    test('POST /api/rooms/:id/start starts the room for the host', async () => {
        addSession('token-host', 'Host', 'room_1');
        addRoom({ id: 'room_1', host: 'Host', players: ['Host'] });

        const response = await request(app)
            .post('/api/rooms/room_1/start')
            .set('Authorization', 'Bearer token-host')
            .expect(200);

        expect(response.body).toEqual({
            success: true,
            roomId: 'room_1',
            gameId: expect.stringMatching(/^game_/)
        });
        expect(rooms.get('room_1').status).toBe('playing');
        expect(rooms.get('room_1').gameId).toBe(response.body.gameId);
    });

    test('POST /api/rooms/:id/start rejects non-host players', async () => {
        addSession('token-player', 'Player', 'room_1');
        addRoom({ id: 'room_1', host: 'Host', players: ['Host', 'Player'] });

        await request(app)
            .post('/api/rooms/room_1/start')
            .set('Authorization', 'Bearer token-player')
            .expect(403);

        expect(rooms.get('room_1').status).toBe('waiting');
    });

    test('POST /api/rooms/:id/start keeps the same gameId when already playing', async () => {
        addSession('token-host', 'Host', 'room_1');
        addRoom({
            id: 'room_1',
            host: 'Host',
            players: ['Host'],
            status: 'playing',
            gameId: 'game_existing'
        });

        const response = await request(app)
            .post('/api/rooms/room_1/start')
            .set('Authorization', 'Bearer token-host')
            .expect(200);

        expect(response.body.gameId).toBe('game_existing');
        expect(rooms.get('room_1').gameId).toBe('game_existing');
    });
});
