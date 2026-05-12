const newGameForm = document.getElementById('new-game-form');
const roomNameInput = document.getElementById('room-name');
const maxPlayersInput = document.getElementById('max-players');
const newGameMessage = document.getElementById('new-game-message');
const backButton = document.getElementById('back-button');

const token = sessionStorage.getItem('token');
const username = sessionStorage.getItem('username');

if (!token || !username) {
    window.location.href = '/';
}

backButton.addEventListener('click', () => {
    window.location.href = '/main-menu';
});

newGameForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const roomName = roomNameInput.value.trim();
    const maxPlayers = Number(maxPlayersInput.value);

    try {
        const response = await fetch('/api/room/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token,
                roomName,
                maxPlayers
            })
        });
        const data = await response.json();

        if (!response.ok || !data.success) {
            newGameMessage.textContent = data.message || 'Oda olusturulamadi.';
            return;
        }

        window.location.href = `/game-room/${data.roomId}`;
    } catch (error) {
        newGameMessage.textContent = 'Sunucuya baglanilamadi.';
    }
});
