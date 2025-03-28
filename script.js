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
        
        if (!currentPromoCode.trim()) {
            showError('Пожалуйста, введите промокод');
            return;
        }

        createPromoCode(selectedEvent, selectedYear);
    });

    // Функции для отображения состояния
    function showLoading() {
        resultDiv.innerHTML = '<div class="loading">Создание промокода...</div>';
    }

    function showSuccessWithLink(promoCode, eventCode, year) {
        const baseUrl = window.location.origin;
        const params = new URLSearchParams({ event: eventCode, year: year, promo: promoCode });
        const referralPageUrl = `referrals.html?${params.toString()}`;
        
        resultDiv.innerHTML = `
            <div class="success">
                Промокод успешно создан!
                <p>Ссылка для просмотра рефералов: 
                    <span id="referralLink">${baseUrl}/referrals.html?${params.toString()}</span>
                </p>
                <button id="copyButton" class="copy-button">Копировать ссылку</button>
            </div>
        `;

        // Обработчик для кнопки копирования
        document.getElementById('copyButton').addEventListener('click', function() {
            const referralLink = document.getElementById('referralLink').innerText;
            
            navigator.clipboard.writeText(referralLink).then(() => {
                alert('Ссылка скопирована в буфер обмена!');
            }).catch(err => {
                console.error('Ошибка копирования:', err);
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

    document.getElementById('copyButton').addEventListener('click', function() {
        const referralLink = document.getElementById('referralLink').innerText;
        
        navigator.clipboard.writeText(referralLink).then(() => {
            alert('Ссылка скопирована в буфер обмена!');
        }).catch(err => {
            console.error('Ошибка копирования:', err);
        });
    });
});