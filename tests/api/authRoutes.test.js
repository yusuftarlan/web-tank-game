import request from 'supertest';
import { activeSessions, activeUsernames } from '../../src/data/store.js';
import { createTestApp } from './testApp.js';
import { resetStore } from './testHelpers.js';

describe('Auth API routes', () => {
    let app;

    beforeEach(() => {
        resetStore();
        app = createTestApp();
    });

    test('POST /api/auth/login returns a successful login response', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({ username: 'Yusuf' })
            .expect(200);

        expect(response.body).toEqual({
            success: true,
            token: expect.stringMatching(/^cmd_/),
            username: 'Yusuf'
        });
    });

    test('POST /api/auth/login trims the username before storing it', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({ username: '  Commander  ' })
            .expect(200);

        expect(response.body.username).toBe('Commander');
        expect(activeUsernames.has('Commander')).toBe(true);
        expect(activeUsernames.has('  Commander  ')).toBe(false);
    });

    test('POST /api/auth/login rejects an empty username', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({ username: '   ' })
            .expect(400);

        expect(response.body.success).toBe(false);
        expect(activeSessions.size).toBe(0);
    });

    test('POST /api/auth/login rejects a duplicate active username', async () => {
        await request(app)
            .post('/api/auth/login')
            .send({ username: 'Yusuf' })
            .expect(200);

        const response = await request(app)
            .post('/api/auth/login')
            .send({ username: 'Yusuf' })
            .expect(400);

        expect(response.body.success).toBe(false);
        expect(activeSessions.size).toBe(1);
    });

    test('POST /api/auth/login stores the session in RAM after login', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({ username: 'Yusuf' })
            .expect(200);

        expect(activeSessions.get(response.body.token)).toEqual({
            username: 'Yusuf',
            currentRoom: null
        });
    });
});
