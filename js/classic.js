import { NotificationManager } from './notificationManager.js';
import { DiamondManager } from './diamondManager.js';

class ClassicGame {
    constructor() {
        this.notificationManager = new NotificationManager();
        this.diamondManager = DiamondManager.getInstance();
        this.currentPrize = 100;
        this.participantCount = 1;
        this.currentQuestion = null;
        this.hintCost = 20; // Her ipucu için elmas maliyeti
        this.unlockedHints = new Set(); // Açılan ipuçlarını takip et
        this.questions = [
            {
                text: "Evrendeki kayıp bilim insanının son koordinatları hangi galaksideydi?",
                answer: "andromeda",
                hints: [
                    {
                        text: "Evrendeki kayıp bilim insanının son koordinatları hangi galaksideydi? Evrendeki kayıp bilim insanının son koordinatları hangi galaksideydi?",
                        cost: 20
                    },
                    {
                        text: "Evrendeki kayıp bilim insanının son koordinatları hangi galaksideydi? Evrendeki kayıp bilim insanının son koordinatları hangi galaksideydi?",
                        cost: 25
                    },
                    {
                        text: "Evrendeki kayıp bilim insanının son koordinatları hangi galaksideydi? Evrendeki kayıp bilim insanının son koordinatları hangi galaksideydi?",
                        cost: 30
                    },
                    {
                        text: "Evrendeki kayıp bilim insanının son koordinatları hangi galaksideydi? Evrendeki kayıp bilim insanının son koordinatları hangi galaksideydi?",
                        cost: 35
                    },
                    {
                        text: "Evrendeki kayıp bilim insanının son koordinatları hangi galaksideydi? Evrendeki kayıp bilim insanının son koordinatları hangi galaksideydi?",
                        cost: 40
                    }
                ]
            }
        ];

        this.init();
    }

