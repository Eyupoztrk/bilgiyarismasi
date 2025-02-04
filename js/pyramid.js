import { NotificationManager } from './notificationManager.js';
import { DiamondManager } from './diamondManager.js';

class AdRewardGame {
    constructor() {
        this.notificationManager = new NotificationManager();
        this.diamondManager = DiamondManager.getInstance();
        this.dailyWatchLimit = 50; // Günlük izleme limiti
        this.watchedToday = this.loadWatchedCount();
        this.lastResetDate = this.loadLastResetDate();
        this.waitTime = 60; // Bekleme süresi (saniye)
        this.canWatch = true; // İzleme durumu
        this.countdown = null; // Sayaç zamanlayıcısı
        this.lastWatchTime = this.loadLastWatchTime();
        this.rewardTiers = [
            { count: 5, reward: 25 },    // 5 reklam = 25 elmas
            { count: 15, reward: 100 },   // 15 reklam = 100 elmas
            { count: 30, reward: 250 },   // 30 reklam = 250 elmas
            { count: 50, reward: 500 }    // 50 reklam = 500 elmas
        ];

        this.init();
        this.checkDailyReset();
        this.updateAdStats();
        this.checkWaitTime();
    }

    init() {
        this.loadUserInfo();
        this.setupEventListeners();
        this.initAnimations();
        this.updateDiamondCount();
        this.updateProgress();
        this.createRewardTiers();
    }

    loadUserInfo() {
        const userJson = localStorage.getItem('currentUser');
        const user = userJson ? JSON.parse(userJson) : null;

        const usernameElement = document.querySelector('.username');
        const loginButton = document.querySelector('.login-btn');

        if (user) {
            usernameElement.textContent = `${user.name} ${user.surname}`;
            loginButton.textContent = 'Çıkış Yap';
        } else {
            window.location.href = 'login.html';
        }
    }

    loadWatchedCount() {
        return parseInt(localStorage.getItem('adWatchCount') || '0');
    }

    loadLastResetDate() {
        return localStorage.getItem('lastResetDate') || new Date().toDateString();
    }

    loadLastWatchTime() {
        const time = localStorage.getItem('lastWatchTime');
        return time ? parseInt(time) : 0;
    }

    saveWatchedCount() {
        localStorage.setItem('adWatchCount', this.watchedToday.toString());
        localStorage.setItem('lastResetDate', this.lastResetDate);
    }

    saveLastWatchTime() {
        localStorage.setItem('lastWatchTime', Date.now().toString());
    }

    checkDailyReset() {
        const today = new Date().toDateString();
        if (this.lastResetDate !== today) {
            this.watchedToday = 0;
            this.lastResetDate = today;
            this.saveWatchedCount();
            this.updateProgress();
            this.createRewardTiers();
        }
    }

    updateDiamondCount() {
        const diamondCounter = document.querySelector('.diamond-count');
        if (!diamondCounter) {
            const userInfo = document.querySelector('.user-info');
            const counter = document.createElement('div');
            counter.className = 'diamond-counter';
            counter.innerHTML = `
                <svg class="diamond-icon" viewBox="0 0 24 24" width="20" height="20">
                    <path fill="currentColor" d="M12,2L2,12L12,22L22,12L12,2Z"/>
                </svg>
                <span class="diamond-count">${this.diamondManager.getDiamonds()}</span>
            `;
            userInfo.insertBefore(counter, userInfo.firstChild);
        } else {
            diamondCounter.textContent = this.diamondManager.getDiamonds();
        }
    }

    createRewardTiers() {
        const tiersContainer = document.querySelector('.reward-tiers');
        tiersContainer.innerHTML = '';

        this.rewardTiers.forEach(tier => {
            const tierElement = document.createElement('div');
            tierElement.className = `reward-tier ${this.watchedToday >= tier.count ? 'completed' : ''}`;
            tierElement.innerHTML = `
                <div class="tier-progress">
                    <div class="tier-count">${Math.min(this.watchedToday, tier.count)}/${tier.count}</div>
                    <div class="progress-bar">
                        <div class="progress" style="width: ${(Math.min(this.watchedToday, tier.count) / tier.count) * 100}%"></div>
                    </div>
                </div>
                <div class="tier-reward">
                    <span>${tier.reward}</span>
                        <svg class="diamond-icon" viewBox="0 0 24 24" width="16" height="16">
                            <path fill="currentColor" d="M12,2L2,12L12,22L22,12L12,2Z"/>
                        </svg>
                    </div>
                `;
            tiersContainer.appendChild(tierElement);
        });
    }

