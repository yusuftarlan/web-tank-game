const usernameDisplay = document.getElementById('username-display');
const roomsList = document.getElementById('rooms-list');
const roomsMessage = document.getElementById('rooms-message');
const newGameButton = document.getElementById('new-game-button');
const username = sessionStorage.getItem('username');

if (!username) {
    window.location.href = '/';
} else {
    usernameDisplay.textContent = username;
    loadRooms();
}

newGameButton.addEventListener('click', () => {
    window.location.href = '/new-game.html';
});

async function loadRooms() {
    try {
        const response = await fetch('/api/rooms');
        const data = await response.json();

        if (!response.ok || !data.success) {
            roomsMessage.textContent = data.message || 'Oyun odalari yuklenemedi.';
            return;
        }

        renderRooms(data.activeRooms);
    } catch (error) {
        roomsMessage.textContent = 'Oyun odalari yuklenirken bir hata olustu.';
    }
}

function renderRooms(rooms) {
    roomsList.innerHTML = '';

    if (!rooms || rooms.length === 0) {
        roomsMessage.textContent = 'Mevcut oyun odasi yok.';
        return;
    }

    roomsMessage.textContent = '';

    rooms.forEach((room) => {
        const roomItem = document.createElement('li');
        const roomInfo = document.createElement('span');
        const joinButton = document.createElement('button');

        roomInfo.textContent = `${room.roomName} - ${room.currentPlayers}/${room.maxPlayers} oyuncu - Kurucu: ${room.gameMaster}`;
        joinButton.type = 'button';
        joinButton.textContent = 'Katil';
        joinButton.disabled = true;

        roomItem.appendChild(roomInfo);
        roomItem.appendChild(joinButton);
        roomsList.appendChild(roomItem);
    });
}
