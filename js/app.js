import { GameManager } from './gameManager.js';
import { UIManager } from './uiManager.js';
import { NotificationManager } from './notificationManager.js';

class App {
    constructor() {
        this.gameManager = new GameManager();
        this.uiManager = new UIManager();
        this.notificationManager = new NotificationManager();
        this.currentUser = this.getCurrentUser();
        
        this.init();
    }

    init() {
        this.updateUserInfo();
        
        // Initialize GSAP animations
        gsap.from('.logo h1', {
            duration: 1,
            y: -50,
            opacity: 0,
            ease: 'power3.out'
        });

        gsap.from('.story-section', {
            duration: 1,
            y: 30,
            opacity: 0,
            delay: 0.5,
            ease: 'power3.out'
        });

        gsap.from('.mode-card', {
            duration: 0.8,
            y: 50,
            opacity: 0,
            stagger: 0.2,
            delay: 1,
            ease: 'power3.out'
        });

        this.setupEventListeners();
    }

    getCurrentUser() {
        const userJson = localStorage.getItem('currentUser');
        return userJson ? JSON.parse(userJson) : null;
    }

    updateUserInfo() {
        const usernameElement = document.querySelector('.username');
        const loginButton = document.querySelector('.login-btn');

        if (this.currentUser) {
            usernameElement.textContent = `${this.currentUser.name} ${this.currentUser.surname}`;
            loginButton.textContent = 'Çıkış Yap';
        } else {
            usernameElement.textContent = 'Misafir Kullanıcı';
            loginButton.textContent = 'Giriş Yap';
        }
    }

    setupEventListeners() {
        // Mode selection
        document.querySelectorAll('.play-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (!this.currentUser) {
                    this.notificationManager.show('Oynamak için giriş yapmalısınız!', 'error');
                    return;
                }

                const mode = e.target.closest('.mode-card').classList.contains('classic-mode') 
                    ? 'classic' 
                    : 'pyramid';
                this.startGame(mode);
            });
        });

        // Login/Logout button
        document.querySelector('.login-btn').addEventListener('click', () => {
            if (this.currentUser) {
                localStorage.removeItem('currentUser');
                this.currentUser = null;
                this.updateUserInfo();
                this.notificationManager.show('Çıkış yapıldı!', 'success');
            } else {
                window.location.href = 'login.html';
            }
        });

        // Answer submission
        document.querySelector('.answer-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const answer = document.querySelector('.answer-input').value;
            this.submitAnswer(answer);
        });
    }

    startGame(mode) {
        this.gameManager.startGame(mode);
        this.uiManager.showGameArea();
        
        const question = this.gameManager.getCurrentQuestion();
        this.uiManager.updateQuestion(question);
        
        this.notificationManager.show(`${mode === 'classic' ? 'Klasik' : 'Piramit'} mod başlatıldı!`, 'success');
    }

    submitAnswer(answer) {
        const result = this.gameManager.checkAnswer(answer);
        
        if (result.correct) {
            this.notificationManager.show('Doğru cevap! Tebrikler!', 'success');
            this.uiManager.updatePrizePool(this.gameManager.getCurrentPrize());
            
            if (this.gameManager.isGameComplete()) {
                this.gameComplete();
            } else {
                this.nextQuestion();
            }
        } else {
            this.notificationManager.show('Yanlış cevap! Tekrar deneyin.', 'error');
            if (result.hint) {
                this.uiManager.showHint(result.hint);
            }
        }
    }

    nextQuestion() {
        const question = this.gameManager.getNextQuestion();
        this.uiManager.updateQuestion(question);
    }

    gameComplete() {
        const finalPrize = this.gameManager.getCurrentPrize();
        this.uiManager.showGameComplete(finalPrize);
        this.notificationManager.show(`Tebrikler! ${finalPrize} TL kazandınız!`, 'success');
    }
}

// Start the application
document.addEventListener('DOMContentLoaded', () => {
    new App();
}); 