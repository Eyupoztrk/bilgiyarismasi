import { NotificationManager } from './notificationManager.js';
import { DiamondManager } from './diamondManager.js';

class ClassicGame {
    constructor() {
        this.notificationManager = new NotificationManager();
        this.diamondManager = DiamondManager.getInstance();
        this.entryFee = 50; // Katılım ücreti (elmas)
        this.currentQuestion = null;
        this.hintCost = 20; // Her ipucu için elmas maliyeti
        
        // Açılan ipuçlarını localStorage'dan al
        const unlockedHintsJson = localStorage.getItem('unlockedHints');
        this.unlockedHints = unlockedHintsJson ? new Set(JSON.parse(unlockedHintsJson)) : new Set();
        
        this.participationTaskId = 'classic_participation'; // Katılım durumu için özel task ID
        
        // Hak sayısını localStorage'dan al, yoksa default 5 olsun
        this.attempts = parseInt(localStorage.getItem('classicAttempts')) || 5;
        
        // Ödül ve katılımcı sayısını localStorage'dan al
        this.currentPrize = parseInt(localStorage.getItem('classicPrize')) || 100;
        this.participantCount = parseInt(localStorage.getItem('classicParticipants')) || 0;
        
        this.questions = [
            {
                text: "Bu eser, bir felaket sırasında neredeyse tamamen yok oldu ve geriye sadece az sayıda kopya ile birkaç detay kaldı. Yine de sanat tarihinin en etkileyici eserlerinden biri olarak kabul edilir. Eserin yaratıldığı dönemde sanatçısı, kilisenin baskısı altındaydı ve eserinin bir bölümü dönemin sansürüne uğradı. Ancak günümüze kalan fragmanları bile onun dehasını ortaya koymaktadır. İlginç bir şekilde, modern teknoloji sayesinde eserin kayıp kısımlarına dair ilginç ipuçları ortaya çıkarılmıştır. Bu ipuçları bir yapay zeka algoritmasıyla yeniden canlandırılmıştır.",
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
        this.initAnimations();
        this.updateDiamondCount();
        this.updateAttemptsCount();
        
        // Arayüzü güncelle
        document.querySelector('.participant-count').textContent = this.participantCount;
        document.querySelector('.prize-amount').textContent = `${this.currentPrize} 💎`;
        
        // Katılım durumunu kontrol et
        if (this.diamondManager.isTaskCompleted(this.participationTaskId)) {
            // Kullanıcı zaten katılmış, direkt soruyu göster
            this.loadQuestion();
            this.createHintButtons();
        } else {
            // Kullanıcı henüz katılmamış, onay penceresini göster
            this.showEntryConfirmation();
        }
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
        hintsContent.innerHTML = '';

        this.currentQuestion.hints.forEach((hint, index) => {
            const hintItem = document.createElement('div');
            hintItem.className = `hint-item ${this.unlockedHints.has(index) ? 'unlocked' : 'locked'}`;
            
            const hintText = this.unlockedHints.has(index) ? hint.text : '🔒 Bu ipucunu görmek için kilidi açın';
            
            hintItem.innerHTML = `
                <span class="hint-text">${hintText}</span>
                ${this.unlockedHints.has(index) ? '' : `
                    <span class="hint-cost">
                        ${hint.cost} 💎
                    </span>
                `}
            `;

            if (!this.unlockedHints.has(index)) {
                hintItem.addEventListener('click', () => this.unlockHint(index, hint.cost));
            }

            hintsContent.appendChild(hintItem);
        });
    }

    unlockHint(index, cost) {
        if (this.diamondManager.getDiamonds() >= cost) {
            this.diamondManager.removeDiamonds(cost);
            this.updateDiamondCount();
            
            // İpucunu aç ve localStorage'a kaydet
            this.unlockedHints.add(index);
            localStorage.setItem('unlockedHints', JSON.stringify([...this.unlockedHints]));
            
            this.createHintButtons();
            this.notificationManager.show('İpucu başarıyla açıldı!', 'success');
        } else {
            this.notificationManager.show('Yetersiz elmas! Daha fazla elmas kazanmak için görevleri tamamlayın.', 'error');
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

        // Hak satın alma penceresi kontrolleri
        const buyAttemptsBtn = document.querySelector('.buy-attempts-btn');
        const attemptsOverlay = document.querySelector('.attempts-overlay');
        const attemptsWindow = document.querySelector('.attempts-window');
        const closeAttemptsBtn = document.querySelector('.close-attempts-btn');
        const attemptPackages = document.querySelectorAll('.attempt-package');
        const insufficientDiamondsWarning = document.querySelector('.insufficient-diamonds');

        buyAttemptsBtn.addEventListener('click', () => {
            attemptsOverlay.style.display = 'flex';
            attemptsWindow.style.display = 'block';
            this.updateDiamondCount();
        });

        closeAttemptsBtn.addEventListener('click', () => {
            attemptsOverlay.style.display = 'none';
            attemptsWindow.style.display = 'none';
        });

        attemptsOverlay.addEventListener('click', (e) => {
            if (e.target === attemptsOverlay) {
                attemptsOverlay.style.display = 'none';
                attemptsWindow.style.display = 'none';
            }
        });

        attemptPackages.forEach(packageItem => {
            packageItem.addEventListener('click', () => {
                const amount = parseInt(packageItem.dataset.amount);
                const cost = parseInt(packageItem.dataset.cost);
                const currentDiamonds = this.diamondManager.getDiamonds();

                if (currentDiamonds >= cost) {
                    // Elmasları azalt
                    this.diamondManager.removeDiamonds(cost);
                    this.updateDiamondCount();
                    
                    // Hakları artır
                    this.attempts += amount;
                    this.updateAttemptsCount();

                    // Input ve submit butonunu tekrar aktif et
                    const answerInput = document.querySelector('.answer-input');
                    const submitBtn = document.querySelector('.submit-btn');
                    answerInput.disabled = false;
                    answerInput.placeholder = 'Cevabınızı buraya yazın...';
                    submitBtn.disabled = false;

                    // Pencereyi kapat
                    attemptsOverlay.style.display = 'none';
                    attemptsWindow.style.display = 'none';

                    // Başarılı bildirim göster
                    this.notificationManager.show(`${amount} adet cevaplama hakkı satın alındı!`, 'success');
                } else {
                    // Yetersiz elmas uyarısı
                    insufficientDiamondsWarning.style.display = 'flex';
                    setTimeout(() => {
                        insufficientDiamondsWarning.style.display = 'none';
                    }, 3000);
                }
            });
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
        if (this.attempts <= 0) {
            this.notificationManager.show('Cevaplama hakkınız kalmadı! Yeni hak satın alın.', 'error');
            return;
        }

        const answerInput = document.querySelector('.answer-input');
        const userAnswer = answerInput.value.trim().toLowerCase();

        if (userAnswer === this.currentQuestion.answer) {
            this.handleCorrectAnswer();
        } else {
            this.handleWrongAnswer();
        }

        // Cevap gönderildikten sonra hakkı azalt ve localStorage'a kaydet
        this.attempts--;
        this.updateAttemptsCount();

        answerInput.value = '';
    }

    handleCorrectAnswer() {
        // Kazanılan elmasları ekle
        this.diamondManager.addDiamonds(this.currentPrize);
        this.updateDiamondCount();

        // Tebrik penceresini oluştur
        const overlay = document.createElement('div');
        overlay.className = 'completion-overlay';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.9)'; // Arkaplan opaklığını artır
        
        overlay.innerHTML = `
            <div class="completion-content" style="background: var(--bg-card); border: 2px solid var(--primary-light);">
                <h2>Tebrikler!</h2>
                <p>Soruyu doğru cevaplayarak</p>
                <div class="final-prize">${this.currentPrize} 💎</div>
                <p>kazandınız!</p>
                <div class="share-buttons">
                    <button class="share-btn whatsapp">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824zm-3.423-14.416c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm.029 18.88c-1.161 0-2.305-.292-3.318-.844l-3.677.964.984-3.595c-.607-1.052-.927-2.246-.926-3.468.001-3.825 3.113-6.937 6.937-6.937 1.856.001 3.598.723 4.907 2.034 1.31 1.311 2.031 3.054 2.03 4.908-.001 3.825-3.113 6.938-6.937 6.938z"/>
                        </svg>
                        WhatsApp'ta Paylaş
                    </button>
                    <button class="share-btn twitter">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                        </svg>
                        Twitter'da Paylaş
                    </button>
                </div>
                <button class="back-to-home">Ana Sayfaya Dön</button>
            </div>
        `;

        document.body.appendChild(overlay);

        // Paylaşım butonları için event listener'lar
        overlay.querySelector('.whatsapp').addEventListener('click', () => {
            const text = `Bil Kazan'da soruyu doğru cevaplayarak ${this.currentPrize} elmas kazandım! 🎉`;
            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
        });

        overlay.querySelector('.twitter').addEventListener('click', () => {
            const text = `Bil Kazan'da soruyu doğru cevaplayarak ${this.currentPrize} elmas kazandım! 🎉`;
            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
        });

        // Ana sayfaya dönüş butonu
        overlay.querySelector('.back-to-home').addEventListener('click', () => {
            window.location.href = 'index.html';
        });

        // Katılım görevini tamamlandı olarak işaretle
        this.diamondManager.completeTask(this.participationTaskId);

        // Tebrik animasyonu
        gsap.from('.completion-content', {
            scale: 0.8,
            opacity: 0,
            duration: 0.5,
            ease: 'back.out'
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

    showEntryConfirmation() {
        const overlay = document.createElement('div');
        overlay.className = 'entry-confirmation-overlay';
        overlay.innerHTML = `
            <div class="entry-confirmation">
                <h2>Soruya Katılmak İster Misiniz?</h2>
                <div class="entry-info">
                    <div class="fee-info">
                        <p>Katılım Ücreti:</p>
                        <div class="fee-amount">
                            <span>${this.entryFee}</span>
                            <svg class="diamond-icon" viewBox="0 0 24 24" width="20" height="20">
                                <path fill="currentColor" d="M12,2L2,12L12,22L22,12L12,2Z"/>
                            </svg>
                        </div>
                    </div>
                    <div class="prize-info">
                        <p>Güncel Ödül:</p>
                        <div class="current-prize">
                            <span>${this.currentPrize}</span>
                            <svg class="diamond-icon" viewBox="0 0 24 24" width="20" height="20">
                                <path fill="currentColor" d="M12,2L2,12L12,22L22,12L12,2Z"/>
                            </svg>
                        </div>
                    </div>
                </div>
                <div class="entry-buttons">
                    <button class="confirm-entry">Katıl</button>
                    <button class="cancel-entry">Vazgeç</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // Katılım onayı
        overlay.querySelector('.confirm-entry').addEventListener('click', () => {
            if (this.diamondManager.getDiamonds() >= this.entryFee) {
                this.diamondManager.removeDiamonds(this.entryFee);
                this.updateDiamondCount();
                this.participantCount++;
                this.currentPrize += this.entryFee;
                
                // Değerleri localStorage'a kaydet
                localStorage.setItem('classicPrize', this.currentPrize.toString());
                localStorage.setItem('classicParticipants', this.participantCount.toString());
                
                // Katılım durumunu kaydet
                this.diamondManager.completeTask(this.participationTaskId);
                
                // Arayüzü güncelle
                document.querySelector('.participant-count').textContent = this.participantCount;
                document.querySelector('.prize-amount').textContent = `${this.currentPrize} 💎`;
                
                // Soru içeriğini yükle
                this.loadQuestion();
                this.createHintButtons();
                
                // Başarılı katılım animasyonu
                gsap.to('.prize-amount', {
                    scale: 1.2,
                    duration: 0.3,
                    yoyo: true,
                    repeat: 1
                });
                
                this.notificationManager.show('Soruya başarıyla katıldınız!', 'success');
                overlay.remove();
            } else {
                this.notificationManager.show('Yeterli elmasınız yok!', 'error');
                gsap.to('.entry-confirmation', {
                    x: [-10, 10, -10, 10, 0],
                    duration: 0.4,
                    ease: 'power2.out'
                });
            }
        });

        // Katılımı reddet
        overlay.querySelector('.cancel-entry').addEventListener('click', () => {
            window.location.href = 'index.html';
        });

        // Giriş animasyonu
        gsap.from('.entry-confirmation', {
            scale: 0.8,
            opacity: 0,
            duration: 0.5,
            ease: 'back.out'
        });
    }

    updateAttemptsCount() {
        const attemptsCount = document.querySelector('.attempts-count');
        if (attemptsCount) {
            attemptsCount.textContent = this.attempts;
        }
        // Hak sayısını localStorage'a kaydet
        localStorage.setItem('classicAttempts', this.attempts.toString());

        // Eğer haklar bittiyse input'u devre dışı bırak
        const answerInput = document.querySelector('.answer-input');
        const submitBtn = document.querySelector('.submit-btn');
        if (this.attempts <= 0 && answerInput && submitBtn) {
            answerInput.disabled = true;
            answerInput.placeholder = 'Cevaplama hakkınız kalmadı...';
            submitBtn.disabled = true;
        }
    }
}

// Oyunu başlat
document.addEventListener('DOMContentLoaded', () => {
    new ClassicGame();
}); 