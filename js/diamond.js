import { NotificationManager } from './notificationManager.js';
import { DiamondManager } from './diamondManager.js';

class DiamondGame {
    constructor() {
        this.notificationManager = new NotificationManager();
        this.diamondManager = DiamondManager.getInstance();
        this.totalTasks = 3;
        this.taskLinks = null;
        this.refreshCost = 10; // Yenileme maliyeti

        // Task linklerini yükle ve görevleri başlat
        this.loadTaskLinks().then(() => {
            this.initializeTasks();
        });
        
        // Progress bar'ı güncelle
        this.updateProgress();
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

        // Tamamlanmış görevleri işaretle
        taskItems.forEach((item, index) => {
            if (this.diamondManager.isTaskCompleted(`task_${index}`)) {
                item.classList.add('completed');
                const taskLink = item.querySelector('.task-link');
                taskLink.textContent = 'Tamamlandı';
                taskLink.style.pointerEvents = 'none';
            } else {
                item.classList.remove('completed');
                const taskLink = item.querySelector('.task-link');
                taskLink.textContent = 'Göreve Git';
                taskLink.style.pointerEvents = 'auto';
            }
        });

        this.updateProgress();
    }

    refreshTasks() {
        if (this.diamondManager.getDiamonds() >= this.refreshCost) {
            this.notificationManager.show('Reklam yükleniyor...', 'info');
            
            setTimeout(() => {
                this.diamondManager.removeDiamonds(this.refreshCost);
                
                // Tüm görevlerin durumlarını sıfırla
                for (let i = 0; i < this.totalTasks; i++) {
                    this.diamondManager.resetTask(`task_${i}`);
                }
                
                this.initializeTasks();
                this.notificationManager.show(`Görevler yenilendi! ${this.refreshCost} 💎 harcandı!`, 'success');
            }, 2000);
        } else {
            this.notificationManager.show('Yeterli elmasınız yok!', 'error');
        }
    }

    updateProgress() {
        const completedCount = this.getCompletedTaskCount();
        const progress = (completedCount / this.totalTasks) * 100;
        document.querySelector('.progress').style.width = `${progress}%`;
        document.querySelector('.progress-text').textContent = 
            `${completedCount}/${this.totalTasks} Görev Tamamlandı`;
    }

    getCompletedTaskCount() {
        let count = 0;
        for (let i = 0; i < this.totalTasks; i++) {
            if (this.diamondManager.isTaskCompleted(`task_${i}`)) {
                count++;
            }
        }
        return count;
    }

    completeTask(taskIndex, reward) {
        const taskId = `task_${taskIndex}`;
        
        if (this.diamondManager.isTaskCompleted(taskId)) {
            this.notificationManager.show('Bu görevi zaten tamamladınız!', 'info');
            return;
        }

        if (this.diamondManager.completeTask(taskId)) {
            this.diamondManager.addDiamonds(reward);
            this.updateProgress();
            
            // Görevi tamamlandı olarak işaretle
            const taskItem = document.querySelectorAll('.task-item')[taskIndex];
            if (taskItem) {
                taskItem.classList.add('completed');
                const taskLink = taskItem.querySelector('.task-link');
                taskLink.textContent = 'Tamamlandı';
                taskLink.style.pointerEvents = 'none';
            }

            this.notificationManager.show(`Tebrikler! ${reward} 💎 kazandınız!`, 'success');

            if (this.getCompletedTaskCount() === this.totalTasks) {
                setTimeout(() => {
                    this.notificationManager.show('Tüm görevleri tamamladınız! 🎉', 'success');
                }, 1000);
            }
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