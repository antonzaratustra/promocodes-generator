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
        currentPromoCode = e.target.value.toUpperCase();
        promoDisplay.textContent = currentPromoCode;
    });

    // Функция для отправки данных в Firebase и Google Sheets
    async function createPromoCode(eventCode, year, promoCode) {
        try {
            // Показываем спиннер
            showLoading();
            
            // Проверяем инициализацию Firebase
            if (typeof firebase === 'undefined') {
                throw new Error('Firebase не инициализирован');
            }

            // Проверяем доступ к коллекции
            if (typeof promoCodesCollection === 'undefined') {
                throw new Error('Коллекция промокодов не доступна');
            }

            try {
                // Создаем запись в Firebase
                const timestamp = firebase.firestore.FieldValue.serverTimestamp();
                await promoCodesCollection.add({
                    promoCode: promoCode,
                    eventCode: eventCode,
                    year: year.toString(),
                    createdAt: timestamp,
                    referralsCount: 0
                });
                console.log('Промокод сохранен в Firebase:', { promoCode, eventCode, year });
            } catch (firebaseError) {
                console.error('Ошибка Firebase:', firebaseError);
                throw firebaseError;
            }

            try {
                // Отправляем данные в Google Apps Script
                const webhookUrl = getWebhookUrl(eventCode);
                const response = await fetch(webhookUrl, {
                    method: 'POST',
                    mode: 'cors', // Добавляем режим CORS
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        mode: 'create',
                        event: eventCode,
                        promoCode: promoCode,
                        year: year
                    })
                });

                // Проверяем ответ
                if (!response.ok) {
                    console.warn('Предупреждение: Не удалось отправить данные в Google Sheets');
                }
            } catch (fetchError) {
                console.warn('Предупреждение: Ошибка отправки в Google Apps Script:', fetchError);
                // Продолжаем выполнение, так как промокод уже создан в Firebase
            }
            
            // Генерируем ссылку на страницу рефералов
            const referralUrl = `/${eventCode}/${year}/${promoCode}`;
            
            // Показываем успешный результат с ссылкой
            showSuccessWithLink(referralUrl);
            
            // Очищаем поле ввода
            promoCodeInput.value = '';
            promoDisplay.textContent = '';
        } catch (error) {
            console.error('Ошибка при создании промокода:', error);
            showError(error.message);
        }
    }

    // Обработчик кнопки создания
    createButton.addEventListener('click', function() {
        const selectedEvent = eventSelect.value;
        const selectedYear = yearSelect.value;
        
        if (!currentPromoCode.trim()) {
            showError('Пожалуйста, введите промокод');
            return;
        }

        createPromoCode(selectedEvent, selectedYear, currentPromoCode);
    });

    // Функции для отображения состояния
    function showLoading() {
        resultDiv.innerHTML = '<div class="loading">Создание промокода...</div>';
    }

    function showSuccessWithLink(referralUrl) {
        const baseUrl = window.location.origin;
        // Создаем URL для страницы рефералов с параметрами
        const [_, eventCode, year, promoCode] = referralUrl.split('/');
        const params = new URLSearchParams({ event: eventCode, year: year, promo: promoCode });
        const referralPageUrl = `referrals.html?${params.toString()}`;
        
        resultDiv.innerHTML = `
            <div class="success">
                Промокод успешно создан!
                <p>Таблица добавлена в Google Drive.</p>
                <p>Ссылка для просмотра рефералов: 
                    <a href="${referralPageUrl}">${baseUrl}${referralUrl}</a>
                </p>
            </div>
        `;
    }

    function showError(message) {
        resultDiv.innerHTML = `
            <div class="error">${message}</div>
        `;
    }
});