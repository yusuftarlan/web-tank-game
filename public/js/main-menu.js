// public/js/main-menu.js

async function loadRooms() {
    const token = sessionStorage.getItem('token');
    if (!token) { 
        window.location.href = '/'; 
        return; 
    }

    // Komutan adını sağ üste yaz
    document.getElementById('username-display').textContent = sessionStorage.getItem('username') || 'Misafir';

    try {
        const response = await fetch('/api/rooms', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        const roomList = document.getElementById('room-list');

        if (data.rooms.length === 0) {
            roomList.innerHTML = `
                <div class="p-4 bg-slate-900 rounded-lg border border-slate-700 text-center text-slate-500 mt-10">
                    Aktif savaş odası bulunamadı. Kendi cepheni kur!
                </div>`;
            return;
        }

        // Odaları HTML olarak bas
        roomList.innerHTML = data.rooms.map(room => `
            <div class="bg-slate-900 p-4 rounded-lg border border-slate-700 flex justify-between items-center hover:border-emerald-500/50 transition">
                <div>
                    <h4 class="text-emerald-400 font-bold text-lg">${room.name}</h4>
                    <p class="text-xs text-slate-400">Kurucu: ${room.host}</p>
                </div>
                <div class="flex items-center gap-4">
                    <span class="text-sm font-mono ${room.currentPlayers >= room.maxPlayers ? 'text-red-400' : 'text-slate-300'}">
                        ${room.currentPlayers}/${room.maxPlayers}
                    </span>
                    <button onclick="joinRoom('${room.id}')" 
                        class="${room.currentPlayers >= room.maxPlayers ? 'bg-slate-700 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500'} text-white text-xs px-4 py-2 rounded-lg font-bold transition shadow-md"
                        ${room.currentPlayers >= room.maxPlayers ? 'disabled' : ''}>
                        ${room.currentPlayers >= room.maxPlayers ? 'DOLU' : 'KATIL'}
                    </button>
                </div>
            </div>
        `).join('');
    } catch (err) {
        console.error(err);
        document.getElementById('room-list').innerHTML = '<div class="text-red-400 text-center mt-10">Odalar yüklenirken bir hata oluştu.</div>';
    }
}

// Global (Window) objesine bağlıyoruz ki HTML içindeki onclick="joinRoom(...)" çalışabilsin
window.joinRoom = async function(roomId) {
    const token = sessionStorage.getItem('token');
    try {
        const response = await fetch(`/api/rooms/${roomId}/join`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Katılma başarılı, bekleme odasına git
            window.location.href = `/game-room.html?roomId=${roomId}`;
        } else {
            alert(data.error || 'Odaya katılınamadı');
        }
    } catch (err) {
        console.error(err);
        alert('Sunucu hatası!');
    }
}

// Çıkış Yap Butonu
document.getElementById('logout-btn').addEventListener('click', (e) => {
    sessionStorage.clear();
    // href="/" yönlendirmesi HTML üzerinde yapıldığı için ek işlem gerekmez.
});

// Sayfa yüklendiğinde odaları getir
loadRooms();