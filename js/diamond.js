import { NotificationManager } from './notificationManager.js';
import { DiamondManager } from './diamondManager.js';

class DiamondGame {
    constructor() {
        this.notificationManager = new NotificationManager();
        this.diamondManager = DiamondManager.getInstance();
        this.completedTasks = [];
        this.totalTasks = 3;
        this.taskLinks = null;
        this.refreshCost = 10; // Yenileme maliyeti
        
        // LocalStorage'dan verileri yükle
        this.loadProgress();
        
        // Task linklerini yükle ve görevleri başlat
        this.loadTaskLinks().then(() => {
            this.initializeTasks();
        });
        
        // Progress bar'ı güncelle
        this.updateProgress();
        
        // Tamamlanmış görevleri işaretle
        this.markCompletedTasks();
    }

    async loadTaskLinks() {
        try {
            const response = await fetch('js/task-links.json');
            this.taskLinks = await response.json();
        } catch (error) {
            console.error('Task linkleri yüklenemedi:', error);
        }
    }

    getRandomLink(category) {
        if (!this.taskLinks) return '#';
        const links = this.taskLinks[category];
        return links[Math.floor(Math.random() * links.length)];
    }

    initializeTasks() {
        const taskItems = document.querySelectorAll('.task-item');
        
        taskItems[0].querySelector('.task-link').href = this.getRandomLink('video_links');
        taskItems[1].querySelector('.task-link').href = this.getRandomLink('reading_links');
        taskItems[2].querySelector('.task-link').href = this.getRandomLink('search_links');

        this.completedTasks = [];
        this.updateProgress();
        this.saveProgress();

        taskItems.forEach(item => {
            item.classList.remove('completed');
            const taskLink = item.querySelector('.task-link');
            taskLink.textContent = 'Göreve Git';
        });
    }

    refreshTasks() {
        this.notificationManager.show('Reklam yükleniyor...', 'info');
        
        setTimeout(() => {
            this.diamondManager.addDiamonds(this.refreshCost);
            this.initializeTasks();
            this.notificationManager.show(`Görevler yenilendi! ${this.refreshCost} 💎 kazandınız!`, 'success');
            this.saveProgress();
        }, 2000);
    }

    loadProgress() {
        const savedProgress = localStorage.getItem('diamondGameProgress');
        if (savedProgress) {
            const progress = JSON.parse(savedProgress);
            this.completedTasks = progress.completedTasks || [];
        }
    }

    saveProgress() {
        const progress = {
            completedTasks: this.completedTasks
        };
        localStorage.setItem('diamondGameProgress', JSON.stringify(progress));
    }

    updateProgress() {
        const progress = (this.completedTasks.length / this.totalTasks) * 100;
        document.querySelector('.progress').style.width = `${progress}%`;
        document.querySelector('.progress-text').textContent = 
            `${this.completedTasks.length}/${this.totalTasks} Görev Tamamlandı`;
    }

    markCompletedTasks() {
        this.completedTasks.forEach(taskIndex => {
            const taskItem = document.querySelectorAll('.task-item')[taskIndex];
            if (taskItem) {
                taskItem.classList.add('completed');
                const taskLink = taskItem.querySelector('.task-link');
                taskLink.textContent = 'Tamamlandı';
            }
        });
    }

    completeTask(taskIndex, reward) {
        if (this.completedTasks.includes(taskIndex)) {
            this.notificationManager.show('Bu görevi zaten tamamladınız!', 'info');
            return;
        }

        this.completedTasks.push(taskIndex);
        this.diamondManager.addDiamonds(reward);
        this.updateProgress();
        this.markCompletedTasks();

        this.notificationManager.show(`Tebrikler! ${reward} 💎 kazandınız!`, 'success');
        this.saveProgress();

        if (this.completedTasks.length === this.totalTasks) {
            setTimeout(() => {
                this.notificationManager.show('Tüm görevleri tamamladınız! 🎉', 'success');
            }, 1000);
        }
    }
}

window.diamondGame = new DiamondGame();

window.completeTask = (taskIndex, reward) => {
    window.diamondGame.completeTask(taskIndex, reward);
};

window.refreshTasks = () => {
    window.diamondGame.refreshTasks();
}; 