    init() {
        this.loadUserInfo();
        this.setupEventListeners();
        this.loadQuestion();
        this.initAnimations();
        this.updateDiamondCount();
        this.createHintButtons();
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

    createHintButtons() {
        const hintsContent = document.querySelector('.hints-content');
        hintsContent.innerHTML = ''; // Mevcut ipuçlarını temizle

        this.currentQuestion.hints.forEach((hint, index) => {
            const hintItem = document.createElement('div');
            hintItem.className = `hint-item ${this.unlockedHints.has(index) ? 'unlocked' : 'locked'}`;
            
            if (this.unlockedHints.has(index)) {
                hintItem.innerHTML = `
                    <div class="hint-text">${hint.text}</div>
                `;
            } else {
                hintItem.innerHTML = `
                    <div class="hint-text">İpucu ${index + 1}</div>
                    <div class="hint-cost">
                        <span>${hint.cost}</span>
                        <svg class="diamond-icon" viewBox="0 0 24 24" width="16" height="16">
                            <path fill="currentColor" d="M12,2L2,12L12,22L22,12L12,2Z"/>
                        </svg>
                    </div>
                `;
                hintItem.addEventListener('click', () => this.handleHintClick(index));
            }

            hintsContent.appendChild(hintItem);
        });
    }

    handleHintClick(hintIndex) {
        const hint = this.currentQuestion.hints[hintIndex];

        if (this.unlockedHints.has(hintIndex)) {
            return; // İpucu zaten açık
        }

        if (this.diamondManager.getDiamonds() >= hint.cost) {
            this.diamondManager.removeDiamonds(hint.cost);
            this.unlockedHints.add(hintIndex);
            this.updateDiamondCount();
            this.createHintButtons();
            this.notificationManager.show('İpucu açıldı!', 'success');

            // İpucu satın alma animasyonu
            gsap.from('.diamond-count', {
                scale: 0.5,
                duration: 0.3,
                ease: 'back.out'
            });

            // Yeni ipucu animasyonu
            const hintItems = document.querySelectorAll('.hint-item');
            gsap.from(hintItems[hintIndex], {
                scale: 0.9,
                opacity: 0,
                duration: 0.3,
                ease: 'back.out'
            });
        } else {
            this.notificationManager.show('Yeterli elmasınız yok!', 'error');
            
            // Yetersiz elmas animasyonu
            gsap.to('.diamond-counter', {
                x: [-5, 5, -5, 5, 0],
                duration: 0.4,
                ease: 'power2.out'
            });
        }
    }

    setupEventListeners() {
        // Cevap formu
        document.querySelector('.answer-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.checkAnswer();
        });

        // Giriş/Çıkış butonu
        document.querySelector('.login-btn').addEventListener('click', () => {
            localStorage.removeItem('currentUser');
            window.location.href = 'login.html';
        });

        // İpucu penceresi kontrolleri
        document.querySelector('.show-hints-btn').addEventListener('click', () => {
            this.showHintsWindow();
        });

        document.querySelector('.close-hints-btn').addEventListener('click', () => {
            this.hideHintsWindow();
        });

        // ESC tuşu ile ipucu penceresini kapatma
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideHintsWindow();
            }
        });

        // Pencere dışı tıklama ile kapatma
        document.addEventListener('click', (e) => {
            const hintsWindow = document.querySelector('.hints-window');
            const showHintsBtn = document.querySelector('.show-hints-btn');
            if (hintsWindow.classList.contains('active') && 
                !hintsWindow.contains(e.target) && 
                !showHintsBtn.contains(e.target)) {
                this.hideHintsWindow();
            }
        });
    }

    showHintsWindow() {
        const hintsWindow = document.querySelector('.hints-window');
        hintsWindow.classList.add('active');
        hintsWindow.style.display = 'block';
    }

    hideHintsWindow() {
        const hintsWindow = document.querySelector('.hints-window');
        hintsWindow.classList.remove('active');
        hintsWindow.style.display = 'none';
    }

    loadQuestion() {
        this.currentQuestion = this.questions[0];
        document.querySelector('.question-text').textContent = this.currentQuestion.text;
    }

    checkAnswer() {
        const answerInput = document.querySelector('.answer-input');
        const userAnswer = answerInput.value.trim().toLowerCase();

        if (userAnswer === this.currentQuestion.answer) {
            this.handleCorrectAnswer();
        } else {
            this.handleWrongAnswer();
        }

        answerInput.value = '';
    }

    handleCorrectAnswer() {
        this.currentPrize += 50;
        document.querySelector('.prize-amount').textContent = `${this.currentPrize} TL`;

        // Zafer animasyonu
        gsap.to('.prize-amount', {
            scale: 1.2,
            duration: 0.3,
            yoyo: true,
            repeat: 1
        });

        // Oyun alanını devre dışı bırak
        const gameContainer = document.querySelector('.game-container');
        gameContainer.style.pointerEvents = 'none';
        gameContainer.style.opacity = '0.7';

        // Kullanıcı bilgilerini al
        const userJson = localStorage.getItem('currentUser');
        const user = userJson ? JSON.parse(userJson) : { name: 'Misafir', surname: 'Kullanıcı' };

        // Tebrik penceresi oluştur
        const overlay = document.createElement('div');
        overlay.className = 'completion-overlay';
        overlay.innerHTML = `
            <div class="completion-content">
                <h2>Tebrikler ${user.name} ${user.surname}!</h2>
                <p>Soruyu doğru cevapladınız!</p>
                <div class="prize-info">
                    <div class="prize-label">Kazandığınız Ödül:</div>
                    <div class="final-prize">${this.currentPrize} ₺</div>
                </div>
                <p class="waiting-text">Yeni soru eklenene kadar bekleyiniz...</p>
                <div class="social-share">
                    <p>Başarınızı paylaşın:</p>
                    <div class="share-buttons">
                        <button class="share-btn whatsapp">
                            <svg viewBox="0 0 24 24" width="24" height="24">
                                <path fill="currentColor" d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824zm-3.423-14.416c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm.029 18.88c-1.161 0-2.305-.292-3.318-.844l-3.677.964.984-3.595c-.607-1.052-.927-2.246-.926-3.468.001-3.825 3.113-6.937 6.937-6.937 1.856.001 3.598.723 4.907 2.034 1.31 1.311 2.031 3.054 2.03 4.908-.001 3.825-3.113 6.938-6.937 6.938z"/>
                            </svg>
                            WhatsApp
                        </button>
                        <button class="share-btn twitter">
                            <svg viewBox="0 0 24 24" width="24" height="24">
                                <path fill="currentColor" d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                            </svg>
                            Twitter
                        </button>
                    </div>
                </div>
                <button class="back-to-home">Ana Sayfaya Dön</button>
            </div>
        `;

        document.body.appendChild(overlay);

        // Tamamlama animasyonu
        gsap.from('.completion-content', {
            scale: 0.8,
            opacity: 0,
            duration: 0.5,
            ease: 'back.out'
        });

        // Paylaşım butonları için event listener'lar
        overlay.querySelector('.share-btn.whatsapp').addEventListener('click', () => {
            const text = `Zeka Tahtası'nda soruyu doğru cevaplayarak ${this.currentPrize} ₺ kazandım! 🎉`;
            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
        });

        overlay.querySelector('.share-btn.twitter').addEventListener('click', () => {
            const text = `Zeka Tahtası'nda soruyu doğru cevaplayarak ${this.currentPrize} ₺ kazandım! 🎉`;
            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
        });

        // Ana sayfaya dönüş butonu
        overlay.querySelector('.back-to-home').addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }

    handleWrongAnswer() {
        this.notificationManager.show('Yanlış cevap! Tekrar deneyin.', 'error');
        
        // Yanlış cevap animasyonu
        gsap.to('.answer-input', {
            x: [-10, 10, -10, 10, 0],
            duration: 0.4,
            ease: 'power2.out'
        });
    }

    initAnimations() {
        // Başlangıç animasyonları
        gsap.from('.prize-section', {
            y: 30,
            opacity: 0,
            duration: 0.8,
            ease: 'power3.out'
        });

        gsap.from('.question-card', {
            y: 30,
            opacity: 0,
            duration: 0.8,
            delay: 0.2,
            ease: 'power3.out'
        });

        gsap.from('.hint-section', {
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
    new ClassicGame();
}); 