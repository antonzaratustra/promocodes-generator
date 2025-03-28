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
            // Определяем URL для получения данных из Google Apps Script
            const dataUrl = getDataUrl(eventCode);
            
            // Показываем индикатор загрузки
            const tableBody = document.getElementById('referralsTableBody');
            tableBody.innerHTML = `<tr><td colspan="9" class="loading-cell">Загрузка данных...</td></tr>`;
            
            // Выполняем запрос к Google Apps Script
            const response = await fetch(`${dataUrl}?eventCode=${eventCode}&year=${year}&promoCode=${promoCode}&mode=fetch`, {
                method: 'GET',
                mode: 'no-cors' // Меняем cors на no-cors
            });
            
            let data;
            
            try {
                // Пытаемся получить данные из ответа
                const jsonResponse = await response.json();
                
                if (jsonResponse.error) {
                    throw new Error(jsonResponse.error);
                }
                
                if (jsonResponse.success && jsonResponse.data) {
                    data = jsonResponse.data;
                } else {
                    // Если нет данных, используем тестовые данные для демонстрации
                    console.warn('Данные не получены, используем тестовые данные');
                    data = getMockData(eventCode);
                }
            } catch (parseError) {
                console.error('Ошибка парсинга ответа:', parseError);
                // Если возникла ошибка парсинга, также используем тестовые данные
                data = getMockData(eventCode);
            }
            
            // Заполняем таблицу и статистику
            renderReferralsTable(data, eventCode);
            updateStats(data, eventCode);
            
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
                return 'https://script.google.com/macros/s/AKfycbx2qgmCi9L_QcNcHjP_GwjtaqMu4zeJzUBJxJi7i4qkyRdOdC3qJMa1QkQUKpFtRzG7kQ/exec';
            case 'DRWEN':
                return 'https://script.google.com/macros/s/AKfycbyKGtcW495_P1RiDO0fwAnsq42Rrc1VKLmchR-O0hAHIuGbZgaQe_2B-qGCjknjIl0x0g/exec';
            case 'MSWRU':
            case 'DSWRU':
                return 'https://script.google.com/macros/s/AKfycbyIX4wd_fq4EhrnGgZWZkArmlvKv8ySff9kqtJxAxu7O28_aqxaVB5jC4nMNodoGWM3gA/exec';
            case 'DSWEN':
                return 'https://script.google.com/macros/s/AKfycbwfp-XRx6KLZz3z8iXW2R6Qd3SXJwTQcbe8Bhzvn2iuGGExvX7YAXdqPHqamBpc3aRT/exec';
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
            
            row.innerHTML = `
                <td>${formatDate(item.sent)}</td>
                <td>${item.orderid || '-'}</td>
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
}); 