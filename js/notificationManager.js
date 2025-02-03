export class NotificationManager {
    constructor() {
        this.initNotificationsContainer();
    }

    initNotificationsContainer() {
        if (!document.querySelector('.notifications')) {
            const notificationsContainer = document.createElement('div');
            notificationsContainer.className = 'notifications';
            document.body.appendChild(notificationsContainer);
        }
    }

    show(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="message">${message}</span>
            </div>
        `;

        document.querySelector('.notifications').appendChild(notification);

        // Animasyon için GSAP kullan
        gsap.fromTo(notification,
            { 
                x: 100,
                opacity: 0
            },
            { 
                x: 0,
                opacity: 1,
                duration: 0.3,
                ease: 'power2.out'
            }
        );

        // 3 saniye sonra bildirimi kaldır
        setTimeout(() => {
            gsap.to(notification, {
                x: 100,
                opacity: 0,
                duration: 0.3,
                ease: 'power2.in',
                onComplete: () => {
                    notification.remove();
                }
            });
        }, 3000);
    }
} 