const loginForm = document.getElementById('login-form');
const usernameInput = document.getElementById('username');
const loginMessage = document.getElementById('login-message');

function showMessage(message) {
    loginMessage.textContent = message;
}

loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const username = usernameInput.value.trim();

    if (!username) {
        showMessage('Kullanici adi bos olamaz.');
        return;
    }

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username })
        });
        const data = await response.json();

        if (!response.ok) {
            showMessage(data.message || 'Giris yapilamadi.');
            return;
        }

        sessionStorage.setItem('username', data.username);
        sessionStorage.setItem('token', data.token);
        window.location.href = data.redirectTo;
    } catch (error) {
        showMessage('Sunucuya baglanilamadi.');
    }
});
