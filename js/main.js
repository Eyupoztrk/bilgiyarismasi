// Ayarlar modalı işlevselliği
const settingsBtn = document.querySelector('.settings-btn');
const settingsModal = document.querySelector('.settings-modal');
const closeSettingsBtn = document.querySelector('.close-settings-btn');
const resetDataBtn = document.querySelector('.reset-data-btn');

// Modal göster/gizle
settingsBtn.addEventListener('click', () => {
    settingsModal.style.display = 'flex';
    gsap.from('.settings-content', {
        scale: 0.8,
        opacity: 0,
        duration: 0.3,
        ease: 'back.out'
    });
});

closeSettingsBtn.addEventListener('click', () => {
    gsap.to('.settings-content', {
        scale: 0.8,
        opacity: 0,
        duration: 0.3,
        ease: 'power2.in',
        onComplete: () => {
            settingsModal.style.display = 'none';
        }
    });
});

// Modal dışına tıklama
settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
        gsap.to('.settings-content', {
            scale: 0.8,
            opacity: 0,
            duration: 0.3,
            ease: 'power2.in',
            onComplete: () => {
                settingsModal.style.display = 'none';
            }
        });
    }
});

// Oyun verilerini sıfırla
resetDataBtn.addEventListener('click', () => {
    // Oyun verilerini sıfırla
    localStorage.removeItem('classicPrize');
    localStorage.removeItem('classicParticipants');
    localStorage.removeItem('completedTasks');
    localStorage.removeItem('adWatchCount');
    localStorage.removeItem('lastResetDate');
    
    // Kullanıcı verilerini koru
    const currentUser = localStorage.getItem('currentUser');
    const userDiamonds = localStorage.getItem('userDiamonds');
    
    // LocalStorage'ı temizle
    localStorage.clear();
    
    // Kullanıcı verilerini geri yükle
    if (currentUser) localStorage.setItem('currentUser', currentUser);
    if (userDiamonds) localStorage.setItem('userDiamonds', userDiamonds);
    
    // Başarılı sıfırlama bildirimi
    const notification = document.createElement('div');
    notification.className = 'notification success';
    notification.textContent = 'Oyun verileri başarıyla sıfırlandı!';
    document.body.appendChild(notification);
    
    // Bildirimi 3 saniye sonra kaldır
    setTimeout(() => {
        notification.remove();
    }, 3000);
    
    // Modal'ı kapat
    gsap.to('.settings-content', {
        scale: 0.8,
        opacity: 0,
        duration: 0.3,
        ease: 'power2.in',
        onComplete: () => {
            settingsModal.style.display = 'none';
        }
    });
}); 