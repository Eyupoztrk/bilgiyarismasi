import { NotificationManager } from './notificationManager.js';

class AuthManager {
    constructor() {
        this.notificationManager = new NotificationManager();
        this.loginForm = document.getElementById('loginForm');
        this.registerForm = document.getElementById('registerForm');
        this.tabButtons = document.querySelectorAll('.tab-btn');
        
        this.init();
    }

    init() {
        // Tab değiştirme işlemleri
        this.tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.switchTab(button.dataset.tab);
            });
        });

        // Form gönderme işlemleri
        this.loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        this.registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });

        // Başlangıç animasyonları
        this.initAnimations();
    }

    switchTab(tab) {
        // Tab butonlarını güncelle
        this.tabButtons.forEach(btn => {
            if (btn.dataset.tab === tab) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Formları göster/gizle
        if (tab === 'login') {
            this.loginForm.classList.remove('hidden');
            this.registerForm.classList.add('hidden');
            this.animateForm(this.loginForm);
        } else {
            this.loginForm.classList.add('hidden');
            this.registerForm.classList.remove('hidden');
            this.animateForm(this.registerForm);
        }
    }

    animateForm(form) {
        gsap.fromTo(form,
            { opacity: 0, y: 20 },
            { 
                opacity: 1, 
                y: 0, 
                duration: 0.5,
                ease: 'power2.out'
            }
        );
    }

    handleLogin() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        // Email formatı kontrolü
        if (!this.validateEmail(email)) {
            this.notificationManager.show('Geçerli bir e-posta adresi giriniz.', 'error');
            return;
        }

        // Şifre kontrolü
        if (password.length < 6) {
            this.notificationManager.show('Şifre en az 6 karakter olmalıdır.', 'error');
            return;
        }

        // Örnek kullanıcı kontrolü (gerçek uygulamada API çağrısı yapılacak)
        const mockUser = this.getMockUser(email);
        if (mockUser && mockUser.password === password) {
            this.notificationManager.show('Giriş başarılı!', 'success');
            this.saveUserToLocalStorage(mockUser);
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } else {
            this.notificationManager.show('E-posta veya şifre hatalı.', 'error');
        }
    }

    handleRegister() {
        const email = document.getElementById('registerEmail').value;
        const name = document.getElementById('registerName').value;
        const surname = document.getElementById('registerSurname').value;
        const password = document.getElementById('registerPassword').value;
        const passwordConfirm = document.getElementById('registerPasswordConfirm').value;

        // Email formatı kontrolü
        if (!this.validateEmail(email)) {
            this.notificationManager.show('Geçerli bir e-posta adresi giriniz.', 'error');
            return;
        }

        // Ad ve soyad kontrolü
        if (name.length < 2 || surname.length < 2) {
            this.notificationManager.show('Ad ve soyad en az 2 karakter olmalıdır.', 'error');
            return;
        }

        // Şifre kontrolü
        if (password.length < 6) {
            this.notificationManager.show('Şifre en az 6 karakter olmalıdır.', 'error');
            return;
        }

        // Şifre eşleşme kontrolü
        if (password !== passwordConfirm) {
            this.notificationManager.show('Şifreler eşleşmiyor.', 'error');
            return;
        }

        // Yeni kullanıcı oluştur (gerçek uygulamada API çağrısı yapılacak)
        const newUser = {
            email,
            name,
            surname,
            password,
            registeredAt: new Date().toISOString()
        };

        // Kullanıcıyı kaydet ve giriş yap
        this.saveUserToLocalStorage(newUser);
        this.notificationManager.show('Kayıt başarılı! Yönlendiriliyorsunuz...', 'success');
        
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
    }

    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    getMockUser(email) {
        // Örnek kullanıcı verisi (gerçek uygulamada veritabanından gelecek)
        const mockUsers = {
            'eyupoztrk04@gmail.com': {
                email: 'eyupoztrk04@gmail.com',
                name: 'Test',
                surname: 'Kullanıcı',
                password: 'Eyupoztrk04.',
                registeredAt: '2024-01-01T00:00:00.000Z'
            }
        };
        return mockUsers[email] || null;
    }

    saveUserToLocalStorage(user) {
        const { password, ...userWithoutPassword } = user;
        localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
    }

    initAnimations() {
        gsap.from('.auth-header h1', {
            duration: 1,
            y: -30,
            opacity: 0,
            ease: 'power3.out'
        });

        gsap.from('.auth-tabs', {
            duration: 0.8,
            y: 20,
            opacity: 0,
            delay: 0.3,
            ease: 'power3.out'
        });

        gsap.from('.auth-form', {
            duration: 0.8,
            y: 20,
            opacity: 0,
            delay: 0.5,
            ease: 'power3.out'
        });
    }
}

// Uygulamayı başlat
document.addEventListener('DOMContentLoaded', () => {
    new AuthManager();
}); 