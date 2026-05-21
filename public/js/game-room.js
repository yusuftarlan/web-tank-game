// public/js/game-room.js

<<<<<<< HEAD
=======
// Ripple Effect Fonksiyonu
function createRipple(event) {
    const button = event.currentTarget;
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.classList.add('ripple');

    button.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
}

// Tüm butonlara ripple efekti ekle
document.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
        const button = e.target.tagName === 'BUTTON' ? e.target : e.target.closest('button');
        createRipple({ currentTarget: button, clientX: e.clientX, clientY: e.clientY });
    }
});

>>>>>>> 6d80468 (feat: Add frontend animations and interactive effects)
const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get('roomId');
const token = sessionStorage.getItem('token');
const currentUsername = sessionStorage.getItem('username');
let isLeavingRoom = false;

// Güvenlik kontrolü
if (!token || !roomId) {
    window.location.href = '/main-menu';
}

document.getElementById('room-id').textContent = roomId;

function showRoomMessage(message) {
    const messageEl = document.getElementById('room-message');
    messageEl.textContent = message;
    messageEl.classList.remove('hidden');
}

function goToGame(gameId) {
    if (!gameId) {
        showRoomMessage('Oyun baslatildi ama oyun kimligi alinamadi.');
        return;
    }

    sessionStorage.setItem('roomId', roomId);
    sessionStorage.setItem('gameId', gameId);
    window.location.href = `/game.html?roomId=${encodeURIComponent(roomId)}&gameId=${encodeURIComponent(gameId)}`;
}

// Sunucudan odanın son durumunu çeken fonksiyon
async function fetchRoomDetails() {
    if (isLeavingRoom) return;

    try {
        const response = await fetch(`/api/rooms/${roomId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (response.ok) {
            // EĞER KURUCU SAVAŞI BAŞLATTIYSA, OTOMATİK OLARAK OYUNA GİR!
            if (data.status === 'playing') {
                goToGame(data.gameId);
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
            goToGame(data.gameId);
        } else {
            showRoomMessage(data.error || 'Oyun baslatilamadi.');
        }
    } catch(err) {
        console.error(err);
        showRoomMessage('Sunucuyla iletisim kurulamadigi icin oyun baslatilamadi.');
    }
});

// Merkeze Dön Butonu
document.getElementById('leave-room-btn').addEventListener('click', async () => {
    if (isLeavingRoom) return;

    isLeavingRoom = true;
    const leaveBtn = document.getElementById('leave-room-btn');
    const messageEl = document.getElementById('room-message');

    leaveBtn.disabled = true;
    leaveBtn.textContent = 'CIKILIYOR...';

    try {
        const response = await fetch(`/api/rooms/${roomId}/leave`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();

        if (response.ok && data.success) {
            window.location.href = '/main-menu';
            return;
        }

        isLeavingRoom = false;
        leaveBtn.disabled = false;
        leaveBtn.textContent = 'MERKEZE DON';
        messageEl.textContent = data.error || 'Odadan cikilamadi.';
        messageEl.classList.remove('hidden');
    } catch (err) {
        console.error('Odadan cikilamadi:', err);
        isLeavingRoom = false;
        leaveBtn.disabled = false;
        leaveBtn.textContent = 'MERKEZE DON';
        messageEl.textContent = 'Sunucuyla iletisim kurulamadigi icin odadan cikilamadi.';
        messageEl.classList.remove('hidden');
    }
});

// 2 saniyede bir odayı güncelle (Yeni biri katılırsa veya oyun başlarsa görmek için)
setInterval(fetchRoomDetails, 2000);
fetchRoomDetails();