    updateProgress() {
        const progressElement = document.querySelector('.daily-progress');
        progressElement.innerHTML = `
            <div class="progress-text">Günlük İzleme: ${this.watchedToday}/${this.dailyWatchLimit}</div>
            <div class="progress-bar">
                <div class="progress" style="width: ${(this.watchedToday / this.dailyWatchLimit) * 100}%"></div>
            </div>
        `;
    }

    setupEventListeners() {
        document.querySelector('.watch-ad-btn').addEventListener('click', () => {
            this.watchAd();
        });

        document.querySelector('.login-btn').addEventListener('click', () => {
            localStorage.removeItem('currentUser');
            window.location.href = 'login.html';
        });
    }

    updateAdStats() {
        // İstatistik elementlerini bul
        const watchedElement = document.querySelector('.stat-box:nth-child(1) .stat-value');
        const remainingElement = document.querySelector('.stat-box:nth-child(2) .stat-value');
        const earnedElement = document.querySelector('.stat-box:nth-child(3) .stat-value');

        // Kazanılan toplam elmas miktarını hesapla
        let totalEarned = 0;
        this.rewardTiers.forEach(tier => {
            if (this.watchedToday >= tier.count) {
                totalEarned += tier.reward;
            }
        });

        // İstatistikleri güncelle
        if (watchedElement) watchedElement.textContent = this.watchedToday;
        if (remainingElement) remainingElement.textContent = this.dailyWatchLimit - this.watchedToday;
        if (earnedElement) earnedElement.textContent = totalEarned;
    }

    checkWaitTime() {
        const now = Date.now();
        const timeDiff = Math.floor((now - this.lastWatchTime) / 1000);
        
        if (timeDiff < this.waitTime) {
            this.canWatch = false;
            const remainingTime = this.waitTime - timeDiff;
            this.startCountdown(remainingTime);
        } else {
            this.canWatch = true;
            this.updateWatchButton(true);
        }
    }

    startCountdown(seconds) {
        if (this.countdown) {
            clearInterval(this.countdown);
        }

        const watchButton = document.querySelector('.watch-ad-btn');
        const updateButton = (time) => {
            if (time <= 0) {
                watchButton.innerHTML = `
                    <div class="btn-content">
                        <svg viewBox="0 0 24 24" width="24" height="24">
                            <path fill="currentColor" d="M10,16.5V7.5L16,12M20,4.4C19.4,4.2 15.7,4 12,4C8.3,4 4.6,4.19 4,4.38C2.44,4.9 2,8.4 2,12C2,15.59 2.44,19.1 4,19.61C4.6,19.81 8.3,20 12,20C15.7,20 19.4,19.81 20,19.61C21.56,19.1 22,15.59 22,12C22,8.4 21.56,4.91 20,4.4Z" />
                        </svg>
                        <span>Reklam İzle</span>
                    </div>
                `;
                watchButton.disabled = false;
                watchButton.classList.remove('disabled');
                this.canWatch = true;
                clearInterval(this.countdown);
            } else {
                watchButton.innerHTML = `
                    <div class="btn-content">
                        <svg viewBox="0 0 24 24" width="24" height="24">
                            <path fill="currentColor" d="M12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22C6.47,22 2,17.5 2,12A10,10 0 0,1 12,2M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z"/>
                        </svg>
                        <span>${Math.floor(time / 60)}:${(time % 60).toString().padStart(2, '0')}</span>
                    </div>
                `;
                watchButton.disabled = true;
                watchButton.classList.add('disabled');
            }
        };

        updateButton(seconds);
        this.countdown = setInterval(() => {
            seconds--;
            updateButton(seconds);
        }, 1000);
    }

