import { NotificationManager } from './notificationManager.js';
import { DiamondManager } from './diamondManager.js';

class PaymentManager {
    constructor() {
        this.notificationManager = new NotificationManager();
        this.diamondManager = new DiamondManager();
        this.exchangeRate = 0.10; // 1 elmas = 0.10 TL
        this.minimumWithdrawal = 10; // Minimum çekim tutarı
        this.bankList = {
            '0001': 'Ziraat Bankası',
            '0010': 'Türkiye Cumhuriyet Merkez Bankası (TCMB)',
            '0011': 'PTT Bank (Posta ve Telgraf Teşkilatı)',
            '0012': 'Halkbank',
            '0013': 'DenizBank',
            '0015': 'VakıfBank',
            '0032': 'Türk Ekonomi Bankası (TEB)',
            '0046': 'Akbank',
            '0062': 'Garanti BBVA',
            '0064': 'İş Bankası',
            '0067': 'Yapı Kredi Bankası',
            '0098': 'HSBC Türkiye',
            '0099': 'Alternatif Bank',
            '0103': 'Türk Eximbank',
            '0105': 'Türkiye Kalkınma ve Yatırım Bankası',
            '0111': 'QNB Finansbank',
            '0123': 'ING Bank',
            '0126': 'Albaraka Türk Katılım Bankası',
            '0131': 'Türk Bankası',
            '0134': 'DenizBank (İkinci kod)',
            '0143': 'Odeabank',
            '0146': 'Şekerbank',
            '0149': 'ICBC Turkey Bank',
            '0154': 'Fibabanka',
            '0159': 'Anadolubank',
            '0162': 'Burgan Bank',
            '0203': 'Türkiye Finans Katılım Bankası',
            '0205': 'Ziraat Katılım Bankası',
            '0206': 'Kuveyt Türk Katılım Bankası',
            '0210': 'Vakıf Katılım Bankası',
            '0211': 'Emlak Katılım Bankası'
        };
        this.initializeElements();
        this.addEventListeners();
        this.loadBalances();
        this.setupAutoRefresh();
    }

    initializeElements() {
        // Form elements
        this.diamondAmount = document.getElementById('diamondAmount');
        this.tlAmount = document.getElementById('tlAmount');
        this.withdrawAmount = document.getElementById('withdrawAmount');
        this.ibanGroup = document.getElementById('ibanGroup');
        this.iban = document.getElementById('iban');
        this.bankInfo = document.getElementById('bankInfo');
        this.bankName = this.bankInfo.querySelector('.bank-name');
        
        // IBAN segments
        this.ibanSegments = {
            control: this.ibanGroup.querySelector('.control input'),
            bank: this.ibanGroup.querySelector('.bank input'),
            branch: this.ibanGroup.querySelector('.branch input'),
            account: this.ibanGroup.querySelector('.account input')
        };

        // Buttons
        this.convertBtn = document.querySelector('.convert-btn');
        this.withdrawBtn = document.querySelector('.withdraw-btn');
        
        // Balance displays
        this.diamondBalance = document.querySelector('.diamond-balance');
        this.tlBalance = document.querySelector('.tl-balance');
        this.tlEquivalent = document.querySelector('.tl-equivalent');
        this.availableWithdrawal = document.querySelector('.available-withdrawal');

        // IBAN alanını varsayılan olarak göster
        if (this.ibanGroup) {
            this.ibanGroup.classList.remove('hidden');
        }
    }

    setupAutoRefresh() {
        // Her 30 saniyede bir bakiyeleri güncelle
        setInterval(() => this.loadBalances(), 30000);
    }

    addEventListeners() {
        // Elmas miktarı değiştiğinde TL karşılığını hesapla
        this.diamondAmount.addEventListener('input', () => {
            const diamonds = parseFloat(this.diamondAmount.value) || 0;
            const tl = (diamonds * this.exchangeRate).toFixed(2);
            this.tlAmount.value = tl + ' ₺';
        });

        // Elmas bozdurma butonu
        this.convertBtn.addEventListener('click', () => this.convertDiamonds());

        // Çekilecek miktar değiştiğinde IBAN alanını göster/gizle
        this.withdrawAmount.addEventListener('input', () => {
            const amount = parseFloat(this.withdrawAmount.value) || 0;
            if (amount >= this.minimumWithdrawal) {
                this.ibanGroup.classList.add('visible');
            } else {
                this.ibanGroup.classList.remove('visible');
            }
        });

        // IBAN segment event listeners
        this.initializeSegments();

        // Para çekme butonu
        this.withdrawBtn.addEventListener('click', () => this.requestWithdrawal());
    }

