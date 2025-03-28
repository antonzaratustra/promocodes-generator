// Функция для обработки маршрутов
function handleRoute() {
    // Получаем путь из URL
    const path = window.location.pathname;
    const pathParts = path.split('/').filter(part => part);

    // Если путь пустой - мы на главной
    if (pathParts.length === 0) {
        return;
    }

    // Если путь соответствует формату /[EVENT_CODE]/[YEAR]/[PROMO_CODE]
    if (pathParts.length === 3) {
        const [eventCode, year, promoCode] = pathParts;
        loadReferralPage(eventCode, year, promoCode);
    }
}

// Функция для загрузки страницы рефералов
function loadReferralPage(eventCode, year, promoCode) {
    // Сохраняем параметры в URL без перезагрузки страницы
    const params = new URLSearchParams({ event: eventCode, year: year, promo: promoCode });
    window.history.pushState({}, '', `referrals.html?${params.toString()}`);
    
    // Загружаем страницу рефералов
    window.location.href = `referrals.html?${params.toString()}`;
}

// Функция для отображения ошибки
function showErrorPage(message) {
    document.body.innerHTML = `
        <div class="error-page">
            <h1>Ошибка</h1>
            <p>${message}</p>
            <a href="/" class="error-link">Вернуться на главную</a>
        </div>
    `;
    
    // Добавляем стили для страницы ошибки
    const style = document.createElement('style');
    style.textContent = `
        .error-page {
            max-width: 600px;
            margin: 100px auto;
            text-align: center;
            padding: 30px;
            background-color: #f8f9fa;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .error-page h1 {
            color: #e74c3c;
            margin-bottom: 20px;
        }
        
        .error-link {
            display: inline-block;
            margin-top: 20px;
            background-color: #3498db;
            color: white;
            padding: 10px 20px;
            border-radius: 4px;
            text-decoration: none;
        }
        
        .error-link:hover {
            background-color: #2980b9;
        }
    `;
    document.head.appendChild(style);
}

// Обработка изменения URL
window.addEventListener('popstate', handleRoute);
handleRoute(); 