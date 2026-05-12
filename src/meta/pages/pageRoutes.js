import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, '../../../public');

router.get('/', (req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
});

router.get('/main-menu', (req, res) => {
    res.sendFile(path.join(publicDir, 'main-menu.html'));
});

router.get('/game-room/:roomId', (req, res) => {
    res.sendFile(path.join(publicDir, 'game-room.html'));
});

export default router;
