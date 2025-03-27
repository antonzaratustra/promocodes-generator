document.addEventListener('DOMContentLoaded', function() {
    const promoCodeInput = document.getElementById('promoCode');
    const promoDisplay = document.getElementById('promoDisplay');
    const createButton = document.getElementById('createButton');
    const resultDiv = document.getElementById('result');
    const eventSelect = document.getElementById('eventSelect');

    // Хранение промокода в верхнем регистре
    let currentPromoCode = '';

    // Обновление отображения промокода в реальном времени
    promoCodeInput.addEventListener('input', function(e) {
        currentPromoCode = e.target.value.toUpperCase();
        promoDisplay.textContent = currentPromoCode;
    });

    // Функция для отправки вебхука
    async function sendWebhook(eventType) {
        try {
            // Показываем спиннер
            showLoading();
            
            // Выбираем правильный URL вебхука в зависимости от мероприятия
            let webhookUrl = '';
            switch(eventType) {
                case 'event1': // RestaurantWeek Moscow
                case 'event2': // RestaurantWeek Dubai RU
                    webhookUrl = 'https://script.google.com/macros/s/AKfycbzw8Ga0XSDKaKx-lFnudftrI41O_pYT1vSG0xXhMjSgkJa-i2MgFOb_lSdRH0PdvysI6g/exec';
                    break;
                case 'event3': // RestaurantWeek Dubai ENG
                    webhookUrl = 'https://script.google.com/macros/s/AKfycbyHD_MJgFv2dZOCyIpg61r7s4rP2aTw4fKH1wHy5mkySnVIIM6P52Lv93m_d-UD_6XdUw/exec';
                    break;
                case 'event4': // SalonWeek Moscow
                case 'event5': // SalonWeek Dubai RU
                    webhookUrl = 'https://script.google.com/macros/s/AKfycbxDqj8AQS_VZ4fgrw3thQKIKBbyOdf1YJf0Rew_ipKXlcpyqIbkB75YJwl_rR2lJXcLdw/exec';
                    break;
                case 'event6': // SalonWeek Dubai ENG
                    webhookUrl = 'https://script.google.com/macros/s/AKfycbzCY7G1GyeIudhgtsIMB-v29Fhlbq1G0M0HUSGTjtqIaKhYrUKcq7tmuAggzVQHoFCp/exec';
                    break;
            }

            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    event: eventType,
                    promoCode: currentPromoCode
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                if (data.error) {
                    throw new Error(data.error);
                }
                
                showSuccess(data.spreadsheetUrl);
                // Очищаем поле ввода
                promoCodeInput.value = '';
                promoDisplay.textContent = '';
            } else {
                throw new Error('Ошибка при создании промокода');
            }
        } catch (error) {
            showError(error.message);
        }
    }

    // Обработчик кнопки создания
    createButton.addEventListener('click', function() {
        const selectedEvent = eventSelect.value;
        if (!currentPromoCode.trim()) {
            showError('Пожалуйста, введите промокод');
            return;
        }

        sendWebhook(selectedEvent);
    });

    // Функции для отображения состояния
    function showLoading() {
        resultDiv.innerHTML = '<div class="loading">Создание промокода...</div>';
    }

    function showSuccess(url) {
        resultDiv.innerHTML = `
            <div class="success">
                Промокод успешно создан!
                <p>Ссылка на таблицу: <a href="${url}" target="_blank">${url}</a></p>
            </div>
        `;
    }

    function showError(message) {
        resultDiv.innerHTML = `
            <div class="error">${message}</div>
        `;
    }
});
