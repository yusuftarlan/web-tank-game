// public/js/game-room.js

const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get('roomId');
const token = sessionStorage.getItem('token');
const currentUsername = sessionStorage.getItem('username');

// Güvenlik kontrolü
if (!token || !roomId) {
    window.location.href = '/main-menu';
}

document.getElementById('room-id').textContent = roomId;

// Sunucudan odanın son durumunu çeken fonksiyon
async function fetchRoomDetails() {
    try {
        const response = await fetch(`/api/rooms/${roomId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (response.ok) {
            // EĞER KURUCU SAVAŞI BAŞLATTIYSA, OTOMATİK OLARAK OYUNA GİR!
            if (data.status === 'playing') {
                window.location.href = '/game.html';
                return;
            }

            // Arayüzü güncelle
            document.getElementById('room-name').textContent = data.name;
            document.getElementById('player-count').textContent = data.players.length;
            document.getElementById('max-players').textContent = data.maxPlayers;
            
            const playerList = document.getElementById('player-list');
            playerList.innerHTML = data.players.map(p => `
                <li class="p-3 bg-slate-800 rounded border border-slate-700 flex justify-between items-center">
                    <span class="text-emerald-400 font-bold">${p}</span>
                    ${p === data.host ? '<span class="text-amber-400 text-xs bg-amber-900/30 px-2 py-1 rounded">Kurucu</span>' : '<span class="text-slate-400 text-xs">Mürettebat</span>'}
                </li>
            `).join('');

            const startBtn = document.getElementById('start-game-btn');
            const messageEl = document.getElementById('room-message');
            
            // Sadece kurucu "Savaşı Başlat" butonuna basabilir
            if (currentUsername === data.host) {
                startBtn.style.display = 'block';
                messageEl.classList.add('hidden');
            } else {
                startBtn.style.display = 'none';
                messageEl.textContent = 'Kurucunun savaşı başlatması bekleniyor...';
                messageEl.classList.remove('hidden');
            }
        } else {
            console.error(data.error);
            window.location.href = '/main-menu';
        }
    } catch (err) {
        console.error('Oda bilgisi alınamadı:', err);
    }
}

// "Savaşı Başlat" Butonuna Basıldığında (Sadece Kurucu tetikleyebilir)
document.getElementById('start-game-btn').addEventListener('click', async (e) => {
    e.preventDefault(); // Sayfanın normal link gibi çalışmasını durdur
    try {
        const response = await fetch(`/api/rooms/${roomId}/start`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
            // Başarılıysa savaş ekranına geç (diğer oyuncular da fetchRoomDetails sayesinde otomatik geçecek)
            window.location.href = '/game.html';
        }
    } catch(err) {
        console.error(err);
    }
});

// Merkeze Dön Butonu
document.getElementById('leave-room-btn').addEventListener('click', () => {
    window.location.href = '/main-menu';
});

// 2 saniyede bir odayı güncelle (Yeni biri katılırsa veya oyun başlarsa görmek için)
setInterval(fetchRoomDetails, 2000);
fetchRoomDetails();