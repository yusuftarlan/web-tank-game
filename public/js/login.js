// public/js/login.js

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

// Butonlara ripple efekti ekle
document.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
        const button = e.target.tagName === 'BUTTON' ? e.target : e.target.closest('button');
        createRipple({ currentTarget: button, clientX: e.clientX, clientY: e.clientY });
    }
});

>>>>>>> 6d80468 (feat: Add frontend animations and interactive effects)
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault(); // Sayfanın yenilenmesini engelle
    
    const username = document.getElementById('username').value.trim();
    const messageEl = document.getElementById('login-message');
    
    if (!username) {
        messageEl.textContent = 'Lütfen bir komutan adı girin.';
        messageEl.className = 'mt-4 text-sm text-red-400 min-h-[20px] font-medium relative z-10';
        return;
    }

    try {
        // Yükleniyor durumu
        messageEl.textContent = 'Sinyal gönderiliyor...';
        messageEl.className = 'mt-4 text-sm text-emerald-400 min-h-[20px] font-medium relative z-10';

        // Sunucuya POST isteği at
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username: username })
        });

        const data = await response.json();

        if (data.success) {
            // Giriş başarılıysa bilgileri tarayıcıya kaydet
            sessionStorage.setItem('token', data.token);
            sessionStorage.setItem('username', data.username);
            
            // Başarılı mesajı ve yönlendirme
            messageEl.textContent = 'Bağlantı kuruldu! Karargâha aktarılıyorsunuz...';
            setTimeout(() => {
                window.location.href = '/main-menu';
            }, 500); // 0.5 saniye bekle ve Lobiye geç
        } else {
            // Sunucudan hata geldiyse (örn: isim kullanılıyorsa)
            messageEl.textContent = data.message || 'Giriş reddedildi.';
            messageEl.className = 'mt-4 text-sm text-red-400 min-h-[20px] font-medium relative z-10';
        }
    } catch (error) {
        console.error('Bağlantı hatası:', error);
        messageEl.textContent = 'Sunucuya bağlanılamadı. Sunucunun açık olduğundan emin olun.';
        messageEl.className = 'mt-4 text-sm text-red-400 min-h-[20px] font-medium relative z-10';
    }
});