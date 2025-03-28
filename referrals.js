document.addEventListener('DOMContentLoaded', function() {
    // Получаем параметры из URL
    const urlParams = new URLSearchParams(window.location.search);
    const eventCode = urlParams.get('event');
    const year = urlParams.get('year');
    const promoCode = urlParams.get('promo');
    
    if (!eventCode || !year || !promoCode) {
        showError('Отсутствуют необходимые параметры в URL');
        return;
    }
    
    // Заполняем информацию
    document.getElementById('eventTitle').textContent = getEventNameByCode(eventCode);
    document.getElementById('yearInfo').textContent = year;
    document.getElementById('promoInfo').textContent = promoCode;
    
    // Получаем данные
    fetchReferralData(eventCode, year, promoCode);
    
    // Функция для преобразования кода мероприятия в читаемое название
    function getEventNameByCode(code) {
        const eventNames = {
            'MRWRU': 'RestaurantWeek Moscow',
            'DRWRU': 'RestaurantWeek Dubai',
            'DRWEN': 'RestaurantWeek Dubai',
            'MSWRU': 'SalonWeek Moscow',
            'DSWRU': 'SalonWeek Dubai',
            'DSWEN': 'SalonWeek Dubai'
        };
        
        return eventNames[code] || 'Неизвестное мероприятие';
    }
    
    // Функция для получения данных рефералов
    async function fetchReferralData(eventCode, year, promoCode) {
        try {
            const dataUrl = getDataUrl(eventCode);
            const tableBody = document.getElementById('referralsTableBody');
            tableBody.innerHTML = `<tr><td colspan="9" class="loading-cell">Загрузка данных...</td></tr>`;
            
            const response = await fetch(`${dataUrl}?eventCode=${eventCode}&year=${year}&promoCode=${promoCode}`, {
                method: 'GET',
                mode: 'no-cors'
            });
            
            let data;
            
            try {
                const jsonResponse = await response.json();
                console.log('Ответ от API:', jsonResponse);
                
                if (jsonResponse.error) {
                    throw new Error(jsonResponse.error);
                }
                
                if (jsonResponse.success && jsonResponse.data) {
                    data = jsonResponse.data;
                } else {
                    console.warn('Данные не получены, используем тестовые данные');
                    data = getMockData(eventCode);
                }
            } catch (parseError) {
                console.error('Ошибка парсинга ответа:', parseError);
                data = getMockData(eventCode);
            }
            
            if (validateData(data)) {
                renderReferralsTable(data, eventCode);
                updateStats(data, eventCode);
            } else {
                console.warn('Некоторые данные не прошли валидацию');
            }
            
        } catch (error) {
            console.error('Ошибка запроса:', error);
            showError('Ошибка загрузки данных: ' + error.message);
        }
    }
    
    // Функция для определения URL получения данных
    function getDataUrl(eventCode) {
        switch(eventCode) {
            case 'MRWRU':
            case 'DRWRU':
                return 'https://script.google.com/macros/s/AKfycbw1OX4UDGmlZzmE1TMj0ZY5-H1zHdoMzmUv7zUryczOGyhMONBzoCbhnNESaHjRBAY89A/exec';
            case 'DRWEN':
                return 'https://script.google.com/macros/s/AKfycbw1OX4UDGmlZzmE1TMj0ZY5-H1zHdoMzmUv7zUryczOGyhMONBzoCbhnNESaHjRBAY89A/exec';
            case 'MSWRU':
            case 'DSWRU':
                return 'https://script.google.com/macros/s/AKfycbwe5iDg_rmBd7thFQyt49QY-pTOQ4w7HSHz1eJWHKcuAERBC3j_u8lY8QSpKJUo0K45Sw/exec';
            case 'DSWEN':
                return 'https://script.google.com/macros/s/AKfycbyPiPe_a0iQdPYKeEFsBAMfGKbMqxRqJgOnevV8KL0pFBWlWLrTnbRG_VQ50t42DXNV/exec';
            default:
                throw new Error('Неизвестный тип мероприятия');
        }
    }
    
    // Функция для отображения таблицы рефералов
    function renderReferralsTable(data, eventCode) {
        const tableBody = document.getElementById('referralsTableBody');
        tableBody.innerHTML = '';
        
        if (!data || data.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="9">Данные не найдены</td></tr>`;
            return;
        }
        
        // Определяем валюту в зависимости от кода мероприятия
        const currency = eventCode.endsWith('EN') ? '$' : '₽';
        
        data.forEach(item => {
            const row = document.createElement('tr');
            
            // Рассчитываем выплату как 5% от цены
            const commission = parseFloat(item.price) * 0.05;
            
            // Обработка orderid
            const orderId = item.orderid ? String(item.orderid).toUpperCase() : '-';
            
            row.innerHTML = `
                <td>${formatDate(item.sent)}</td>
                <td>${orderId}</td>
                <td>${item.products || '-'}</td>
                <td>${item.name || '-'}</td>
                <td>${item.price} ${currency}</td>
                <td>${formatReferer(item.referer)}</td>
                <td>${item.email || '-'}</td>
                <td>${commission.toFixed(2)} ${currency}</td>
                <td>${item.isPaid ? '✅' : '⏳'}</td>
            `;
            
            tableBody.appendChild(row);
        });
    }
    
    // Функция для обновления статистики
    function updateStats(data, eventCode) {
        if (!data || data.length === 0) {
            document.getElementById('paidAmount').textContent = '0';
            document.getElementById('toPay').textContent = '0';
            document.getElementById('peopleReferred').textContent = '0';
            return;
        }
        
        // Определяем валюту
        const currency = eventCode.endsWith('EN') ? '$' : '₽';
        
        // Рассчитываем статистику
        const paidAmount = data
            .filter(item => item.isPaid)
            .reduce((sum, item) => sum + parseFloat(item.price) * 0.05, 0);
            
        const toPayAmount = data
            .filter(item => !item.isPaid)
            .reduce((sum, item) => sum + parseFloat(item.price) * 0.05, 0);
            
        const peopleCount = data.length;
        
        // Обновляем элементы на странице
        document.getElementById('paidAmount').textContent = `${paidAmount.toFixed(2)} ${currency}`;
        document.getElementById('toPay').textContent = `${toPayAmount.toFixed(2)} ${currency}`;
        document.getElementById('peopleReferred').textContent = peopleCount;
    }
    
    // Вспомогательные функции
    function formatDate(dateString) {
        if (!dateString) return '-';
        
        const date = new Date(dateString);
        return date.toLocaleString('ru-RU');
    }
    
    function formatReferer(url) {
        if (!url) return '-';
        
        // Сокращаем URL для более компактного отображения
        return url.replace(/https?:\/\/(www\.)?/, '').split('/')[0];
    }
    
    function showError(message) {
        const container = document.querySelector('.container');
        container.innerHTML = `
            <div class="error-container">
                <h2>Ошибка</h2>
                <p>${message}</p>
                <a href="/" class="button">Вернуться на главную</a>
            </div>
        `;
    }
    
    // Функция для получения тестовых данных (только для демонстрации)
    function getMockData(eventCode) {
        const isEnglish = eventCode.endsWith('EN');
        
        return [
            {
                sent: '2024-11-06 15:32:37',
                orderid: '6410618:1336588072',
                products: 'Ticket Test - 1x0 = 0',
                name: 'Test promocode',
                price: isEnglish ? '100' : '5000',
                referer: isEnglish ? 'https://dubaisalonweek.com/' : 'https://salonweek.ru/moscow',
                email: 'testsspromocode@gmail.com',
                isPaid: true
            },
            {
                sent: '2024-11-11 11:59:45',
                orderid: '6410618:6827327921',
                products: 'Premium Ticket - 1x200 = 200',
                name: 'Shahinaz',
                price: isEnglish ? '200' : '10000',
                referer: isEnglish ? 'https://dubaisalonweek.com/#price' : 'https://restaurantweek.ru/dubai',
                email: 'shahinaz@example.com',
                isPaid: false
            }
        ];
    }

    function validateData(data) {
        if (!Array.isArray(data)) {
            console.error('Данные должны быть массивом');
            return false;
        }

        for (const item of data) {
            if (typeof item.orderid !== 'string') {
                console.error('orderid должен быть строкой:', item.orderid);
                return false;
            }
            if (isNaN(parseFloat(item.price))) {
                console.error('price должен быть числом:', item.price);
                return false;
            }
            if (typeof item.products !== 'string') {
                console.error('products должен быть строкой:', item.products);
                return false;
            }
            if (typeof item.name !== 'string') {
                console.error('name должен быть строкой:', item.name);
                return false;
            }
            if (typeof item.referer !== 'string') {
                console.error('referer должен быть строкой:', item.referer);
                return false;
            }
            if (typeof item.email !== 'string') {
                console.error('email должен быть строкой:', item.email);
                return false;
            }
            if (typeof item.isPaid !== 'boolean') {
                console.error('isPaid должен быть булевым значением:', item.isPaid);
                return false;
            }
        }

        return true;
    }
}); 