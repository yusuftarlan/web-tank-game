import express from 'express';
import apiRoutes from '../../src/meta/api/index.js';

export function createTestApp() {
    const app = express();

    app.use(express.json());
    app.use('/api', apiRoutes);

    return app;
}
