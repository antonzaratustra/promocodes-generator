document.addEventListener('DOMContentLoaded', function() {
    const promoCodeInput = document.getElementById('promoCode');
    const promoDisplay = document.getElementById('promoDisplay');
    const createButton = document.getElementById('createButton');
    const resultDiv = document.getElementById('result');
    const eventSelect = document.getElementById('eventSelect');
    const yearSelect = document.getElementById('yearSelect');

    // Инициализация выбора года
    initYearSelect();

    // Функция для заполнения select с годами
    function initYearSelect() {
        const currentYear = new Date().getFullYear();
        for (let year = currentYear; year <= currentYear + 2; year++) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            yearSelect.appendChild(option);
        }
    }

    // Хранение промокода в верхнем регистре
    let currentPromoCode = '';

    // Обновление отображения промокода в реальном времени
    promoCodeInput.addEventListener('input', function(e) {
        // Получаем введенное значение
        let value = e.target.value;
        
        // Проверяем, содержит ли введенное значение недопустимые символы
        if (/[^A-Za-z0-9]/.test(value)) {
            // Если есть недопустимые символы, показываем уведомление
            showNotification('Используйте только латинские буквы и цифры без пробелов и спецсимволов', 'error');
            
            // Удаляем все недопустимые символы
            value = value.replace(/[^A-Za-z0-9]/g, '');
        }
        
        // Преобразуем в верхний регистр
        value = value.toUpperCase();
        
        // Обновляем значение в инпуте
        e.target.value = value;
        currentPromoCode = value;
        promoDisplay.textContent = value;
    });

    // Функция для проверки валидности промокода
    function isValidPromoCode(code) {
        // Проверяем на пустоту
        if (!code.trim()) {
            showError('Пожалуйста, введите промокод');
            return false;
        }
        
        // Проверяем на длину (минимум 4 символа)
        if (code.length < 4) {
            showError('Промокод должен содержать минимум 4 символа');
            return false;
        }
        
        // Проверяем, содержит ли недопустимые символы
        if (/[^A-Za-z0-9]/.test(code)) {
            showError('Используйте только латинские буквы и цифры без пробелов и спецсимволов');
            return false;
        }
        
        return true;
    }

    // Функция для отправки данных в Firebase и Google Sheets
    async function createPromoCode(eventCode, year) {
        try {
            console.log('Создаем промокод:', { eventCode, year, promoCode: currentPromoCode });

            // Сохраняем в Firebase
            const docRef = await promoCodesCollection.add({
                promoCode: currentPromoCode,
                eventCode: eventCode,
                year: year,
                createdAt: new Date().toISOString()
            });

            console.log('Промокод успешно сохранен в Firebase с ID:', docRef.id);
            
            // Показываем успешное создание
            showSuccessWithLink(currentPromoCode, eventCode, year);
            
        } catch (error) {
            console.error('Ошибка создания промокода:', error);
            alert('Произошла ошибка при создании промокода. Попробуйте еще раз.');
        }
    }

    // Обработчик кнопки создания
    createButton.addEventListener('click', function() {
        const selectedEvent = eventSelect.value;
        const selectedYear = yearSelect.value;
        
        if (!isValidPromoCode(currentPromoCode)) {
            return;
        }

        createPromoCode(selectedEvent, selectedYear);
    });

    // Функции для отображения состояния
    function showLoading() {
        resultDiv.innerHTML = '<div class="loading">Создание промокода...</div>';
    }

    function showSuccessWithLink(promoCode, eventCode, year) {
        // Создаем относительный URL
        const relativeUrl = `referrals.html?event=${eventCode}&year=${year}&promo=${promoCode}`;
        
        // Получаем полный URL сайта
        const baseUrl = window.location.origin + window.location.pathname.replace('index.html', '');
        const fullUrl = baseUrl + relativeUrl;
        
        resultDiv.innerHTML = `
            <div class="success">
                Промокод успешно создан!
                <p>Ссылка для просмотра рефералов: 
                    <span id="referralLink">${fullUrl}</span>
                </p>
                <button id="copyButton" class="copy-button">Копировать ссылку</button>
            </div>
        `;

        // Обработчик для кнопки копирования
        document.getElementById('copyButton').addEventListener('click', function() {
            const referralLink = document.getElementById('referralLink').innerText;
            
            navigator.clipboard.writeText(referralLink).then(() => {
                showNotification('Ссылка скопирована в буфер обмена!', 'success');
            }).catch(err => {
                console.error('Ошибка копирования:', err);
                showNotification('Не удалось скопировать ссылку', 'error');
            });
        });
    }

    function showError(message) {
        resultDiv.innerHTML = `
            <div class="error">
                <p>${message}</p>
                ${message.includes('Google Sheets') ? 
                    '<p>Промокод сохранен в системе и будет доступен в админ-панели.</p>' : 
                    ''}
            </div>
        `;
    }

    // Функция показа уведомления
    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Удаляем уведомление через 3 секунды
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
});