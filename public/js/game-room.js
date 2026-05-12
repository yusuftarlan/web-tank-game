const roomNameDisplay = document.getElementById('room-name');
const roomMessage = document.getElementById('room-message');
const roomIdDisplay = document.getElementById('room-id');
const gameMasterDisplay = document.getElementById('game-master');
const playersCountDisplay = document.getElementById('players-count');
const leaveRoomButton = document.getElementById('leave-room-button');

const token = sessionStorage.getItem('token');
const username = sessionStorage.getItem('username');
const roomId = window.location.pathname.split('/').pop();

if (!token || !username) {
    window.location.href = '/';
} else {
    loadRoom();
}

leaveRoomButton.addEventListener('click', async () => {
    try {
        const response = await fetch('/api/room/leave', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token,
                roomId
            })
        });
        const data = await response.json();

        if (!response.ok || !data.success) {
            roomMessage.textContent = data.message || 'Odadan cikilamadi.';
            return;
        }

        window.location.href = '/main-menu';
    } catch (error) {
        roomMessage.textContent = 'Sunucuya baglanilamadi.';
    }
});

async function loadRoom() {
    try {
        const response = await fetch(`/api/room/${roomId}`);
        const data = await response.json();

        if (!response.ok || !data.success) {
            roomMessage.textContent = data.message || 'Oda bilgileri yuklenemedi.';
            return;
        }

        renderRoom(data.room);
    } catch (error) {
        roomMessage.textContent = 'Sunucuya baglanilamadi.';
    }
}

function renderRoom(room) {
    roomNameDisplay.textContent = room.roomName;
    roomIdDisplay.textContent = room.roomId;
    gameMasterDisplay.textContent = room.gameMaster;
    playersCountDisplay.textContent = `${room.players.length}/${room.maxPlayers}`;
    roomMessage.textContent = '';
}