    initializeSegments() {
        // Her segment için input event listener ekle
        Object.entries(this.ibanSegments).forEach(([key, input]) => {
            input.addEventListener('input', (e) => {
                const maxLength = this.getMaxLength(key);
                let value = e.target.value.replace(/\D/g, '');
                
                // Maksimum uzunluğu kontrol et
                if (value.length > maxLength) {
                    value = value.slice(0, maxLength);
                }
                
                // Input değerini güncelle
                e.target.value = value;
                
                // Segment doluysa sonrakine geç
                if (value.length === maxLength) {
                    const nextSegment = this.getNextSegment(key);
                    if (nextSegment) {
                        nextSegment.focus();
                    }
                }
                
                this.updateIBAN();
            });

            // Backspace tuşu için özel işlem
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && e.target.value.length === 0) {
                    const prevSegment = this.getPrevSegment(key);
                    if (prevSegment) {
                        e.preventDefault();
                        prevSegment.focus();
                        // Önceki segmentin son karakterini sil
                        prevSegment.value = prevSegment.value.slice(0, -1);
                        this.updateIBAN();
                    }
                }
            });

            // Yapıştırma işlemi için
            input.addEventListener('paste', (e) => {
                e.preventDefault();
                const pastedText = (e.clipboardData || window.clipboardData).getData('text');
                const numbers = pastedText.replace(/\D/g, '');
                
                // Mevcut segmentin maksimum uzunluğunu al
                const maxLength = this.getMaxLength(key);
                
                // Bu segment için kullanılacak rakamlar
                let segmentValue = numbers.slice(0, maxLength);
                input.value = segmentValue;
                
                // Kalan rakamlar varsa sonraki segmentlere dağıt
                if (numbers.length > maxLength) {
                    let remainingNumbers = numbers.slice(maxLength);
                    let currentKey = key;
                    
                    while (remainingNumbers.length > 0) {
                        const nextSegment = this.getNextSegment(currentKey);
                        if (!nextSegment) break;
                        
                        const nextMaxLength = this.getMaxLength(this.getNextKey(currentKey));
                        const nextValue = remainingNumbers.slice(0, nextMaxLength);
                        nextSegment.value = nextValue;
                        
                        remainingNumbers = remainingNumbers.slice(nextMaxLength);
                        currentKey = this.getNextKey(currentKey);
                    }
                }
                
                this.updateIBAN();
                
                // Son segmente geç
                const nextSegment = this.getNextSegment(key);
                if (nextSegment) {
                    nextSegment.focus();
                }
            });
        });
    }

    getMaxLength(key) {
        const maxLengths = {
            control: 2,
            bank: 4,
            branch: 6,
            account: 12
        };
        return maxLengths[key] || 0;
    }

    getNextKey(currentKey) {
        const segments = Object.keys(this.ibanSegments);
        const currentIndex = segments.indexOf(currentKey);
        if (currentIndex < segments.length - 1) {
            return segments[currentIndex + 1];
        }
        return null;
    }

    getNextSegment(currentKey) {
        const segments = Object.keys(this.ibanSegments);
        const currentIndex = segments.indexOf(currentKey);
        if (currentIndex < segments.length - 1) {
            return this.ibanSegments[segments[currentIndex + 1]];
        }
        return null;
    }

    getPrevSegment(currentKey) {
        const segments = Object.keys(this.ibanSegments);
        const currentIndex = segments.indexOf(currentKey);
        if (currentIndex > 0) {
            return this.ibanSegments[segments[currentIndex - 1]];
        }
        return null;
    }

    updateIBAN() {
        // Tüm segmentleri birleştir
        const control = this.ibanSegments.control.value;
        const bank = this.ibanSegments.bank.value;
        const branch = this.ibanSegments.branch.value;
        const account = this.ibanSegments.account.value;

        // Hidden IBAN input'unu güncelle
        const fullIBAN = `TR${control}${bank}${branch}${account}`;
        this.iban.value = fullIBAN;

        // Banka bilgisini göster
        if (bank.length === 4) {
            const bankName = this.bankList[bank];
            if (bankName) {
                this.bankName.textContent = bankName;
                this.bankInfo.classList.add('visible');
                this.ibanGroup.classList.remove('error');
                
                // Tüm alanlar doluysa başarılı göster
                if (fullIBAN.length === 26) {
                    this.ibanGroup.classList.add('success');
                } else {
                    this.ibanGroup.classList.remove('success');
                }
            } else {
                this.bankName.textContent = 'Geçersiz Banka Kodu';
                this.bankInfo.classList.add('visible');
                this.ibanGroup.classList.add('error');
                this.ibanGroup.classList.remove('success');
            }
        } else {
            this.bankInfo.classList.remove('visible');
            this.ibanGroup.classList.remove('error', 'success');
        }
    }

    loadBalances() {
        // DiamondManager'dan elmas bakiyesini al
        const diamonds = this.diamondManager.getDiamonds();
        const tl = parseFloat(localStorage.getItem('tlBalance')) || 0;

        this.updateBalances(diamonds, tl);
    }

    updateBalances(diamonds, tl) {
        // Bakiyeleri güncelle ve göster
        this.diamondBalance.textContent = Number(diamonds).toLocaleString() + ' 💎';
        this.tlBalance.textContent = Number(tl).toFixed(2) + ' ₺';
        this.tlEquivalent.textContent = 'Toplam: ' + (diamonds * this.exchangeRate).toFixed(2) + ' ₺';
        this.availableWithdrawal.textContent = 'Çekilebilir Bakiye: ' + Number(tl).toFixed(2) + ' ₺';

        // TL bakiyesini kaydet
        localStorage.setItem('tlBalance', tl);
    }

    convertDiamonds() {
        const diamonds = parseFloat(this.diamondAmount.value) || 0;
        if (diamonds <= 0) {
            this.notificationManager.show('Lütfen geçerli bir elmas miktarı girin', 'error');
            return;
        }

        const currentDiamonds = this.diamondManager.getDiamonds();
        if (diamonds > currentDiamonds) {
            this.notificationManager.show('Yetersiz elmas bakiyesi', 'error');
            return;
        }

        const tlValue = diamonds * this.exchangeRate;
        const currentTL = parseFloat(localStorage.getItem('tlBalance')) || 0;

        // Elmasları azalt
        this.diamondManager.removeDiamonds(diamonds);

        // TL bakiyesini güncelle
        this.updateBalances(
            this.diamondManager.getDiamonds(),
            currentTL + tlValue
        );

        // Formu temizle
        this.diamondAmount.value = '';
        this.tlAmount.value = '';

        this.notificationManager.show(`${diamonds} elmas başarıyla TL'ye çevrildi`, 'success');
    }

    requestWithdrawal() {
        const amount = parseFloat(this.withdrawAmount.value) || 0;
        const currentTL = parseFloat(localStorage.getItem('tlBalance')) || 0;

        if (amount < this.minimumWithdrawal) {
            this.notificationManager.show(`Minimum çekim tutarı ${this.minimumWithdrawal} TL'dir`, 'error');
            return;
        }

        if (amount > currentTL) {
            this.notificationManager.show('Yetersiz TL bakiyesi', 'error');
            return;
        }

        const iban = this.iban.value.trim();
        if (!this.validateIBAN(iban)) {
            this.notificationManager.show('Lütfen geçerli bir IBAN girin', 'error');
            return;
        }

        // Bakiyeyi güncelle
        this.updateBalances(
            this.diamondManager.getDiamonds(),
            currentTL - amount
        );

        // Formu temizle
        this.withdrawAmount.value = '';
        this.iban.value = '';
        this.bankInfo.classList.remove('visible');
        this.ibanGroup.classList.remove('error', 'success');

        this.notificationManager.show(`${amount} TL çekim talebiniz alınmıştır`, 'success');
    }

    validateIBAN(iban) {
        // Boşlukları kaldır
        iban = iban.replace(/\s/g, '');

        // Format kontrolü (TR + 24 rakam)
        if (!/^TR\d{24}$/.test(iban)) {
            return false;
        }

        // Kontrol basamakları (2 rakam)
        const controlDigits = iban.substring(2, 4);
        if (!/^\d{2}$/.test(controlDigits)) {
            return false;
        }

        // Banka kodu kontrolü (4 rakam)
        const bankCode = iban.substring(4, 8);
        if (!this.bankList[bankCode]) {
            return false;
        }

        // Şube kodu ve hesap numarası kontrolü (18 rakam)
        const accountPart = iban.substring(8);
        if (!/^\d{18}$/.test(accountPart)) {
            return false;
        }

        return true;
    }
}

// Sayfa yüklendiğinde PaymentManager'ı başlat
document.addEventListener('DOMContentLoaded', () => {
    new PaymentManager();
}); 