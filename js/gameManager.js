export class GameManager {
    constructor() {
        this.currentMode = null;
        this.currentQuestionIndex = 0;
        this.currentPrize = 200; // Starting prize
        this.questions = {
            classic: [
                {
                    text: "Bu eser, bir felaket sırasında neredeyse tamamen yok oldu ve geriye sadece az sayıda kopya ile birkaç detay kaldı. Yine de sanat tarihinin en etkileyici eserlerinden biri olarak kabul edilir. Eserin yaratıldığı dönemde sanatçısı, kilisenin baskısı altındaydı ve eserinin bir bölümü dönemin sansürüne uğradı. Ancak günümüze kalan fragmanları bile onun dehasını ortaya koymaktadır. İlginç bir şekilde, modern teknoloji sayesinde eserin kayıp kısımlarına dair ilginç ipuçları ortaya çıkarılmıştır. Bu ipuçları bir yapay zeka algoritmasıyla yeniden canlandırılmıştır",
                    answer: "andromeda",
                    hint: "Samanyolu'na en yakın büyük galaksi..."
                }
            ],
            pyramid: [
                {
                    text: "Bilim insanının uzay gemisinin yakıt türü nedir?",
                    answer: "helyum3",
                    hint: "Ay'da bulunan izotop..."
                },
                {
                    text: "Sinyallerin geldiği yıldız kümesinin adı nedir?",
                    answer: "pleyades",
                    hint: "Yedi kızkardeş olarak da bilinir..."
                },
                {
                    text: "Bilim insanının kullandığı iletişim frekansı kaç MHz?",
                    answer: "1420",
                    hint: "Hidrojen çizgisi frekansı..."
                },
                {
                    text: "Uzay gemisinin yapay zeka sisteminin adı nedir?",
                    answer: "iris",
                    hint: "Gökkuşağı tanrıçası..."
                },
                {
                    text: "Son mesajında bahsettiği gezegen sisteminin koordinatları nedir?",
                    answer: "kepler186",
                    hint: "Yaşanabilir gezegen sistemlerinden biri..."
                }
            ]
        };
    }

    startGame(mode) {
        this.currentMode = mode;
        this.currentQuestionIndex = 0;
        this.currentPrize = 100;
        return this.getCurrentQuestion();
    }

    getCurrentQuestion() {
        const questions = this.questions[this.currentMode];
        if (this.currentQuestionIndex >= questions.length) {
            return null;
        }
        return {
            ...questions[this.currentQuestionIndex],
            questionNumber: this.currentQuestionIndex + 1,
            totalQuestions: questions.length
        };
    }

    getNextQuestion() {
        this.currentQuestionIndex++;
        return this.getCurrentQuestion();
    }

    checkAnswer(answer) {
        const currentQuestion = this.questions[this.currentMode][this.currentQuestionIndex];
        const isCorrect = answer.toLowerCase().trim() === currentQuestion.answer.toLowerCase();
        
        if (isCorrect) {
            this.updatePrize();
        }

        return {
            correct: isCorrect,
            hint: !isCorrect ? currentQuestion.hint : null
        };
    }

    updatePrize() {
        if (this.currentMode === 'classic') {
            this.currentPrize += 50; // Increase prize for classic mode
        } else {
            // Exponential increase for pyramid mode
            this.currentPrize = this.currentPrize * 2;
        }
    }

    getCurrentPrize() {
        return this.currentPrize;
    }

    isGameComplete() {
        return this.currentQuestionIndex >= this.questions[this.currentMode].length - 1;
    }
} 