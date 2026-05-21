// src/server.js
import express from 'express';
import cors from 'cors';
import { createServer } from 'http'; // HTTP sunucusunu manuel oluşturmak için eklendi
import apiRoutes from './meta/api/index.js';
import pageRoutes from './meta/pages/pageRoutes.js';
import { initGameServer } from './game/gameServer.js'; // Game Server başlatıcısı

const app = express();
const port = process.env.PORT || 3000;

// HTTP Sunucusunu Express ile sarmalıyoruz (WebSocket'i aynı porta takabilmek için)
const server = createServer(app);

app.use(cors());
app.use(express.json());
app.use(express.static('public', {
    setHeaders(res, filePath) {
        const normalizedPath = filePath.replace(/\\/g, '/');

        if (/\.(html)$/i.test(normalizedPath) || /\.(js|css)$/i.test(normalizedPath)) {
            res.setHeader('Cache-Control', 'no-cache');
            return;
        }

        if (/\/public\/assets\/(audio|sprites|effects|maps|ui)\//.test(normalizedPath)) {
            res.setHeader('Cache-Control', 'public, max-age=86400');
        }
    }
}));

// API ve Sayfa Router'ları
app.use('/api', apiRoutes);
app.use('/', pageRoutes);

// WebSocket (Game) sunucusunu başlat ve HTTP sunucusuna bağla
initGameServer(server);

// app.listen YERİNE server.listen kullanıyoruz!
server.listen(port, () => {
    console.log(`\n[SİSTEM] HTTP ve WebSocket Sunucusu http://localhost:${port} adresinde başarıyla çalışıyor.`);
});
