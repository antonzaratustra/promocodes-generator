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

    // Функция для отправки вебхука без ожидания ответа
    async function sendWebhook(eventType) {
        try {
            // Показываем спиннер
            showLoading();
            
            // Выбираем правильный URL вебхука в зависимости от мероприятия
            let webhookUrl = '';
            switch(eventType) {
                case 'event1': // RestaurantWeek Moscow
                case 'event2': // RestaurantWeek Dubai RU
                    webhookUrl = 'https://script.google.com/macros/s/AKfycbwzUnZNxkO70ArNKDAcGo2JJw0ziRh31MJcr07EyRBSA-SFgpGdFk91KMvd-JykaVcECw/exec';
                    break;
                case 'event3': // RestaurantWeek Dubai ENG
                    webhookUrl = 'https://script.google.com/macros/s/AKfycbzb78Q3FMc-lbzHWE90xQJXN20StEaPpMBA0INW0Sm8-XBsmdiUagsIc-MNMP34vKhDLw/exec';
                    break;
                case 'event4': // SalonWeek Moscow
                case 'event5': // SalonWeek Dubai RU
                    webhookUrl = 'https://script.google.com/macros/s/AKfycbzQTm4hZAEQ06l5E8rrGr-HH6hV4DNdArv0nHaM2GxMcSqXNCMWk29J2soNbRH9nwU2yw/exec';
                    break;
                case 'event6': // SalonWeek Dubai ENG
                    webhookUrl = 'https://script.google.com/macros/s/AKfycbwS7UG9JJfyUEHon9HIROivB1lhmsbKbrMaMRjTp6Z0IiA1-TdIvIVTuTL25IanpXKX/exec';
                    break;
            }

            // Отправляем запрос в режиме no-cors
            await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    event: eventType,
                    promoCode: currentPromoCode
                }),
                mode: 'no-cors' // Режим no-cors, чтобы не ожидать ответа
            });

            // Показываем сообщение об успехе без URL
            showSuccess();
            // Очищаем поле ввода
            promoCodeInput.value = '';
            promoDisplay.textContent = '';
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

    function showSuccess() {
        resultDiv.innerHTML = `
            <div class="success">
                Промокод успешно создан!
                <p>Таблица добавлена в Google Drive.</p>
            </div>
        `;
    }

    function showError(message) {
        resultDiv.innerHTML = `
            <div class="error">${message}</div>
        `;
    }
});