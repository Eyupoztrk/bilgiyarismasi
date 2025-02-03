import { NotificationManager } from './notificationManager.js';
import { DiamondManager } from './diamondManager.js';

class AdRewardGame {
    constructor() {
        this.notificationManager = new NotificationManager();
        this.diamondManager = DiamondManager.getInstance();
        this.dailyWatchLimit = 50; // Günlük izleme limiti
        this.watchedToday = this.loadWatchedCount();
        this.lastResetDate = this.loadLastResetDate();
        this.rewardTiers = [
            { count: 5, reward: 25 },    // 5 reklam = 25 elmas
            { count: 15, reward: 100 },   // 15 reklam = 100 elmas
            { count: 30, reward: 250 },   // 30 reklam = 250 elmas
            { count: 50, reward: 500 }    // 50 reklam = 500 elmas
        ];

        this.init();
        this.checkDailyReset();
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

    saveWatchedCount() {
        localStorage.setItem('adWatchCount', this.watchedToday.toString());
        localStorage.setItem('lastResetDate', this.lastResetDate);
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

    async watchAd() {
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