    updateWatchButton(enabled) {
        const watchButton = document.querySelector('.watch-ad-btn');
        if (enabled) {
            watchButton.disabled = false;
            watchButton.classList.remove('disabled');
            watchButton.innerHTML = `
                <div class="btn-content">
                    <svg viewBox="0 0 24 24" width="24" height="24">
                        <path fill="currentColor" d="M10,16.5V7.5L16,12M20,4.4C19.4,4.2 15.7,4 12,4C8.3,4 4.6,4.19 4,4.38C2.44,4.9 2,8.4 2,12C2,15.59 2.44,19.1 4,19.61C4.6,19.81 8.3,20 12,20C15.7,20 19.4,19.81 20,19.61C21.56,19.1 22,15.59 22,12C22,8.4 21.56,4.91 20,4.4Z" />
                    </svg>
                    <span>Reklam İzle</span>
                </div>
            `;
        } else {
            watchButton.disabled = true;
            watchButton.classList.add('disabled');
        }
    }

    async watchAd() {
        if (!this.canWatch) {
            return;
        }

        if (this.watchedToday >= this.dailyWatchLimit) {
            this.notificationManager.show('Günlük izleme limitine ulaştınız! Yarın tekrar gelin.', 'info');
            return;
        }

        this.notificationManager.show('Reklam yükleniyor...', 'info');
        
        // Rastgele reklam siteleri
        const adSites = [
            'https://www.youtube.com',
            'https://www.facebook.com',
            'https://www.twitter.com',
            'https://www.instagram.com',
            'https://www.tiktok.com'
        ];
        
        // Rastgele bir site seç
        const randomSite = adSites[Math.floor(Math.random() * adSites.length)];
        
        // Yeni sekmede aç
        window.open(randomSite, '_blank');
        
        // Simüle edilmiş reklam yükleme süresi
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Reklam izleme sayısını artır
        this.watchedToday++;
        this.saveWatchedCount();
        
        // Son izleme zamanını kaydet ve sayacı başlat
        this.lastWatchTime = Date.now();
        this.saveLastWatchTime();
        this.canWatch = false;
        this.startCountdown(this.waitTime);
        
        // Ödül kontrolü
        const earnedReward = this.checkRewards();
        if (earnedReward > 0) {
            this.diamondManager.addDiamonds(earnedReward);
            this.notificationManager.show(`Tebrikler! ${earnedReward} 💎 kazandınız!`, 'success');
        } else {
            this.notificationManager.show('Reklam izlediğiniz için teşekkürler!', 'success');
        }
        
        // UI güncelleme
        this.updateProgress();
        this.updateDiamondCount();
        this.createRewardTiers();
        this.updateAdStats();
        
        // Limit kontrolü
        if (this.watchedToday >= this.dailyWatchLimit) {
            this.notificationManager.show('Günlük izleme limitine ulaştınız! Yarın tekrar gelin.', 'info');
        }
    }

    checkRewards() {
        let earnedReward = 0;
        
        // Her seviye için kontrol
        this.rewardTiers.forEach(tier => {
            if (this.watchedToday === tier.count) {
                earnedReward = tier.reward;
            }
        });
        
        return earnedReward;
    }

    initAnimations() {
        gsap.from('.daily-progress', {
            y: 30,
            opacity: 0,
            duration: 0.8,
            ease: 'power3.out'
        });

        gsap.from('.reward-tiers', {
            y: 30,
            opacity: 0,
            duration: 0.8,
            delay: 0.2,
            ease: 'power3.out'
        });

        gsap.from('.watch-ad-section', {
            y: 30,
            opacity: 0,
            duration: 0.8,
            delay: 0.4,
            ease: 'power3.out'
        });

        gsap.from('.diamond-counter', {
            scale: 0,
            opacity: 0,
            duration: 0.5,
            delay: 0.6,
            ease: 'back.out'
        });
    }
}

// Oyunu başlat
document.addEventListener('DOMContentLoaded', () => {
    new AdRewardGame();
}); 