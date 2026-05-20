// public/js/login.js

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