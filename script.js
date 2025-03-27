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
            const response = await fetch('YOUR_WEBHOOK_URL', {
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
                resultDiv.innerHTML = `
                    <p>Промокод успешно создан!</p>
                    <p>Ссылка на таблицу: <a href="${data.spreadsheetUrl}" target="_blank">${data.spreadsheetUrl}</a></p>
                `;
            } else {
                throw new Error('Ошибка при создании промокода');
            }
        } catch (error) {
            resultDiv.innerHTML = `
                <p style="color: red;">Ошибка: ${error.message}</p>
            `;
        }
    }

    // Обработчик кнопки создания
    createButton.addEventListener('click', function() {
        const selectedEvent = eventSelect.value;
        if (!currentPromoCode.trim()) {
            resultDiv.innerHTML = `
                <p style="color: red;">Пожалуйста, введите промокод</p>
            `;
            return;
        }

        sendWebhook(selectedEvent);
    });
});
