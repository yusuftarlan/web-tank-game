// public/js/new-game.js

document.getElementById('create-room-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const roomName = document.getElementById('roomName').value;
    const maxPlayers = document.getElementById('maxPlayers').value;
    const token = sessionStorage.getItem('token');
    const errorMessage = document.getElementById('error-message');

    if (!token) {
        window.location.href = '/';
        return;
    }

    try {
        const response = await fetch('/api/rooms', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ roomName, maxPlayers })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Oda başarıyla oluşturuldu, bekleme odasına yönlendir
            window.location.href = `/game-room.html?roomId=${data.roomId}`;
        } else {
            errorMessage.textContent = data.error || 'Oda oluşturulamadı.';
            errorMessage.classList.remove('hidden');
        }
    } catch (err) {
        console.error(err);
        errorMessage.textContent = 'Sunucuyla iletişim kurulamadı.';
        errorMessage.classList.remove('hidden');
    }
});