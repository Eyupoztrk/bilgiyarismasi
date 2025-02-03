export class DiamondManager {
    constructor() {
        this.diamonds = 0;
        this.observers = [];
        this.loadDiamonds();
    }

    // Singleton pattern
    static getInstance() {
        if (!DiamondManager.instance) {
            DiamondManager.instance = new DiamondManager();
        }
        return DiamondManager.instance;
    }

    loadDiamonds() {
        const savedData = localStorage.getItem('userDiamonds');
        if (savedData) {
            this.diamonds = parseInt(savedData);
        }
        this.updateUI();
    }

    saveDiamonds() {
        localStorage.setItem('userDiamonds', this.diamonds.toString());
    }

    addDiamonds(amount) {
        this.diamonds += amount;
        this.saveDiamonds();
        this.updateUI();
    }

    removeDiamonds(amount) {
        if (this.diamonds >= amount) {
            this.diamonds -= amount;
            this.saveDiamonds();
            this.updateUI();
            return true;
        }
        return false;
    }

    getDiamonds() {
        return this.diamonds;
    }

    // Observer pattern için metodlar
    addObserver(callback) {
        this.observers.push(callback);
    }

    removeObserver(callback) {
        this.observers = this.observers.filter(obs => obs !== callback);
    }

    updateUI() {
        // Tüm diamond-balance elementlerini güncelle
        const diamondElements = document.querySelectorAll('.diamond-balance');
        diamondElements.forEach(element => {
            const countSpan = element.querySelector('span') || element;
            countSpan.textContent = this.diamonds;
        });

        // Observer'ları bilgilendir
        this.observers.forEach(callback => callback(this.diamonds));
    }
} 