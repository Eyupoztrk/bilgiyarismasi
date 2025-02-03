export class UIManager {
    constructor() {
        this.gameArea = document.querySelector('.game-area');
        this.questionText = document.querySelector('.question-text');
        this.answerInput = document.querySelector('.answer-input');
        this.prizeAmount = document.querySelector('.prize-amount');
        this.gameModes = document.querySelector('.game-modes');
    }

    showGameArea() {
        // Hide game modes
        gsap.to(this.gameModes, {
            duration: 0.5,
            opacity: 0,
            y: -20,
            onComplete: () => {
                this.gameModes.style.display = 'none';
                this.gameArea.classList.remove('hidden');
                
                // Show game area with animation
                gsap.from(this.gameArea, {
                    duration: 0.5,
                    opacity: 0,
                    y: 20,
                    ease: 'power2.out'
                });
            }
        });
    }

    updateQuestion(question) {
        if (!question) return;

        // Fade out current question
        gsap.to(this.questionText, {
            duration: 0.3,
            opacity: 0,
            y: -10,
            onComplete: () => {
                // Update question text
                this.questionText.innerHTML = `
                    <div class="question-number">Soru ${question.questionNumber}/${question.totalQuestions}</div>
                    <div class="question-content">${question.text}</div>
                `;

                // Clear answer input
                this.answerInput.value = '';

                // Fade in new question
                gsap.to(this.questionText, {
                    duration: 0.3,
                    opacity: 1,
                    y: 0
                });
            }
        });
    }

    updatePrizePool(amount) {
        // Animate prize amount update
        gsap.to(this.prizeAmount, {
            duration: 0.5,
            scale: 1.2,
            ease: 'power2.out',
            onComplete: () => {
                this.prizeAmount.textContent = `${amount} TL`;
                gsap.to(this.prizeAmount, {
                    duration: 0.5,
                    scale: 1,
                    ease: 'power2.in'
                });
            }
        });
    }

    showGameComplete(finalPrize) {
        // Create completion overlay
        const overlay = document.createElement('div');
        overlay.className = 'completion-overlay';
        overlay.innerHTML = `
            <div class="completion-content">
                <h2>Tebrikler!</h2>
                <p>Yarışmayı başarıyla tamamladınız!</p>
                <div class="final-prize">${finalPrize} TL</div>
                <button class="restart-btn">Yeniden Başla</button>
            </div>
        `;

        document.body.appendChild(overlay);

        // Add event listener to restart button
        overlay.querySelector('.restart-btn').addEventListener('click', () => {
            location.reload();
        });

        // Animate overlay
        gsap.from(overlay, {
            duration: 0.5,
            opacity: 0,
            scale: 0.8,
            ease: 'power3.out'
        });
    }

    showHint(hint) {
        if (!hint) return;

        const hintElement = document.createElement('div');
        hintElement.className = 'hint';
        hintElement.textContent = `İpucu: ${hint}`;

        this.questionText.appendChild(hintElement);

        gsap.from(hintElement, {
            duration: 0.3,
            opacity: 0,
            y: 10,
            ease: 'power2.out'
        });
    }
} 