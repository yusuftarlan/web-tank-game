document.getElementById('offline-setup-form').addEventListener('submit', (event) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const playerCount = formData.get('playerCount') || '2';

    window.location.href = `/offline-game.html?players=${encodeURIComponent(playerCount)}`;
});
